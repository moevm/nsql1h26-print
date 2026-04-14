import { getSession } from '../config/db.js';

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
                            u.role = $role,
                            u.created_at = datetime()
                         RETURN u, (u.created_at IS NOT NULL) as is_new`,
                {
                    email: userData.email,
                    password_hash: userData.password_hash,
                    first_name: userData.first_name,
                    last_name: userData.last_name,
                    role: userData.role || 'client'
                }
            );

            const record = result.records[0];
            if (!record.get('is_new')) throw new Error('User already exists');
            return record.get('u').properties;
        } finally {
            await session.close();
        }
    },

    find: async (filters = {}) => {
        const session = getSession();
        try {
            let query = 'MATCH (u:User) ';
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

            if (clauses.length > 0) {
                query += 'WHERE ' + clauses.join(' AND ');
            }
            query += ' RETURN u';

            const result = await session.run(query, params);
            return result.records.map(record => record.get('u').properties);
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
            return result.records[0].get('u').properties;
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
            return result.records[0].get('u').properties;
        } finally {
            await session.close();
        }
    },

    updateById: async (user_id, data) => {
        const session = getSession();
        try {
            const result = await session.run(
                'MATCH (u:User {user_id: $user_id}) SET u += $data RETURN u',
                { user_id, data }
            );
            if (result.records.length === 0) return null;
            return result.records[0].get('u').properties;
        } finally {
            await session.close();
        }
    }
};
