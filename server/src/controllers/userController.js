import bcrypt from 'bcryptjs';
import { User } from '../models/userModel.js';
import jwt from 'jsonwebtoken';

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET || 'super_secret_key', {
        expiresIn: '30d'
    });
};

const SALT_ROUNDS = 10;

export const register = async (req, res) => {
    try {
        const { password, ...userData } = req.body;
        const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
        const newUser = await User.create({
            ...userData,
            password_hash
        });
        const { password_hash: _, ...safeUser } = newUser;
        res.status(201).json({ user: {...safeUser}, token: generateToken(newUser.user_id, newUser.role) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ message: 'Пользователь не найден' });

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(401).json({ message: 'Неверный пароль' });
        const { password_hash, ...safeUser } = user;

        res.json({
            user: {...safeUser},
            token: generateToken(user.user_id, user.role)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getUsers = async (req, res) => {
    try {
        const data = await User.find(req.query);
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

export const getUserById = async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Пользователь не найден' });

    const { password_hash: _, ...safeData } = user;
    res.json(safeData);
};

export const updateUser = async (req, res) => {
    try {
        const updateData = { ...req.body };
        if (updateData.password) {
            updateData.password_hash = await bcrypt.hash(updateData.password, SALT_ROUNDS);
            delete updateData.password;
        }
        const updated = await User.updateById(req.params.id, updateData);
        if (!updated) return res.status(404).json({ message: 'Пользователь не найден' });
        const { password_hash: __, ...safeData } = updated;
        res.json(safeData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
