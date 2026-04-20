import { getSession } from '../config/db.js';

const formatProperties = (properties) => {
    const formatted = { ...properties };
    const dateFields = ['created_at', 'deactivated_at', 'changed_at'];
    dateFields.forEach(field => {
        if (formatted[field] && typeof formatted[field].toString === 'function') {
            formatted[field] = formatted[field].toString();
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
                    created_at: datetime()
                 })-[:FOR_SERVICE]->(s)
                 RETURN o`,
                {
                    userId,
                    serviceId,
                    quantity: parseInt(orderData.quantity),
                    parameters: JSON.stringify(orderData.parameters || {}),
                    notes: orderData.notes || '',
                    file_name: orderData.file_name || '',
                    file_size: parseInt(orderData.file_size || 0)
                }
            );
            return formatProperties(result.records[0].get('o').properties);
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
                clauses.push('toLower(s.service_type) CONTAINS toLower($service_type)');
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
                       s.service_type as service_type 
                       ORDER BY o.created_at DESC`;

            const result = await session.run(query, params);

            return result.records.map(record => ({
                ...formatProperties(record.get('o').properties),
                user_email: record.get('user_email'),
                user_id: record.get('user_id'),
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
                 RETURN o, u.email as user_email, s.service_type as service_name`,
                { orderId }
            );
            if (result.records.length === 0) return null;

            const record = result.records[0];
            return {
                ...formatProperties(record.get('o').properties),
                user_email: record.get('user_email'),
                service_name: record.get('service_name')
            };
        } finally {
            await session.close();
        }
    },

    update: async (orderId, updateData) => {
        const session = getSession();
        try {
            const data = { ...updateData };
            if (data.parameters) data.parameters = JSON.stringify(data.parameters);

            const result = await session.run(
                `MATCH (o:Order {order_id: $orderId})
                 SET o += $data
                 RETURN o`,
                { orderId, data }
            );
            if (result.records.length === 0) return null;
            return formatProperties(result.records[0].get('o').properties);
        } finally {
            await session.close();
        }
    }
};
