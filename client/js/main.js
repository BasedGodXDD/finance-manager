// Глобальные переменные
let transactions = [];
let currentUser = JSON.parse(localStorage.getItem('currentUser'));
let currentCurrency = currentUser?.settings?.currency || 'RUB';

// Добавляем иконки для категорий
const categoryIcons = {
    'Зарплата': 'fa-money-bill-wave',
    'Продукты': 'fa-shopping-cart',
    'Транспорт': 'fa-car',
    'Развлечения': 'fa-film',
    'Здоровье': 'fa-hospital',
    'Коммунальные платежи': 'fa-home',
    'Образование': 'fa-graduation-cap',
    'Одежда': 'fa-tshirt',
    'Путешествия': 'fa-plane',
    'Техника': 'fa-laptop',
    'Хобби': 'fa-palette',
    'Другое': 'fa-question-circle'
};

const currencySymbols = {
    'RUB': '₽',
    'USD': '$',
    'EUR': '€'
};

// Глобальные переменные для курсов валют
let exchangeRates = {
    'RUB': 1,
    'USD': 0,
    'EUR': 0
};

let isExchangeRatesFetching = false;
let exchangeRatesInterval = null;

const categories = [
    'Зарплата',
    'Продукты',
    'Транспорт',
    'Развлечения',
    'Здоровье',
    'Коммунальные платежи',
    'Образование',
    'Одежда',
    'Путешествия',
    'Техника',
    'Хобби',
    'Другое'
];

// Добавляем глобальные переменные для целей
let goals = [];

// DOM элементы
const addTransactionForm = document.getElementById('addTransactionForm');
const transactionsList = document.getElementById('transactionsList');
const totalBalance = document.getElementById('totalBalance');
const totalIncome = document.getElementById('totalIncome');
const totalExpense = document.getElementById('totalExpense');
const showAddTransactionBtn = document.getElementById('showAddTransaction');
const showBudgetsBtn = document.getElementById('showBudgets');
const budgetModal = document.getElementById('budgetModal');
const searchTransaction = document.getElementById('searchTransaction');
const filterPeriod = document.getElementById('filterPeriod');
const filterCategory = document.getElementById('filterCategory');
const filterType = document.getElementById('filterType');
const currencySelect = document.getElementById('currencySelect');
const themeToggle = document.getElementById('themeToggle');
const logoutBtn = document.getElementById('logoutBtn');
const exportDataBtn = document.getElementById('exportData');

// DOM элементы для целей
const showAddGoalBtn = document.getElementById('showAddGoal');
const goalModal = document.getElementById('goalModal');
const goalsList = document.getElementById('goalsList');

// Функции для работы с модальными окнами
function showModal(modalElement) {
    modalElement.style.display = 'block';
}

function hideModal(modalElement) {
    modalElement.style.display = 'none';
}

// Обработчики модальных окон
showAddTransactionBtn.addEventListener('click', () => showModal(addTransactionForm));

// Закрытие модального окна при клике вне его
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        hideModal(e.target);
    }
});

// Функция для показа уведомлений
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        ${message}
    `;
    
    document.getElementById('notifications').appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Добавьте функцию экспорта
function exportTransactionsToCSV() {
    if (!transactions.length) {
        showNotification('Нет данных для экспорта', 'error');
        return;
    }

    const userTransactions = transactions.filter(t => t.userId === currentUser.id);
    
    if (!userTransactions.length) {
        showNotification('Нет транзакций для экспорта', 'error');
        return;
    }

    // Заголовки CSV
    const headers = [
        'Дата',
        'Тип',
        'Категория',
        'Сумма',
        'Валюта',
        'Описание',
        'Регулярный платеж'
    ];

    // Подготовка данных
    const csvData = userTransactions.map(t => [
        formatDate(t.date),
        t.type === 'income' ? 'Доход' : 'Расход',
        t.category,
        t.amount.toFixed(2),
        t.currency,
        t.description || '',
        t.isRecurring ? 'Да' : 'Нет'
    ]);

    // Добавление заголовков в начало массива
    csvData.unshift(headers);

    // Преобразование в CSV строку
    const csvString = csvData
        .map(row => row
            .map(cell => `"${cell}"`)
            .join(',')
        )
        .join('\n');

    // Создание Blob и ссылки для скачивания
    const blob = new Blob(['\ufeff' + csvString], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    // Настройка и клик по ссылке для скачивания
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions_${formatDateForFilename(new Date())}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Данные успешно экспортированы');
}

// Вспомогательная функция для форматирования даты в имени файла
function formatDateForFilename(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Обработчик кнопки экспорта
exportDataBtn.addEventListener('click', () => {
    showModal(document.getElementById('exportModal'));
});

// Обработчики кнопок форматов экспорта
document.querySelectorAll('.export-option').forEach(button => {
    button.addEventListener('click', () => {
        const format = button.dataset.format;
        if (format === 'csv') {
            exportTransactionsToCSV();
        } else if (format === 'json') {
            exportTransactionsToJSON();
        }
        hideModal(document.getElementById('exportModal'));
    });
});

// Функция экспорта в JSON
function exportTransactionsToJSON() {
    if (!transactions.length) {
        showNotification('Нет данных для экспорта', 'error');
        return;
    }

    const userTransactions = transactions.filter(t => t.userId === currentUser.id);
    
    if (!userTransactions.length) {
        showNotification('Нет транзакций для экспорта', 'error');
        return;
    }

    // Подготовка данных для экспорта
    const exportData = {
        user: {
            id: currentUser.id,
            name: currentUser.name,
            email: currentUser.email
        },
        transactions: userTransactions,
        exportDate: new Date().toISOString(),
        settings: currentUser.settings
    };

    // Создание и скачивание файла
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `finance_manager_export_${formatDateForFilename(new Date())}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Данные успешно экспортированы в JSON');
}

// Функция для обновления интерфейса пользователя
function updateUserInterface() {
    const guestControls = document.getElementById('guestControls');
    const userControls = document.getElementById('userControls');
    const userAvatar = userControls.querySelector('.user-avatar');
    const userName = userControls.querySelector('.user-name');

    if (currentUser) {
        guestControls.classList.add('hidden');
        userControls.classList.remove('hidden');
        
        userAvatar.textContent = currentUser.name[0].toUpperCase();
        userName.textContent = currentUser.name;
        
        document.querySelectorAll('.requires-auth').forEach(el => {
            el.classList.remove('hidden');
        });
    } else {
        guestControls.classList.remove('hidden');
        userControls.classList.add('hidden');
        
        document.querySelectorAll('.requires-auth').forEach(el => {
            el.classList.add('hidden');
        });
    }
}

// Функция для получения курсов валют
async function fetchExchangeRates() {
    if (isExchangeRatesFetching) return;
    
    isExchangeRatesFetching = true;
    
    try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await response.json();
        
        exchangeRates = {
            'USD': 1,
            'RUB': data.rates.RUB,
            'EUR': data.rates.EUR
        };
        
        updateUI();
        showNotification('Курсы валют обновлены');
    } catch (error) {
        console.error('Ошибка при получении курсов валют:', error);
        showNotification('Ошибка при получении курсов валют', 'error');
    } finally {
        isExchangeRatesFetching = false;
    }
}

// Конвертация валют
function convertCurrency(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) return amount;
    const inUSD = amount / exchangeRates[fromCurrency];
    return inUSD * exchangeRates[toCurrency];
}

// Функция инициализации категорий
function initializeCategories() {
    const categorySelect = document.getElementById('category');
    const filterCategorySelect = document.getElementById('filterCategory');
    
    // Заполняем select для новых транзакций
    if (categorySelect) {
        categorySelect.innerHTML = Object.keys(categoryIcons)
            .map(category => `
                <option value="${category}">
                    ${category}
                </option>
            `)
            .join('');
    }
    
    // Заполняем select для фильтра
    if (filterCategorySelect) {
        filterCategorySelect.innerHTML = `
            <option value="all">Все категории</option>
            ${Object.keys(categoryIcons)
                .map(category => `
                    <option value="${category}">
                        ${category}
                    </option>
                `)
                .join('')}
        `;
    }
}

// Обновление информации о балансе
function updateBalanceInfo() {
    const filteredTransactions = filterTransactions();
    let totalInc = 0;
    let totalExp = 0;

    filteredTransactions.forEach(transaction => {
        const convertedAmount = convertCurrency(
            transaction.amount,
            transaction.currency,
            currentCurrency
        );

        if (transaction.type === 'income') {
            totalInc += convertedAmount;
        } else {
            totalExp += convertedAmount;
        }
    });

    const balance = totalInc - totalExp;

    totalBalance.textContent = formatCurrency(balance);
    totalIncome.textContent = formatCurrency(totalInc);
    totalExpense.textContent = formatCurrency(totalExp);

    updateBalanceChart(totalInc, totalExp);
}

// Создание графика баланса
function updateBalanceChart(income, expense) {
    const ctx = document.getElementById('balanceChart').getContext('2d');
    
    if (window.balanceChart instanceof Chart) {
        window.balanceChart.destroy();
    }

    window.balanceChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Доходы', 'Расходы'],
            datasets: [{
                data: [income, expense],
                backgroundColor: [
                    'rgba(46, 204, 113, 0.8)',
                    'rgba(231, 76, 60, 0.8)'
                ],
                borderColor: [
                    'rgba(46, 204, 113, 1)',
                    'rgba(231, 76, 60, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: getComputedStyle(document.documentElement)
                            .getPropertyValue('--text-color')
                    }
                }
            }
        }
    });
}

// Обновление списка транзакций
function updateTransactionsList() {
    const filteredTransactions = filterTransactions();
    transactionsList.innerHTML = '';

    filteredTransactions.forEach(transaction => {
        const transactionEl = createTransactionElement(transaction);
        transactionsList.appendChild(transactionEl);
    });
}

// Создание элемента транзакции
function createTransactionElement(transaction) {
    const div = document.createElement('div');
    div.className = `transaction-item ${transaction.type}`;
    
    const amount = convertCurrency(
        transaction.amount,
        transaction.currency,
        currentCurrency
    );

    const hasNotes = transaction.notes && transaction.notes.length > 0;
    const notesPreview = hasNotes ? transaction.notes.slice(0, 50) + (transaction.notes.length > 50 ? '...' : '') : '';

    div.innerHTML = `
        <div class="transaction-info">
            <div class="transaction-category">
                <i class="fas ${categoryIcons[transaction.category] || 'fa-tag'}"></i>
                ${transaction.category}
            </div>
            <div class="transaction-description">
                ${transaction.description || 'Без описания'}
                ${hasNotes ? `
                    <div class="transaction-notes">
                        <i class="fas fa-sticky-note"></i>
                        <div class="transaction-notes-content">${notesPreview}</div>
                        ${transaction.notes.length > 50 ? `
                            <button class="show-notes-btn" onclick="showFullNotes('${transaction.id}', \`${transaction.notes.replace(/`/g, '\\`')}\`)">
                                Показать полностью
                            </button>
                        ` : ''}
                    </div>
                ` : ''}
            </div>
            <div class="transaction-date">
                <i class="fas fa-calendar"></i>
                ${formatDate(transaction.date)}
            </div>
        </div>
        <div class="transaction-amount ${transaction.type}">
            ${transaction.type === 'income' ? '+' : '-'} ${formatCurrency(amount)}
            ${transaction.isRecurring ? '<i class="fas fa-sync-alt"></i>' : ''}
        </div>
        <button class="delete-btn" onclick="deleteTransaction(${transaction.id})">
            <i class="fas fa-trash"></i>
        </button>
    `;

    return div;
}

// Фильтрация транзакций
function filterTransactions() {
    let filtered = transactions.filter(t => t.userId === currentUser.id);

    if (searchTransaction.value) {
        const searchTerm = searchTransaction.value.toLowerCase();
        filtered = filtered.filter(t => 
            t.description?.toLowerCase().includes(searchTerm) ||
            t.category.toLowerCase().includes(searchTerm)
        );
    }

    if (filterPeriod.value !== 'all') {
        const today = new Date();
        const periods = {
            week: new Date(today.setDate(today.getDate() - 7)),
            month: new Date(today.setMonth(today.getMonth() - 1)),
            year: new Date(today.setFullYear(today.getFullYear() - 1))
        };
        filtered = filtered.filter(t => new Date(t.date) >= periods[filterPeriod.value]);
    }

    if (filterCategory.value !== 'all') {
        filtered = filtered.filter(t => t.category === filterCategory.value);
    }

    if (filterType.value !== 'all') {
        filtered = filtered.filter(t => t.type === filterType.value);
    }

    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
}

// Обновление UI
function updateUI() {
    updateBalanceInfo();
    updateTransactionsList();
}

// Форматирование валюты
function formatCurrency(amount) {
    return `${amount.toFixed(2)} ${currencySymbols[currentCurrency]}`;
}

// Форматирование даты
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('ru-RU', options);
}

// Делаем функцию удаления доступной глобально
window.deleteTransaction = function(id) {
    console.log('Удаление транзакции:', id);
    
    // Получаем текущие транзакции из localStorage
    let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    
    // Фильтруем транзакции, исключая удаляемую
    transactions = transactions.filter(t => t.id !== id);
    
    // Сохраняем обновленный список
    localStorage.setItem('transactions', JSON.stringify(transactions));
    
    // Обновляем UI
    updateUI();
    
    // Показываем уведомление
    showNotification('Транзакция удалена успешно');
};

// Обработчики фильтров
[searchTransaction, filterPeriod, filterCategory, filterType].forEach(filter => {
    filter.addEventListener('change', updateUI);
});

// Обработчик смены валюты
currencySelect.addEventListener('change', (e) => {
    currentCurrency = e.target.value;
    currentUser.settings.currency = currentCurrency;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    updateUI();
});

// Обработчик смены темы
themeToggle.addEventListener('click', () => {
    const newTheme = currentUser.settings.theme === 'light' ? 'dark' : 'light';
    currentUser.settings.theme = newTheme;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    document.documentElement.setAttribute('data-theme', newTheme);
    themeToggle.innerHTML = `<i class="fas fa-${newTheme === 'dark' ? 'sun' : 'moon'}"></i>`;
});

// Обработчик для регулярных платежей
document.getElementById('isRecurring').addEventListener('change', (e) => {
    document.getElementById('recurringPeriod').disabled = !e.target.checked;
});

// Обработчик выхода из системы
logoutBtn.addEventListener('click', () => {
    if (exchangeRatesInterval) {
        clearInterval(exchangeRatesInterval);
    }
    localStorage.removeItem('currentUser');
    window.location.href = 'auth.html';
});

// Обработчик формы добавления транзакции
document.getElementById('transactionForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    if (!currentUser) {
        showNotification('Необходимо авторизоваться', 'error');
        return;
    }

    const formData = {
        id: Date.now(),
        userId: currentUser.id,
        type: document.getElementById('transactionType').value,
        amount: parseFloat(document.getElementById('amount').value),
        category: document.getElementById('category').value,
        date: document.getElementById('date').value,
        description: document.getElementById('description').value,
        notes: document.getElementById('notes').value.trim(),
        isRecurring: document.getElementById('isRecurring').checked,
        recurringPeriod: document.getElementById('recurringPeriod').value,
        currency: currentCurrency
    };

    // Обновляем глобальный массив транзакций
    transactions.push(formData);
    
    // Сохраняем в localStorage
    localStorage.setItem('transactions', JSON.stringify(transactions));
    
    // Обновляем UI
    updateUI();
    
    // Очищаем форму
    e.target.reset();
    
    // Устанавливаем текущую дату
    const dateInput = document.getElementById('date');
    if (dateInput) {
        dateInput.valueAsDate = new Date();
    }
    
    // Закрываем модальное окно
    hideModal(addTransactionForm);
    
    // Показываем уведомление
    showNotification('Транзакция успешно добавлена');
});

// Обработчик кнопки статистики
document.getElementById('showStatistics').addEventListener('click', () => {
    window.location.href = 'statistics.html';
});

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    // Проверяем авторизацию
    currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser) {
        // Показываем модальное окно выбора
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-content" style="text-align: center;">
                <h2><i class="fas fa-user-circle"></i> Добро пожаловать</h2>
                <p style="margin: 20px 0;">Для продолжения выберите один из вариантов:</p>
                <div style="display: flex; gap: 15px; justify-content: center;">
                    <button id="guestBtn" class="submit-btn" style="width: auto; background: var(--secondary-color);">
                        <i class="fas fa-user-secret"></i> Продолжить как гость
                    </button>
                    <button id="authBtn" class="submit-btn" style="width: auto;">
                        <i class="fas fa-sign-in-alt"></i> Войти в аккаунт
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Обработчики кнопок
        document.getElementById('guestBtn').addEventListener('click', () => {
            const guestUser = {
                id: 'guest',
                name: 'Гость',
                email: 'guest@example.com',
                settings: {
                    theme: 'light',
                    currency: 'RUB'
                }
            };
            localStorage.setItem('currentUser', JSON.stringify(guestUser));
            modal.remove();
            initializeApp();
        });
        
        document.getElementById('authBtn').addEventListener('click', () => {
            window.location.href = 'auth.html';
        });
    } else {
        initializeApp();
    }
});

// Функция инициализации приложения
function initializeApp() {
    currentUser = JSON.parse(localStorage.getItem('currentUser'));
    updateUserInterface();
    
    if (currentUser) {
        // Загружаем транзакции только для текущего пользователя
        const allTransactions = JSON.parse(localStorage.getItem('transactions')) || [];
        transactions = allTransactions.filter(t => t.userId === currentUser.id);
        
        // Загружаем цели
        goals = JSON.parse(localStorage.getItem('goals')) || [];
        
        initializeCategories();
        
        // Устанавливаем текущую дату в поле даты
        const dateInput = document.getElementById('date');
        if (dateInput) {
            dateInput.valueAsDate = new Date();
        }
        
        currencySelect.value = currentUser.settings.currency || 'RUB';
        document.documentElement.setAttribute('data-theme', currentUser.settings.theme || 'light');
        
        if (exchangeRatesInterval) {
            clearInterval(exchangeRatesInterval);
        }
        
        fetchExchangeRates();
        exchangeRatesInterval = setInterval(fetchExchangeRates, 3600000);
        
        updateUI();
        updateGoalsList();
    }
}

// Функция для показа полного текста заметок
window.showFullNotes = function(transactionId, notes) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2><i class="fas fa-sticky-note"></i> Заметки к транзакции</h2>
            <div style="margin: 20px 0; white-space: pre-line;">${notes}</div>
            <button class="submit-btn" onclick="this.closest('.modal').remove()">
                Закрыть
            </button>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'block';
};

// Обработчик кнопки добавления цели
showAddGoalBtn.addEventListener('click', () => {
    const goalDeadline = document.getElementById('goalDeadline');
    const today = new Date();
    today.setDate(today.getDate() + 1); // Минимальная дата - завтра
    goalDeadline.min = today.toISOString().split('T')[0];
    showModal(goalModal);
});

// Обработчик формы добавления цели
document.getElementById('goalForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const formData = {
        id: Date.now(),
        userId: currentUser.id,
        name: document.getElementById('goalName').value,
        targetAmount: parseFloat(document.getElementById('goalAmount').value),
        currentAmount: 0,
        deadline: document.getElementById('goalDeadline').value,
        priority: document.getElementById('goalPriority').value,
        notes: document.getElementById('goalNotes').value.trim(),
        createdAt: new Date().toISOString(),
        currency: currentCurrency
    };

    // Добавляем цель
    goals.push(formData);
    localStorage.setItem('goals', JSON.stringify(goals));
    
    // Обновляем отображение
    updateGoalsList();
    
    // Очищаем форму и закрываем модальное окно
    e.target.reset();
    hideModal(goalModal);
    
    showNotification('Цель успешно добавлена');
});

// Функция обновления списка целей
function updateGoalsList() {
    if (!goalsList) return;
    
    const userGoals = goals.filter(g => g.userId === currentUser.id);
    
    if (userGoals.length === 0) {
        goalsList.innerHTML = `
            <div class="no-goals">
                <i class="fas fa-bullseye"></i>
                <p>У вас пока нет финансовых целей</p>
                <p>Добавьте свою первую цель!</p>
            </div>
        `;
        return;
    }

    goalsList.innerHTML = userGoals
        .sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        })
        .map(goal => {
            const progress = (goal.currentAmount / goal.targetAmount) * 100;
            const daysLeft = Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24));
            
            return `
                <div class="goal-card">
                    <span class="goal-priority ${goal.priority}">${
                        goal.priority === 'high' ? 'Высокий' :
                        goal.priority === 'medium' ? 'Средний' : 'Низкий'
                    }</span>
                    <div class="goal-header">
                        <div class="goal-name">${goal.name}</div>
                    </div>
                    <div class="goal-progress">
                        <div class="goal-progress-bar">
                            <div class="progress" style="width: ${progress}%"></div>
                        </div>
                        <div class="goal-amounts">
                            <span>Накоплено: ${formatCurrency(goal.currentAmount)}</span>
                            <span>Цель: ${formatCurrency(goal.targetAmount)}</span>
                        </div>
                    </div>
                    <div class="goal-deadline">
                        <i class="fas fa-clock"></i>
                        ${daysLeft > 0 ? 
                            `Осталось ${daysLeft} ${getDaysWord(daysLeft)}` : 
                            'Срок достижения истёк'}
                    </div>
                    <div class="goal-actions">
                        <button class="goal-action-btn contribute" onclick="contributeToGoal(${goal.id})">
                            <i class="fas fa-plus"></i> Внести
                        </button>
                        <button class="goal-action-btn delete" onclick="deleteGoal(${goal.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        })
        .join('');
}

// Функция для правильного склонения дней
function getDaysWord(days) {
    const lastDigit = days % 10;
    const lastTwoDigits = days % 100;
    
    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return 'дней';
    if (lastDigit === 1) return 'день';
    if (lastDigit >= 2 && lastDigit <= 4) return 'дня';
    return 'дней';
}

// Функция внесения средств в цель
window.contributeToGoal = function(goalId) {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2><i class="fas fa-piggy-bank"></i> Внести средства</h2>
            <form id="contributeForm">
                <div class="form-group">
                    <label>Сумма</label>
                    <input type="number" id="contributeAmount" required min="0" step="0.01" 
                           max="${goal.targetAmount - goal.currentAmount}">
                </div>
                <button type="submit" class="submit-btn">
                    <i class="fas fa-check"></i> Подтвердить
                </button>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';

    document.getElementById('contributeForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const amount = parseFloat(document.getElementById('contributeAmount').value);
        
        goal.currentAmount += amount;
        localStorage.setItem('goals', JSON.stringify(goals));
        
        // Создаем транзакцию для внесенных средств
        const transaction = {
            id: Date.now(),
            userId: currentUser.id,
            type: 'expense',
            amount: amount,
            category: 'Накопления',
            date: new Date().toISOString().split('T')[0],
            description: `Внесение средств в цель: ${goal.name}`,
            currency: currentCurrency
        };
        
        transactions.push(transaction);
        localStorage.setItem('transactions', JSON.stringify(transactions));
        
        updateGoalsList();
        updateUI();
        modal.remove();
        
        showNotification('Средства успешно внесены');
        
        if (goal.currentAmount >= goal.targetAmount) {
            showNotification('Поздравляем! Цель достигнута!', 'success');
        }
    });
};

// Функция удаления цели
window.deleteGoal = function(goalId) {
    if (confirm('Вы уверены, что хотите удалить эту цель?')) {
        goals = goals.filter(g => g.id !== goalId);
        localStorage.setItem('goals', JSON.stringify(goals));
        updateGoalsList();
        showNotification('Цель удалена');
    }
};
