import {filterFields} from '../helpers/helpers.js';
const allowedTypes = ['scan', 'print', 'risography'];
const allowedColors = ['color', 'bw'];

const allowedFields = [
    'service_type',
    'base_price',
    'color_mode',
    'start_circulation',
    'end_circulation',
    'created_at',
    'deactivated_at'
];

const validateServiceData = (data, isUpdate = false) => {
    const errors = [];
    const {
        service_type,
        base_price,
        color_mode,
        start_circulation,
        end_circulation
    } = data;


    if (base_price !== undefined) {
        if (typeof base_price !== 'number' || base_price < 0) {
            errors.push('Цена должна быть положительным числом');
        }
    }

    const type = service_type;

    if (type === 'scan' || type === 'print') {
        if (end_circulation !== undefined || start_circulation !== undefined) {
            errors.push('Для скана/печати нет полей для тиража');
        }
        if (!isUpdate && color_mode === undefined) {
            errors.push('Цветность обязательна для печати/скана');
        }
        if (color_mode !== undefined && !allowedColors.includes(color_mode)) {
            errors.push('Для этой услуги color_mode должен быть "color" или "bw"');
        }
    }

    if (type === 'risography') {
        if (!isUpdate && (start_circulation === undefined || end_circulation === undefined)) {
            errors.push('Диапазон тиража обязателен для ризографии');
        }
        if (color_mode !== undefined) {
            errors.push('У ризографии нет параметра цветность');
        }
        if (start_circulation !== undefined || end_circulation !== undefined) {
            if (!Number.isInteger(start_circulation) || !Number.isInteger(end_circulation)) {
                errors.push('Тираж должен быть целым числом');
            } else if (start_circulation < 0 || start_circulation >= end_circulation) {
                errors.push('Некорректный диапазон тиража (start должен быть меньше end)');
            }
        }
    }

    return errors;
};

export const validateCreateService = (req, res, next) => {
    req.body = filterFields(req.body, allowedFields);
    const { service_type, base_price } = req.body;
    if (!service_type || base_price === undefined) {
        return res.status(400).json({ message: 'Тип услуги и базовая цена обязательны' });
    }

    const errors = validateServiceData(req.body, false);
    if (errors.length > 0) return res.status(400).json({ errors });
    next();
};

export const validateUpdateService = (req, res, next) => {
    req.body = filterFields(req.body, allowedFields);
    const errors = validateServiceData(req.body, true);
    if (errors.length > 0) return res.status(400).json({ errors });

    next();
};
