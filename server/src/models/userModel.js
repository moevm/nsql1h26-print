import { getSession } from '../config/db.js';

const formatProperties = (properties) => {
    const formatted = { ...properties };
    ['created_at', 'deactivated_at'].forEach(field => {
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

    findById: async (user_id) => {
        const session = getSession();
        try {
            const result = await session.run(
                'MATCH (u:User {user_id: $user_id}) RETURN u',
                { user_id }
            );
            if (result.records.length === 0) return null;
            return formatProperties(result.records[0].get('u').properties);
        } finally {
            await session.close();
        }
    },

    updateById: async (user_id, data) => {
        const session = getSession();
        try {
            const updateData = { ...data };
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
