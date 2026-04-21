import {filterFields} from '../helpers/helpers.js';
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


export const validateCreateOrder = (req, res, next) => {
    req.body = filterFields(req.body, allowedFields);
    const quantity = Number(req.body.quantity);
    const { service_id } = req.body;

    const errors = [];
    if (!service_id) errors.push('ID услуги (service_id) обязателен');
    if (!quantity || !Number.isInteger(quantity) || quantity <= 0) {
        errors.push('Количество должно быть целым числом больше нуля');
    }

    if (errors.length > 0) return res.status(400).json({ errors });
    next();
};

export const validateUpdateOrder = (req, res, next) => {
    req.body = filterFields(req.body, allowedFields);
    const quantity = Number(req.body.quantity);
    const { status } = req.body;

    const errors = [];
    if (status && !allowedStatuses.includes(status)) {
        errors.push(`Недопустимый статус. Разрешены: ${allowedStatuses.join(', ')}`);
    }
    if (quantity && (!Number.isInteger(quantity) || quantity <= 0)) {
        errors.push('Количество должно быть целым числом больше нуля');
    }

    if (errors.length > 0) return res.status(400).json({ errors });
    next();
};
