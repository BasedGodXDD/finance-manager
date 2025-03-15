const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');

exports.getBudgets = async (req, res) => {
    try {
        const budgets = await Budget.find({ userId: req.user.userId });
        res.json(budgets);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при получении бюджетов' });
    }
};

exports.createBudget = async (req, res) => {
    try {
        const existingBudget = await Budget.findOne({
            userId: req.user.userId,
            category: req.body.category,
            period: req.body.period
        });

        if (existingBudget) {
            return res.status(400).json({ 
                message: 'Бюджет для этой категории и периода уже существует' 
            });
        }

        const budget = new Budget({
            ...req.body,
            userId: req.user.userId
        });

        await budget.save();
        res.status(201).json(budget);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при создании бюджета' });
    }
};

exports.getBudgetProgress = async (req, res) => {
    try {
        const budget = await Budget.findOne({
            _id: req.params.id,
            userId: req.user.userId
        });

        if (!budget) {
            return res.status(404).json({ message: 'Бюджет не найден' });
        }

        const periodStart = getPeriodStartDate(budget.period);
        const expenses = await Transaction.aggregate([
            {
                $match: {
                    userId: req.user.userId,
                    category: budget.category,
                    type: 'expense',
                    date: { $gte: periodStart }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' }
                }
            }
        ]);

        const spent = expenses[0]?.total || 0;
        const remaining = budget.limit - spent;
        const percentage = (spent / budget.limit) * 100;

        res.json({
            budget,
            progress: {
                spent,
                remaining,
                percentage
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при получении прогресса бюджета' });
    }
};

exports.updateBudget = async (req, res) => {
    try {
        const budget = await Budget.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.userId },
            req.body,
            { new: true }
        );

        if (!budget) {
            return res.status(404).json({ message: 'Бюджет не найден' });
        }

        res.json(budget);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при обновлении бюджета' });
    }
};

exports.deleteBudget = async (req, res) => {
    try {
        const budget = await Budget.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.userId
        });

        if (!budget) {
            return res.status(404).json({ message: 'Бюджет не найден' });
        }

        res.json({ message: 'Бюджет удален' });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при удалении бюджета' });
    }
};

function getPeriodStartDate(period) {
    const now = new Date();
    switch (period) {
        case 'week':
            return new Date(now.setDate(now.getDate() - 7));
        case 'month':
            return new Date(now.setMonth(now.getMonth() - 1));
        case 'year':
            return new Date(now.setFullYear(now.getFullYear() - 1));
        default:
            return new Date(0);
    }
} 