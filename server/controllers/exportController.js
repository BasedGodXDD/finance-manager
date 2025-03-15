const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const json2csv = require('json2csv').parse;

exports.exportData = async (req, res) => {
    try {
        const userId = req.user.userId;
        
        // Получаем все данные пользователя
        const transactions = await Transaction.find({ userId });
        const budgets = await Budget.find({ userId });

        const data = {
            transactions,
            budgets
        };

        // Экспорт в CSV
        if (req.query.format === 'csv') {
            const csv = json2csv(transactions, {
                fields: ['type', 'amount', 'currency', 'category', 'date', 'description']
            });
            res.header('Content-Type', 'text/csv');
            res.attachment('finance-data.csv');
            return res.send(csv);
        }

        // Экспорт в JSON
        res.header('Content-Type', 'application/json');
        res.attachment('finance-data.json');
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при экспорте данных' });
    }
};

exports.importData = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { transactions, budgets } = req.body;

        // Проверяем формат данных
        if (!Array.isArray(transactions) || !Array.isArray(budgets)) {
            return res.status(400).json({ message: 'Неверный формат данных' });
        }

        // Импортируем транзакции
        await Transaction.insertMany(
            transactions.map(t => ({ ...t, userId }))
        );

        // Импортируем бюджеты
        await Budget.insertMany(
            budgets.map(b => ({ ...b, userId }))
        );

        res.json({ message: 'Данные успешно импортированы' });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при импорте данных' });
    }
}; 