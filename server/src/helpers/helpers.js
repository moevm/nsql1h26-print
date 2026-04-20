export const filterFields = (body, allowedFields) => {
    const filtered = {};
    Object.keys(body).forEach(key => {
        if (allowedFields.includes(key)) {
            filtered[key] = body[key];
        }
    });
    return filtered;
};
