import {filterFields} from '../helpers/helpers.js';
const allowedRoles = ['admin', 'employee', 'client'];
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+?[0-9]{10,15}$/;

const allowedFields = [
    'email',
    'password',
    'first_name',
    'last_name',
    'phone',
    'role',
    'deactivated_at'
];

const validateUserData = (data, isUpdate = false) => {
    const errors = [];
    const { email, password, first_name, last_name, phone, role } = data;

    if (email !== undefined && !emailRegex.test(email)) {
        errors.push('Некорректный формат email');
    }

    if (password !== undefined && password.length < 6) {
        errors.push('Пароль должен быть не менее 6 символов');
    }

    if (!isUpdate) {
        if (!first_name || first_name.trim().length === 0) errors.push('Имя обязательно');
        if (!last_name || last_name.trim().length === 0) errors.push('Фамилия обязательна');
    }

    if (phone && !phoneRegex.test(phone)) {
        errors.push('Некорректный формат номера телефона');
    }

    if (role !== undefined && !allowedRoles.includes(role)) {
        errors.push(`Недопустимая роль. Разрешены: ${allowedRoles.join(', ')}`);
    }

    return errors;
};

export const validateRegister = (req, res, next) => {
    req.body = filterFields(req.body, allowedFields);
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email и пароль обязательны' });
    }

    const errors = validateUserData(req.body, false);
    if (errors.length > 0) return res.status(400).json({ errors });

    next();
};

export const validateUpdateUser = (req, res, next) => {
    req.body = filterFields(req.body, allowedFields);
    delete req.body.email;

    if (Object.keys(req.body).length === 0) {
        return res.status(400).json({ message: 'Нет данных для обновления' });
    }

    const errors = validateUserData(req.body, true);
    if (errors.length > 0) return res.status(400).json({ errors });

    next();
};

export const validateLogin = (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Введите email и пароль' });
    }
    next();
};
