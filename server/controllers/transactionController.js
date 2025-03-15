const Transaction = require('../models/Transaction');

exports.getTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find({ userId: req.user.userId });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при получении транзакций' });
    }
};

exports.createTransaction = async (req, res) => {
    try {
        const transaction = new Transaction({
            ...req.body,
            userId: req.user.userId
        });
        await transaction.save();
        res.status(201).json(transaction);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при создании транзакции' });
    }
};

exports.updateTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.userId },
            req.body,
            { new: true }
        );
        if (!transaction) {
            return res.status(404).json({ message: 'Транзакция не найдена' });
        }
        res.json(transaction);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при обновлении транзакции' });
    }
};

exports.deleteTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.userId
        });
        if (!transaction) {
            return res.status(404).json({ message: 'Транзакция не найдена' });
        }
        res.json({ message: 'Транзакция удалена' });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при удалении транзакции' });
    }
}; 