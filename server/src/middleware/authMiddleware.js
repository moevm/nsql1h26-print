import jwt from 'jsonwebtoken';

export const protect = (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = {
                user_id: decoded.id,
                role: decoded.role
            };
            next();
            return;
        } catch (error) {
            res.status(401).json({ message: 'Неверный или просроченный токен' });
            return;
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Вы не авторизованы, токен отсутствует' });
    }
};

export const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Требуется авторизация' });
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Нужен доступ админа' });
    }

    next();
};
