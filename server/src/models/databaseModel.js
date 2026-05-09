import { getSession } from '../config/db.js';

const toPrimitive = (value) => {
    if (value && typeof value.toNumber === 'function') {
        return value.toNumber();
    }

    if (Array.isArray(value)) {
        return value.map(toPrimitive);
    }

    if (value && typeof value === 'object') {
        if (typeof value.toString === 'function' && value.constructor && value.constructor.name === 'DateTime') {
            return value.toString();
        }

        const mapped = {};
        for (const [key, nested] of Object.entries(value)) {
            mapped[key] = toPrimitive(nested);
        }
        return mapped;
    }

    return value;
};

export const Database = {
    exportAll: async () => {
        const session = getSession();

        try {
            const nodesResult = await session.run(
                `MATCH (n)
                 RETURN id(n) AS internal_id, labels(n) AS labels, properties(n) AS properties
                 ORDER BY internal_id`
            );

            const relationshipsResult = await session.run(
                `MATCH (a)-[r]->(b)
                 RETURN id(r) AS internal_id,
                        type(r) AS type,
                        id(a) AS from_internal_id,
                        id(b) AS to_internal_id,
                        properties(r) AS properties
                 ORDER BY internal_id`
            );

            const nodes = nodesResult.records.map((record) => ({
                internal_id: toPrimitive(record.get('internal_id')),
                labels: toPrimitive(record.get('labels')),
                properties: toPrimitive(record.get('properties'))
            }));

            const relationships = relationshipsResult.records.map((record) => ({
                internal_id: toPrimitive(record.get('internal_id')),
                type: toPrimitive(record.get('type')),
                from_internal_id: toPrimitive(record.get('from_internal_id')),
                to_internal_id: toPrimitive(record.get('to_internal_id')),
                properties: toPrimitive(record.get('properties'))
            }));

            return { nodes, relationships };
        } finally {
            await session.close();
        }
    },

    createImportExportLog: async ({ adminUserId, operationType, status }) => {
        const session = getSession();

        try {
            const result = await session.run(
                `MATCH (a:User {user_id: $adminUserId})
                 CREATE (l:ImportExportLogs {
                    log_id: randomUUID(),
                    operation_type: $operationType,
                    status: $status,
                    created_at: datetime()
                 })
                 CREATE (a)-[:INITIATED_OPERATION]->(l)
                 RETURN l`,
                { adminUserId, operationType, status }
            );

            return result.records.length > 0;
        } finally {
            await session.close();
        }
    }
};
