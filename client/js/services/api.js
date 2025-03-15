const API_URL = 'http://localhost:3000/api';

class ApiService {
    constructor() {
        this.token = localStorage.getItem('token');
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('token', token);
    }

    clearToken() {
        this.token = null;
        localStorage.removeItem('token');
    }

    async request(endpoint, options = {}) {
        const url = `${API_URL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.token) {
            headers.Authorization = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Что-то пошло не так');
            }

            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Аутентификация
    async login(email, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        this.setToken(data.token);
        return data;
    }

    async register(userData) {
        const data = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        this.setToken(data.token);
        return data;
    }

    // Транзакции
    async getTransactions() {
        return this.request('/transactions');
    }

    async createTransaction(transaction) {
        return this.request('/transactions', {
            method: 'POST',
            body: JSON.stringify(transaction)
        });
    }

    async updateTransaction(id, transaction) {
        return this.request(`/transactions/${id}`, {
            method: 'PUT',
            body: JSON.stringify(transaction)
        });
    }

    async deleteTransaction(id) {
        return this.request(`/transactions/${id}`, {
            method: 'DELETE'
        });
    }

    // Бюджеты
    async getBudgets() {
        return this.request('/budgets');
    }

    async createBudget(budget) {
        return this.request('/budgets', {
            method: 'POST',
            body: JSON.stringify(budget)
        });
    }

    async getBudgetProgress(id) {
        return this.request(`/budgets/${id}/progress`);
    }

    async updateBudget(id, budget) {
        return this.request(`/budgets/${id}`, {
            method: 'PUT',
            body: JSON.stringify(budget)
        });
    }

    async deleteBudget(id) {
        return this.request(`/budgets/${id}`, {
            method: 'DELETE'
        });
    }

    async updateUserSettings(settings) {
        const user = JSON.parse(localStorage.getItem('currentUser'));
        const updated = { ...user, settings };
        localStorage.setItem('currentUser', JSON.stringify(updated));
        return updated;
    }
}

// Определяем API как глобальный объект
window.api = new ApiService();

const api = new ApiService();
export default api; 