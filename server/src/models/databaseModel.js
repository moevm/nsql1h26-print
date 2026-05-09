import fs from 'fs/promises';
import path from 'path';
import { getSession } from '../config/db.js';

const LABEL_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;
const TYPE_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;

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

const sanitizeLabels = (labels) => {
    if (!Array.isArray(labels)) return [];
    return labels.filter((label) => LABEL_RE.test(label));
};

const sanitizeRelationshipType = (type) => {
    if (!TYPE_RE.test(type)) {
        throw new Error(`Некорректный тип связи: ${type}`);
    }
    return type;
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

    countNodes: async () => {
        const session = getSession();
        try {
            const result = await session.run('MATCH (n) RETURN count(n) AS total');
            return toPrimitive(result.records[0].get('total'));
        } finally {
            await session.close();
        }
    },

    createImportExportLog: async ({ adminUserId, operationType, status }) => {
        const session = getSession();

        try {
            const primaryResult = await session.run(
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

            if (primaryResult.records.length > 0) {
                return true;
            }

            const fallbackResult = await session.run(
                `MATCH (a:User {role: 'admin'})
                 WITH a LIMIT 1
                 CREATE (l:ImportExportLogs {
                    log_id: randomUUID(),
                    operation_type: $operationType,
                    status: $status,
                    created_at: datetime()
                 })
                 CREATE (a)-[:INITIATED_OPERATION]->(l)
                 RETURN l`,
                { operationType, status }
            );

            return fallbackResult.records.length > 0;
        } finally {
            await session.close();
        }
    },

    importFromPayload: async (payload, adminUserId = null) => {
        if (!payload || !Array.isArray(payload.nodes) || !Array.isArray(payload.relationships)) {
            throw new Error('Некорректный формат файла импорта. Ожидается { nodes: [], relationships: [] }');
        }
        const session = getSession();
        try {
            await session.run('MATCH (n) DETACH DELETE n');
            const idMap = new Map();

            for (const node of payload.nodes) {
                const labels = sanitizeLabels(node.labels);
                const labelsClause = labels.length > 0 ? `:${labels.join(':')}` : '';
                const properties = node.properties && typeof node.properties === 'object' ? node.properties : {};

                const createNodeQuery = `CREATE (n${labelsClause}) SET n = $properties RETURN id(n) AS new_id`;
                const nodeResult = await session.run(createNodeQuery, { properties });
                const newId = toPrimitive(nodeResult.records[0].get('new_id'));

                idMap.set(String(node.internal_id), newId);
            }

            for (const relation of payload.relationships) {
                const relType = sanitizeRelationshipType(relation.type);
                const fromId = idMap.get(String(relation.from_internal_id));
                const toId = idMap.get(String(relation.to_internal_id));

                if (fromId === undefined || toId === undefined) {
                    continue;
                }

                const properties = relation.properties && typeof relation.properties === 'object'
                    ? relation.properties
                    : {};

                const createRelQuery =
                    `MATCH (a), (b)
                     WHERE id(a) = $fromId AND id(b) = $toId
                     CREATE (a)-[r:${relType}]->(b)
                     SET r = $properties
                     RETURN id(r) AS rel_id`;

                await session.run(createRelQuery, { fromId, toId, properties });
            }

            if (adminUserId) {
                await session.run(
                    `MATCH (a:User {user_id: $adminUserId})
                     CREATE (l:ImportExportLogs {
                        log_id: randomUUID(),
                        operation_type: 'import',
                        status: 'success',
                        created_at: datetime()
                     })
                     CREATE (a)-[:INITIATED_OPERATION]->(l)`,
                    { adminUserId }
                );
            }
            return {
                imported_nodes: payload.nodes.length,
                imported_relationships: payload.relationships.length
            };
        } finally {
            await session.close();
        }
    },

    importFromFileIfEmpty: async (filePath) => {
        const totalNodes = await Database.countNodes();
        if (totalNodes > 0) {
            return { imported: false, reason: 'db_not_empty' };
        }
        const absolutePath = path.resolve(filePath);
        const raw = await fs.readFile(absolutePath, 'utf-8');
        const payload = JSON.parse(raw);
        const stats = await Database.importFromPayload(payload, null);
        return { imported: true, file_path: absolutePath, ...stats };
    }
};
