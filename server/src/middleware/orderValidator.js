const allowedStatuses = ['pending', 'processing', 'ready', 'cancelled', 'completed'];
const allowedFields = [
    'quantity',
    'parameters',
    'notes',
    'status',
    'file_name',
    'file_size',
    'service_id',
    'user_id'
];

const filterFields = (body) => {
    const filtered = {};
    Object.keys(body).forEach(key => {
        if (allowedFields.includes(key)) {
            filtered[key] = body[key];
        }
    });
    return filtered;
};

export const validateCreateOrder = (req, res, next) => {
    req.body = filterFields(req.body);
    const { quantity, service_id, file_name } = req.body;

    const errors = [];
    if (!service_id) errors.push('ID услуги (service_id) обязателен');
    if (!quantity || !Number.isInteger(quantity) || quantity <= 0) {
        errors.push('Количество должно быть целым числом больше нуля');
    }
    if (!file_name || file_name.length === 0) {
        errors.push('Имя файла обязательно');
    }

    if (errors.length > 0) return res.status(400).json({ errors });
    next();
};

export const validateUpdateOrder = (req, res, next) => {
    req.body = filterFields(req.body);
    const { status, quantity } = req.body;

    const errors = [];
    if (status && !allowedStatuses.includes(status)) {
        errors.push(`Недопустимый статус. Разрешены: ${allowedStatuses.join(', ')}`);
    }
    if (quantity !== undefined && (!Number.isInteger(quantity) || quantity <= 0)) {
        errors.push('Количество должно быть целым числом больше нуля');
    }

    if (errors.length > 0) return res.status(400).json({ errors });
    next();
};
