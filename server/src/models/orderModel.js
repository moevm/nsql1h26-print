import { getSession } from '../config/db.js';

const toNumeric = (value) => {
    if (value && typeof value.toNumber === 'function') {
        return value.toNumber();
    }
    return value;
};

const formatProperties = (properties) => {
    const formatted = { ...properties };
    const dateFields = ['created_at', 'deactivated_at', 'changed_at'];
    const numberFields = ['quantity', 'file_size', 'file_pages', 'base_price'];
    dateFields.forEach(field => {
        if (formatted[field] && typeof formatted[field].toString === 'function') {
            formatted[field] = formatted[field].toString();
        }
    });
    numberFields.forEach(field => {
        if (formatted[field] !== undefined && formatted[field] !== null) {
            formatted[field] = toNumeric(formatted[field]);
        }
    });

    if (formatted.parameters && typeof formatted.parameters === 'string') {
        try {
            formatted.parameters = JSON.parse(formatted.parameters);
        } catch (e) {
            formatted.parameters = {};
        }
    }

    return formatted;
};

export const Order = {
    create: async (userId, serviceId, orderData) => {
        const session = getSession();
        try {           
            const quantity = parseInt(orderData.quantity, 10);
            const result = await session.run(
                `MATCH (u:User {user_id: $userId})
                 MATCH (s:Service {service_id: $serviceId})
                CREATE (u)-[:PLACED_ORDER]->(o:Order {
                   order_id: randomUUID(),
                   quantity: $quantity,
                   parameters: $parameters,
                   notes: $notes,
                   status: 'pending',
                   file_name: $file_name,
                   file_size: $file_size,
                   file_pages: $file_pages,
                   base_price: toFloat(s.base_price),
                   created_at: datetime()
                })-[:FOR_SERVICE]->(s)
                RETURN o, o.base_price * o.quantity * o.file_pages AS total_amount`,
                {
                    userId,
                    serviceId,
                    quantity,
                    parameters: typeof orderData.parameters === 'string'
                        ? orderData.parameters
                        : JSON.stringify(orderData.parameters || {}),
                    notes: orderData.notes || '',
                    file_name: orderData.file_name || '',
                    file_size: parseInt(orderData.file_size || 0),
                    file_pages: parseInt(orderData.file_pages || 1)
                }
            );
            if (result.records.length === 0) {
                throw new Error('Пользователь или услуга не найдены');
            }
            return {
                ...formatProperties(result.records[0].get('o').properties),
                total_amount: toNumeric(result.records[0].get('total_amount'))
            };
        } finally {
            await session.close();
        }
    },

    find: async (filters = {}) => {
        const session = getSession();
        try {
            let query = 'MATCH (u:User)-[:PLACED_ORDER]->(o:Order)-[:FOR_SERVICE]->(s:Service) ';
            const params = {};
            const clauses = [];

            if (filters.status) {
                clauses.push('o.status = $status');
                params.status = filters.status;
            }

            if (filters.userId) {
                clauses.push('u.user_id = $userId');
                params.userId = filters.userId;
            }

            if (filters.service_type) {
                clauses.push(`
                    toLower(s.service_type) CONTAINS toLower($service_type)
                    OR
                    CASE s.service_type
                        WHEN 'print' THEN 'печать'
                        WHEN 'scan' THEN 'сканирование'
                        WHEN 'risography' THEN 'ризография'
                        ELSE ''
                    END CONTAINS toLower($service_type)
                `);

                params.service_type = filters.service_type;
            }

            if (filters.dateFrom) {
                clauses.push('o.created_at >= datetime($dateFrom)');
                params.dateFrom = filters.dateFrom;
            }
            if (filters.dateTo) {
                clauses.push('o.created_at <= datetime($dateTo)');
                params.dateTo = filters.dateTo;
            }

            if (clauses.length > 0) {
                query += ' WHERE ' + clauses.join(' AND ');
            }

            query += ` RETURN o,
                   u.email as user_email,
                   u.user_id as user_id,
                   s.service_type as service_type,
                   o.base_price * o.quantity * o.file_pages AS total_amount
                   ORDER BY o.created_at DESC`;

            const result = await session.run(query, params);

            return result.records.map(record => ({
                ...formatProperties(record.get('o').properties),
                user_email: record.get('user_email'),
                user_id: record.get('user_id'),
                service_type: record.get('service_type'),
                total_amount: toNumeric(record.get('total_amount'))
            }));
        } finally {
            await session.close();
        }
    },

    findById: async (orderId) => {
        const session = getSession();
        try {
            const result = await session.run(
                `MATCH (u:User)-[:PLACED_ORDER]->(o:Order {order_id: $orderId})-[:FOR_SERVICE]->(s:Service)
            OPTIONAL MATCH (o)-[:HAS_STATUS_HISTORY]->(h:StatusHistory)
            OPTIONAL MATCH (h)-[:INITIATED_STATUS_CHANGE]->(e:User)
            RETURN
                u.user_id AS user_id,
                u.email AS user_email,
                o.base_price * o.quantity * o.file_pages AS total_amount,
                o,
                s.service_type AS service_type,
                collect({
                    history_id: h.history_id,
                    changed_at: h.changed_at,
                    notes: h.notes,
                    new_status: h.new_status,
                    employee_id: e.user_id,
                    employee_name: e.first_name + ' ' + e.last_name
                }) AS status_history`,
                { orderId }
            );
            if (result.records.length === 0) return null;
            const record = result.records[0];
            return {
                ...formatProperties(record.get('o').properties),
                total_amount: toNumeric(record.get('total_amount')),
                user_email: record.get('user_email'),
                service_type: record.get('service_type'),
                status_history: record.get('status_history').map(item => ({
                    history_id: item.history_id,
                    changed_at: item.changed_at?.toString?.() || null,
                    notes: item.notes,
                    new_status: item.new_status,
                    employee_id: item.employee_id,
                    employee_name: item.employee_name
                }))
            };
        } finally {
            await session.close();
        }
    },

    update: async (orderId, updateData, employeeId) => {
        const session = getSession();
        try {
            const status = updateData.status;
            const notes = updateData.notes || '';
            const result = await session.run(
                `MATCH (o:Order {order_id: $orderId})
            OPTIONAL MATCH (e:User {user_id: $employeeId})
            WHERE e.role IN ["employee", "admin"]            
            WITH o, e, o.status AS old_status
            WHERE old_status <> $status
            SET o.status = $status
            CREATE (h:StatusHistory {
                history_id: randomUUID(),
                new_status: $status,
                old_status: old_status,
                changed_at: datetime(),
                notes: $notes
            })
            CREATE (o)-[:HAS_STATUS_HISTORY]->(h)
            FOREACH (_ IN CASE WHEN e IS NOT NULL THEN [1] ELSE [] END |
                CREATE (h)-[:INITIATED_STATUS_CHANGE]->(e)
            )
            RETURN 
                o,
                collect({
                    history_id: h.history_id,
                    new_status: h.new_status,
                    old_status: h.old_status,
                    changed_at: toString(h.changed_at),
                    notes: h.notes,
                    employee_id: e.user_id,
                    employee_name: e.first_name + ' ' + e.last_name
                }) AS status_history`,
                {
                    orderId,
                    employeeId,
                    status,
                    notes
                }
            );
            if (result.records.length === 0) return null;
            const record = result.records[0];
            return {
                ...formatProperties(record.get('o').properties),
                status_history: record.get('status_history')
            };
        } finally {
            await session.close();
        }
    }
};
