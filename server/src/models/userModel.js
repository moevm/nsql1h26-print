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
            let query = 'MATCH (u:User)';
            const params = {};
            const clauses = [];

            if (filters.first_name) {
                clauses.push('u.first_name CONTAINS $first_name');
                params.first_name = filters.first_name;
            }
            if (filters.role) {
                clauses.push('u.role = $role');
                params.role = filters.role;
            }

            if (filters.last_name) {
                clauses.push('u.last_name CONTAINS $last_name');
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
                clauses.push('u.email CONTAINS $email');
                params.email = filters.email;
            }
            if (filters.phone) {
                clauses.push('u.phone CONTAINS $phone');
                params.phone = filters.phone;
            }
            if (filters.user_id) {
                clauses.push('u.user_id CONTAINS $user_id');
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
            query += ' RETURN u';

            const result = await session.run(query, params);
            return result.records.map(record => formatProperties(record.get('u').properties));
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

        findByFilters: async (filters = {}) => {
        const session = getSession();
        try {
            const params = {};
            
            let query = 'MATCH (u:User)';
            const userClauses = [];

            if (filters.role) { userClauses.push('u.role = $role'); params.role = filters.role; }
            if (filters.deactivated !== undefined) {
                userClauses.push(filters.deactivated ? 'u.deactivated_at IS NOT NULL' : 'u.deactivated_at IS NULL');
            }
            if (filters.name) {
                userClauses.push('toLower(coalesce(u.first_name, "") + " " + coalesce(u.last_name, "")) CONTAINS toLower($name)');
                params.name = filters.name;
            }
            if (filters.email) {
                userClauses.push('toLower(u.email) CONTAINS toLower($email)');
                params.email = filters.email;
            }
            if (filters.from) { userClauses.push('u.created_at >= datetime($from)'); params.from = filters.from; }
            if (filters.to) { userClauses.push('u.created_at <= datetime($to)'); params.to = filters.to; }

            if (userClauses.length > 0) query += ' WHERE ' + userClauses.join(' AND ');

            query += `
                OPTIONAL MATCH (u)-[:PLACED_ORDER]->(o:Order)-[:FOR_SERVICE]->(s:Service)
                WITH u,
                     count(o) as order_count,
                     sum(
                         o.base_price * o.quantity * 
                         CASE WHEN s.service_type = 'scan' AND coalesce(o.file_pages, 0) = 0 THEN 1 
                              ELSE coalesce(o.file_pages, 1) END
                     ) as total_spent
            `;

            const sumClauses = [];
            let min = null, max = null;
            if (filters.minSum !== undefined && filters.minSum !== null && filters.minSum !== '') {
                min = parseFloat(filters.minSum);
                if (isNaN(min)) min = null;
            }
            if (filters.maxSum !== undefined && filters.maxSum !== null && filters.maxSum !== '') {
                max = parseFloat(filters.maxSum);
                if (isNaN(max)) max = null;
            }
            if (min !== null) sumClauses.push('coalesce(total_spent, 0) >= $minSum');
            if (max !== null) sumClauses.push('coalesce(total_spent, 0) <= $maxSum');
            if (min !== null) params.minSum = min;
            if (max !== null) params.maxSum = max;

            const countClauses = [];
            if (filters.minOrders !== undefined && filters.minOrders !== null && filters.minOrders !== '') {
                const minC = parseInt(filters.minOrders);
                if (!isNaN(minC)) {
                    if (minC > 0) countClauses.push('order_count IS NOT NULL AND order_count >= $minOrders');
                    else countClauses.push('coalesce(order_count, 0) >= $minOrders');
                    params.minOrders = minC;
                }
            }
            if (filters.maxOrders !== undefined && filters.maxOrders !== null && filters.maxOrders !== '') {
                const maxC = parseInt(filters.maxOrders);
                if (!isNaN(maxC)) {
                    countClauses.push('coalesce(order_count, 0) <= $maxOrders');
                    params.maxOrders = maxC;
                }
            }

            const allClauses = [...sumClauses, ...countClauses];
            if (allClauses.length > 0) {
                query += ' WHERE ' + allClauses.join(' AND ');
            }

            query += `
                RETURN u, 
                       coalesce(order_count, 0) as order_count, 
                       coalesce(total_spent, 0) as total_created_sum
                ORDER BY u.created_at DESC
            `;

            console.log('findByFilters Query:', query.replace(/\n/g, ' '));
            console.log('findByFilters Params:', params);

            const result = await session.run(query, params);
            
            return result.records.map(record => {
                const uProps = formatProperties(record.get('u').properties);
                const countVal = record.get('order_count');
                const sumVal = record.get('total_created_sum');
                return {
                    ...uProps,
                    order_count: countVal != null ? Number(countVal.toNumber ? countVal.toNumber() : countVal) : 0,
                    total_created_sum: sumVal != null ? Number(sumVal.toNumber ? sumVal.toNumber() : sumVal) : 0
                };
            });
        } catch (error) {
            console.error('Ошибка в findByFilters:', error.message);
            throw error;
        } finally { await session.close(); }
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
