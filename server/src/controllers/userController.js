import { User } from '../models/userModel.js';

export const login = async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username, password });

    if (user) {
        res.json({ id: user.id, username: user.username, name: user.name });
    } else {
        res.status(401).json({ message: 'Неверный логин или пароль' });
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
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { password, ...safeData } = user;
    res.json(safeData);
};

export const updateUser = async (req, res) => {
    const updated = await User.updateById(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: 'Update failed' });

    const { password, ...safeData } = updated;
    res.json(safeData);
};
