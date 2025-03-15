class BudgetManager {
    constructor() {
        this.budgets = JSON.parse(localStorage.getItem('budgets')) || [];
        this.categories = [
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
        this.setupEventListeners();
        this.initializeBudgetCategories();
    }

    // Добавим новый метод для инициализации категорий
    initializeBudgetCategories() {
        const budgetCategorySelect = document.getElementById('budgetCategory');
        if (budgetCategorySelect) {
            budgetCategorySelect.innerHTML = this.categories
                .map(category => `<option value="${category}">${category}</option>`)
                .join('');
        }
    }

    setupEventListeners() {
        const showBudgetsBtn = document.getElementById('showBudgets');
        const budgetModal = document.getElementById('budgetModal');
        const budgetForm = document.getElementById('budgetForm');

        showBudgetsBtn.addEventListener('click', () => {
            budgetModal.style.display = 'block';
            this.updateBudgetsList();
            // Обновляем категории при каждом открытии модального окна
            this.initializeBudgetCategories();
        });

        // Остальной код остается без изменений
        window.addEventListener('click', (e) => {
            if (e.target === budgetModal) {
                budgetModal.style.display = 'none';
            }
        });

        budgetForm.addEventListener('submit', (e) => this.handleBudgetSubmit(e));
    }

    // ... остальные методы класса остаются без изменений ...
}

// Инициализация менеджера бюджетов
const budgetManager = new BudgetManager(); 