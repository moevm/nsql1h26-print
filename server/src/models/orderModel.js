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

            CREATE (h:StatusHistory {
                history_id: randomUUID(),
                new_status: 'pending',
                changed_at: datetime(),
                notes: 'initial status'
            })
            CREATE (o)-[:HAS_STATUS_HISTORY]->(h)
            CREATE (h)-[:CHANGED_BY]->(u)
            RETURN o, h, o.base_price * o.quantity * o.file_pages AS total_amount`,
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
            const record = result.records[0];
            return {
                ...formatProperties(record.get('o').properties),
                total_amount: toNumeric(result.records[0].get('total_amount')),
                status_history: [
                    {
                        ...formatProperties(record.get('h').properties),
                        user_id: userId
                    }
                ]
            };
        } finally {
            await session.close();
        }
    },

    find: async (filters = {}) => {
        const session = getSession();
        try {
            let query = 'MATCH (u:User)-[:PLACED_ORDER]->(o:Order)-[:FOR_SERVICE]->(s:Service)';
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
            if (filters.orderId) {
                clauses.push('o.order_id CONTAINS $orderId');
                params.orderId = filters.orderId;
            }

            if (filters.service_type) {
                clauses.push(`
                    toLower(s.service_type) CONTAINS toLower($service_type)
                    OR CASE s.service_type
                        WHEN 'print' THEN 'печать'
                        WHEN 'scan' THEN 'сканирование'
                        WHEN 'risography' THEN 'ризография'
                        ELSE ''
                    END CONTAINS toLower($service_type)
                `);
                params.service_type = filters.service_type;
            }

            if (filters.min_quantity !== undefined) {
                clauses.push('o.quantity >= $min_quantity');
                params.min_quantity = parseInt(filters.min_quantity);
            }
            if (filters.max_quantity !== undefined) {
                clauses.push('o.quantity <= $max_quantity');
                params.max_quantity = parseInt(filters.max_quantity);
            }
            if (filters.min_price !== undefined) {
                clauses.push('o.total_price >= $min_price');
                params.min_price = parseFloat(filters.min_price);
            }
            if (filters.max_price !== undefined) {
                clauses.push('o.total_price <= $max_price');
                params.max_price = parseFloat(filters.max_price);
            }
            if (filters.min_file_size !== undefined) {
                clauses.push('o.file_size >= $min_file_size');
                params.min_file_size = parseInt(filters.min_file_size);
            }
            if (filters.max_file_size !== undefined) {
                clauses.push('o.file_size <= $max_file_size');
                params.max_file_size = parseInt(filters.max_file_size);
            }
            if (filters.min_pages !== undefined) {
                clauses.push('o.file_pages >= $min_pages');
                params.min_pages = parseInt(filters.min_pages);
            }
            if (filters.max_pages !== undefined) {
                clauses.push('o.file_pages <= $max_pages');
                params.max_pages = parseInt(filters.max_pages);
            }

            if (filters.file_name) {
                clauses.push('toLower(o.file_name) CONTAINS toLower($file_name)');
                params.file_name = filters.file_name;
            }
            if (filters.notes) {
                clauses.push('toLower(o.notes) CONTAINS toLower($notes)');
                params.notes = filters.notes;
            }
            if (filters.user_email) {
                clauses.push('toLower(u.email) CONTAINS toLower($user_email)');
                params.user_email = filters.user_email;
            }

            if (filters.format) {
                clauses.push('toLower(o.parameters.format) CONTAINS toLower($format)');
                params.format = filters.format;
            }
            if (filters.color_mode) {
                clauses.push('o.parameters.color_mode = $color_mode');
                params.color_mode = filters.color_mode;
            }
            if (filters.paper_type) {
                clauses.push('toLower(o.parameters.paper_type) CONTAINS toLower($paper_type)');
                params.paper_type = filters.paper_type;
            }

            if (filters.date_from) {
                clauses.push('o.created_at >= datetime($date_from)');
                params.date_from = filters.date_from;
            }
            if (filters.date_to) {
                clauses.push('o.created_at <= datetime($date_to)');
                params.date_to = filters.date_to;
            }

            if (clauses.length > 0) {
                query += ' WHERE ' + clauses.join(' AND ');
            }
            
            query += ` RETURN o, 
                    u.email as user_email, 
                    u.user_id as user_id, 
                    u.first_name as user_first_name,
                    u.last_name as user_last_name,
                    s.service_type as service_type 
                    ORDER BY o.created_at DESC`;

            const result = await session.run(query, params);

            return result.records.map(record => ({
                ...formatProperties(record.get('o').properties),
                user_email: record.get('user_email'),
                user_id: record.get('user_id'),
                user_first_name: record.get('user_first_name'),
                user_last_name: record.get('user_last_name'),
                service_type: record.get('service_type')
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
            OPTIONAL MATCH (h)-[:CHANGED_BY]->(actor:User)
            WITH o, u, s, h, actor
            ORDER BY h.changed_at DESC
            WITH o, u, s,
            collect(
                CASE WHEN h IS NULL THEN null
                ELSE {
                    history_id: h.history_id,
                    changed_at: toString(h.changed_at),
                    notes: h.notes,
                    new_status: h.new_status,
                    user_id: actor.user_id,
                    user_name: actor.first_name + ' ' + actor.last_name
                }
                END
            ) AS status_history
            RETURN
                u.user_id AS user_id,
                u.email AS user_email,
                o,
                s.service_type AS service_type,
                status_history,
                o.base_price * o.quantity * o.file_pages AS total_amount`,
                { orderId }
            );
            const record = result.records[0];
            const history = (record.get('status_history') || [])
                .filter(Boolean);
            return {
                ...formatProperties(record.get('o').properties),
                total_amount: toNumeric(record.get('total_amount')),
                user_email: record.get('user_email'),
                service_type: record.get('service_type'),
                status_history: history
            };
        } finally {
            await session.close();
        }
    },

    update: async (orderId, updateData, userId) => {
        const session = getSession();
        try {
            const status = updateData.status;
            const notes = updateData.notes || '';
            const result = await session.run(
                `MATCH (o:Order {order_id: $orderId})
            MATCH (u:User {user_id: $userId})
            WITH o, u
            SET o.status = $status
            CREATE (h:StatusHistory {
                history_id: randomUUID(),
                new_status: $status,
                changed_at: datetime(),
                notes: $notes
            })
            CREATE (o)-[:HAS_STATUS_HISTORY]->(h)
            CREATE (h)-[:CHANGED_BY]->(u)
            RETURN o, h, u`,
                {
                    orderId,
                    userId,
                    status,
                    notes
                }
            );
            if (result.records.length === 0) return null;
            const record = result.records[0];
            return {
                ...formatProperties(record.get('o').properties),
                status_history: [
                    {
                        ...formatProperties(record.get('h').properties),
                        user_id: userId
                    }
                ]
            };
        } finally {
            await session.close();
        }
    }
};
