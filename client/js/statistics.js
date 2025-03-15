// Получаем данные из localStorage
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
const periodSelect = document.getElementById('periodSelect');

// Функция фильтрации транзакций по периоду
function filterByPeriod(transactions, period) {
    const today = new Date();
    const periods = {
        week: new Date(today.setDate(today.getDate() - 7)),
        month: new Date(today.setMonth(today.getMonth() - 1)),
        year: new Date(today.setFullYear(today.getFullYear() - 1))
    };
    
    if (period === 'all') return transactions;
    return transactions.filter(t => new Date(t.date) >= periods[period]);
}

// Обновление сводной информации
function updateSummary(filteredTransactions) {
    const income = filteredTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = income - expense;
    const days = getDaysInPeriod(periodSelect.value);
    const averageDaily = expense / days;

    document.getElementById('totalBalance').textContent = `${balance.toFixed(2)} ₽`;
    document.getElementById('periodIncome').textContent = `${income.toFixed(2)} ₽`;
    document.getElementById('periodExpense').textContent = `${expense.toFixed(2)} ₽`;
    document.getElementById('averageDailyExpense').textContent = `${averageDaily.toFixed(2)} ₽`;
}

// Создание круговой диаграммы расходов
function createExpensePieChart(filteredTransactions) {
    const expensesByCategory = {};
    filteredTransactions
        .filter(t => t.type === 'expense')
        .forEach(t => {
            expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
        });

    new Chart(document.getElementById('expensePieChart'), {
        type: 'pie',
        data: {
            labels: Object.keys(expensesByCategory),
            datasets: [{
                data: Object.values(expensesByCategory),
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                    '#9966FF', '#FF9F40', '#FF6384', '#36A2EB'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

// Создание линейного графика трендов
function createTrendLineChart(filteredTransactions) {
    const dailyData = {};
    filteredTransactions.forEach(t => {
        const date = t.date;
        if (!dailyData[date]) {
            dailyData[date] = { income: 0, expense: 0 };
        }
        if (t.type === 'income') {
            dailyData[date].income += t.amount;
        } else {
            dailyData[date].expense += t.amount;
        }
    });

    const dates = Object.keys(dailyData).sort();
    const incomeData = dates.map(date => dailyData[date].income);
    const expenseData = dates.map(date => dailyData[date].expense);

    new Chart(document.getElementById('trendLineChart'), {
        type: 'line',
        data: {
            labels: dates,
            datasets: [
                {
                    label: 'Доходы',
                    data: incomeData,
                    borderColor: '#2ecc71',
                    fill: false
                },
                {
                    label: 'Расходы',
                    data: expenseData,
                    borderColor: '#e74c3c',
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Создание столбчатой диаграммы по месяцам
function createMonthlyBarChart(filteredTransactions) {
    const monthlyData = {};
    filteredTransactions.forEach(t => {
        const month = t.date.substring(0, 7); // YYYY-MM
        if (!monthlyData[month]) {
            monthlyData[month] = { income: 0, expense: 0 };
        }
        if (t.type === 'income') {
            monthlyData[month].income += t.amount;
        } else {
            monthlyData[month].expense += t.amount;
        }
    });

    const months = Object.keys(monthlyData).sort();
    const incomeData = months.map(month => monthlyData[month].income);
    const expenseData = months.map(month => monthlyData[month].expense);

    new Chart(document.getElementById('monthlyBarChart'), {
        type: 'bar',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Доходы',
                    data: incomeData,
                    backgroundColor: '#2ecc71'
                },
                {
                    label: 'Расходы',
                    data: expenseData,
                    backgroundColor: '#e74c3c'
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Создание круговой диаграммы доходов
function createIncomePieChart(filteredTransactions) {
    const incomesByCategory = {};
    filteredTransactions
        .filter(t => t.type === 'income')
        .forEach(t => {
            incomesByCategory[t.category] = (incomesByCategory[t.category] || 0) + t.amount;
        });

    new Chart(document.getElementById('incomePieChart'), {
        type: 'pie',
        data: {
            labels: Object.keys(incomesByCategory),
            datasets: [{
                data: Object.values(incomesByCategory),
                backgroundColor: [
                    '#2ecc71', '#3498db', '#9b59b6', '#f1c40f',
                    '#e67e22', '#e74c3c', '#1abc9c', '#34495e'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

// Обновление списка топ расходов
function updateTopExpenses(filteredTransactions) {
    const topExpenses = filteredTransactions
        .filter(t => t.type === 'expense')
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

    const topExpensesList = document.getElementById('topExpensesList');
    topExpensesList.innerHTML = topExpenses
        .map(t => `
            <div class="expense-item">
                <span>${t.category} - ${t.description}</span>
                <span>${t.amount.toFixed(2)} ₽</span>
            </div>
        `).join('');
}

// Обновление анализа по категориям
function updateCategoryAnalysis(filteredTransactions) {
    const categoryData = {};
    filteredTransactions.forEach(t => {
        if (!categoryData[t.category]) {
            categoryData[t.category] = { income: 0, expense: 0 };
        }
        if (t.type === 'income') {
            categoryData[t.category].income += t.amount;
        } else {
            categoryData[t.category].expense += t.amount;
        }
    });

    const categoryAnalysisList = document.getElementById('categoryAnalysisList');
    categoryAnalysisList.innerHTML = Object.entries(categoryData)
        .map(([category, data]) => `
            <div class="category-item">
                <span>${category}</span>
                <span>
                    +${data.income.toFixed(2)} ₽ / 
                    -${data.expense.toFixed(2)} ₽
                </span>
            </div>
        `).join('');
}

// Получение количества дней в периоде
function getDaysInPeriod(period) {
    switch (period) {
        case 'week': return 7;
        case 'month': return 30;
        case 'year': return 365;
        default: return 30;
    }
}

// Обновление всей статистики
function updateStatistics() {
    const filteredTransactions = filterByPeriod(transactions, periodSelect.value);
    
    updateSummary(filteredTransactions);
    createExpensePieChart(filteredTransactions);
    createTrendLineChart(filteredTransactions);
    createMonthlyBarChart(filteredTransactions);
    createIncomePieChart(filteredTransactions);
    updateTopExpenses(filteredTransactions);
    updateCategoryAnalysis(filteredTransactions);
}

// Обработчик изменения периода
periodSelect.addEventListener('change', updateStatistics);

// Инициализация статистики
updateStatistics(); 