let users = [
    { id: "1", username: "admin", password: "123", name: "System Admin", role: "admin" },
    { id: "2", username: "ivan", password: "qwerty", name: "Иван Иванов", role: "user" }
];

export const User = {
    find: async (filters = {}) => {
        let result = [...users];
        if (filters.name) {
            result = result.filter(u => u.name.toLowerCase().includes(filters.name.toLowerCase()));
        }
        return result.map(({ password, ...u }) => u);
    },

    findOne: async (criteria) => {
        return users.find(u =>
            Object.keys(criteria).every(key => u[key] === criteria[key])
        );
    },

    findById: async (id) => {
        return users.find(u => u.id === id);
    },

    updateById: async (id, data) => {
        const index = users.findIndex(u => u.id === id);
        if (index === -1) return null;
        users[index] = { ...users[index], ...data, id };
        return users[index];
    }
};
