import { getSession } from '../config/db.js';

const formatProperties = (properties) => {
    const formatted = { ...properties };
    ['created_at', 'deactivated_at', 'changed_at'].forEach(field => {
        if (formatted[field] && typeof formatted[field].toString === 'function') {
            formatted[field] = formatted[field].toString();
        }
    });
    return formatted;
};

export const User = {
    create: async (userData) => {
        const session = getSession();
        try {
            const result = await session.run(
                `MERGE (u:User {email: $email})
                         ON CREATE SET 
                            u.user_id = randomUUID(),
                            u.password_hash = $password_hash,
                            u.email = $email,
                            u.first_name = $first_name,
                            u.last_name = $last_name,
                            u.phone = $phone,
                            u.role = $role,
                            u.created_at = datetime(),
                            u.changed_at = datetime(),
                            u.deactivated_at = null
                         RETURN u, (u.created_at IS NOT NULL) as is_new`,
                {
                    email: userData.email,
                    password_hash: userData.password_hash,
                    first_name: userData.first_name,
                    last_name: userData.last_name,
                    phone: userData.phone || null,
                    role: userData.role || 'client'
                }
            );

            const record = result.records[0];
            if (!record.get('is_new')) throw new Error('User already exists');
            return formatProperties(record.get('u').properties);
        } finally {
            await session.close();
        }
    },

    find: async (filters = {}) => {
        const session = getSession();
        try {
            const page = parseInt(filters.page, 10) || 1;
            const limit = parseInt(filters.limit, 10) || 10;
            const skip = (page - 1) * limit;

            let query = 'MATCH (u:User)';
            const params = {};
            const clauses = [];

            if (filters.first_name) {
                clauses.push('toLower(u.first_name) CONTAINS toLower($first_name)');
                params.first_name = filters.first_name;
            }
            if (filters.role) {
                clauses.push('toLower(u.role) = toLower($role)');
                params.role = filters.role;
            }

            if (filters.last_name) {
                clauses.push('toLower(u.last_name) CONTAINS toLower($last_name)');
                params.last_name = filters.last_name;
            }

            if (filters.is_active !== undefined) {
                if (filters.is_active === 'true' || filters.is_active === true) {
                    clauses.push('u.deactivated_at IS NULL');
                } else {
                    clauses.push('u.deactivated_at IS NOT NULL');
                }
            }

            if (filters.email) {
                clauses.push('toLower(u.email) CONTAINS toLower($email)');
                params.email = filters.email;
            }
            if (filters.phone) {
                clauses.push('toLower(u.phone) CONTAINS toLower($phone)');
                params.phone = filters.phone;
            }
            if (filters.user_id) {
                clauses.push('toLower(u.user_id) CONTAINS toLower($user_id)');
                params.user_id = filters.user_id;
            }
            if (filters.created_from) {
                clauses.push('u.created_at >= datetime($created_from)');
                params.created_from = filters.created_from;
            }
            if (filters.created_to) {
                clauses.push('u.created_at <= datetime($created_to)');
                params.created_to = filters.created_to;
            }

            if (clauses.length > 0) {
                query += ' WHERE ' + clauses.join(' AND ');
            }

            query += `
                WITH u 
                ORDER BY u.created_at DESC
                WITH count(u) as total, collect(u) as all_users
                RETURN total, all_users[$skip..$skip+$limit] as paged_users`;

            params.skip = session.int ? session.int(skip) : skip;
            params.limit = session.int ? session.int(limit) : limit;

            const result = await session.run(query, params);

            if (result.records.length === 0) {
                return { total: 0, items: [] };
            }

            const record = result.records[0];
            const total = Number(record.get('total'));
            const pagedUsers = record.get('paged_users') || [];

            const items = pagedUsers.map(node => formatProperties(node.properties));

            return { total, items };
        } finally {
            await session.close();
        }
    },

    findOne: async (criteria) => {
        const session = getSession();
        try {
            const result = await session.run(
                `MATCH (u:User {email: $email}) 
                 WHERE u.deactivated_at IS NULL
                 RETURN u`,
                criteria
            );
            if (result.records.length === 0) return null;
            return formatProperties(result.records[0].get('u').properties);
        } finally {
            await session.close();
        }
    },

    findById: async (user_id) => {
        const session = getSession();
        try {
            const result = await session.run(
                `MATCH (u:User {user_id: $user_id})
                
                OPTIONAL MATCH (u)-[:PLACED_ORDER]->(o_created:Order)
                WITH u, 
                    coalesce(sum(o_created.base_price * o_created.quantity * o_created.file_pages), 0) as total_created_sum,
                    max(o_created.created_at) as last_order_at
                
                OPTIONAL MATCH (u)<-[:CHANGED_BY]-(h_all:StatusHistory)
                WITH u, total_created_sum, last_order_at, max(h_all.changed_at) as last_status_change_at
                
                OPTIONAL MATCH (u)<-[:CHANGED_BY]-(h_ready:StatusHistory {new_status: 'ready'})<-[:HAS_STATUS_HISTORY]-(o_ready:Order)
                WHERE o_ready.status IN ['ready', 'completed']
                WITH u, total_created_sum, last_order_at, last_status_change_at, collect(DISTINCT o_ready) as distinct_orders
                
                WITH u, total_created_sum, last_order_at, last_status_change_at,
                    reduce(total = 0, o IN distinct_orders | total + coalesce(o.base_price * o.quantity * o.file_pages, 0)) as total_processed_sum
                
                RETURN u, total_created_sum, last_order_at, last_status_change_at, total_processed_sum`,
                { user_id }
            );
            
            if (result.records.length === 0) return null;
            
            const record = result.records[0];
            const userData = formatProperties(record.get('u').properties);
            
            const lastOrderAt = record.get('last_order_at');
            const lastStatusChangeAt = record.get('last_status_change_at');
            
            const dates = [];
            if (lastOrderAt) dates.push(new Date(lastOrderAt).getTime());
            if (lastStatusChangeAt) dates.push(new Date(lastStatusChangeAt).getTime());
            
            const lastActionAt = dates.length > 0 
                ? new Date(Math.max(...dates)).toISOString() 
                : null;
            
            userData.last_order_at = lastOrderAt ? new Date(lastOrderAt).toISOString() : null;
            userData.last_status_change_at = lastStatusChangeAt ? new Date(lastStatusChangeAt).toISOString() : null;
            userData.last_action_at = lastActionAt;
            userData.total_created_sum = Number(record.get('total_created_sum') || 0);
            userData.total_processed_sum = Number(record.get('total_processed_sum') || 0);
            
            return userData;
        } finally {
            await session.close();
        }
    },

    updateById: async (user_id, data) => {
        const session = getSession();
        try {
            const updateData = { 
                ...data,
                changed_at: new Date().toISOString()
            };

            if (updateData.deactivated_at === true) {
                updateData.deactivated_at = new Date().toISOString();
            }

            const result = await session.run(
                'MATCH (u:User {user_id: $user_id}) SET u += $data RETURN u',
                { user_id, data: updateData }
            );
            if (result.records.length === 0) return null;
            return formatProperties(result.records[0].get('u').properties);
        } finally {
            await session.close();
        }
    }
};
