import { getSession } from '../config/db.js';
const formatProperties = (properties) => {
    const formatted = { ...properties };
    const dateFields = ['deactivated_at', 'changed_at'];

    dateFields.forEach(field => {
        if (formatted[field] && typeof formatted[field].toString === 'function') {
            formatted[field] = formatted[field].toString();
        }
    });
    return formatted;
};

export const Service = {
    find: async (filters = {}) => {
        const session = getSession();
        try {
            const params = {};
            const clauses = ['s.deactivated_at IS NULL'];

            if (filters.service_type) {
                clauses.push('s.service_type = $service_type');
                params.service_type = filters.service_type;
            }

            if (filters.color_mode) {
                clauses.push('s.color_mode = $color_mode');
                params.color_mode = filters.color_mode;
            }

            if (filters.min_price !== undefined) {
                clauses.push('s.base_price >= $min_price');
                params.min_price = parseFloat(filters.min_price);
            }
            if (filters.max_price !== undefined) {
                clauses.push('s.base_price <= $max_price');
                params.max_price = parseFloat(filters.max_price);
            }

            if (filters.circulation) {
                const circ = parseInt(filters.circulation);
                clauses.push('s.start_circulation <= $circ AND s.end_circulation >= $circ');
                params.circ = circ;
            }

            const query = `
                MATCH (s:Service) 
                WHERE ${clauses.join(' AND ')} 
                RETURN s 
                ORDER BY s.service_type ASC, s.base_price ASC
            `;

            const result = await session.run(query, params);
            return result.records.map(record => formatProperties(record.get('s').properties));
        } finally {
            await session.close();
        }
    },

    create: async (data) => {
        const session = getSession();
        try {
            const typeLabel = data.service_type.charAt(0).toUpperCase() + data.service_type.slice(1);

            const result = await session.run(
                `CREATE (s:Service:${typeLabel})
                 SET s = $props,
                     s.service_id = randomUUID(),
                     s.changed_at = datetime(),
                     s.deactivated_at = null
                 RETURN s`,
                { props: data }
            );
            return formatProperties(result.records[0].get('s').properties);
        } finally {
            await session.close();
        }
    },

    update: async (service_id, data) => {
        const session = getSession();
        try {
            const updateData = { ...data };
            if (updateData.deactivated_at === true) {
                updateData.deactivated_at = new Date().toISOString();
            }
            const updateQuery = updateData.base_price
                ? 'MATCH (s:Service {service_id: $service_id}) SET s += $, s.changed_at = datetime() RETURN s'
                : 'MATCH (s:Service {service_id: $service_id}) SET s += $data RETURN s';
            const result = await session.run(updateQuery, { service_id, data: updateData });
            if (result.records.length === 0) return null;
            return formatProperties(result.records[0].get('s').properties);
        } finally {
            await session.close();
        }
    },

    findById: async (service_id) => {
        const session = getSession();
        try {
            const result = await session.run(
                'MATCH (s:Service {service_id: $service_id}) RETURN s',
                { service_id }
            );
            if (result.records.length === 0) return null;
            return formatProperties(result.records[0].get('s').properties);
        } finally {
            await session.close();
        }
    }
};
