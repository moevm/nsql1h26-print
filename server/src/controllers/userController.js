import bcrypt from 'bcryptjs';
import { User } from '../models/userModel.js';

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
        res.status(201).json(safeUser);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({email});
    if (!user) return res.status(401).json({ message: 'Пользователь не найден' });
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (isMatch) {
        const { password_hash, ...safeUser } = user;
        res.json(safeUser);
    } else res.status(401).json({ message: 'Неверный пароль' });
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
