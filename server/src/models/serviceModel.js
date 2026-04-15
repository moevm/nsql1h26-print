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
    find: async () => {
        const session = getSession();
        try {
            const result = await session.run(
                'MATCH (s:Service) WHERE s.deactivated_at IS NULL RETURN s'
            );
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
