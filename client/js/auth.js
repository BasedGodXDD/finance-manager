import api from './services/api.js';

class AuthManager {
    constructor() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });

        document.getElementById('loginForm')?.addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('registerForm')?.addEventListener('submit', (e) => this.handleRegister(e));
    }

    switchTab(tab) {
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.auth-form').forEach(f => f.classList.add('hidden'));
        
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        document.getElementById(`${tab}Form`).classList.remove('hidden');
    }

    async handleLogin(e) {
        e.preventDefault();
        const form = e.target;
        const email = form.querySelector('input[type="email"]').value;
        const password = form.querySelector('input[type="password"]').value;

        try {
            const { user, token } = await api.login(email, password);
            localStorage.setItem('currentUser', JSON.stringify(user));
            this.showNotification('Успешный вход!', 'success');
            window.location.href = 'index.html';
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const form = e.target;
        const userData = {
            name: form.querySelector('input[type="text"]').value,
            email: form.querySelector('input[type="email"]').value,
            password: form.querySelectorAll('input[type="password"]')[0].value,
            confirmPassword: form.querySelectorAll('input[type="password"]')[1].value
        };

        if (userData.password !== userData.confirmPassword) {
            this.showNotification('Пароли не совпадают', 'error');
            return;
        }

        try {
            const { user, token } = await api.register(userData);
            localStorage.setItem('currentUser', JSON.stringify(user));
            this.showNotification('Регистрация успешна!', 'success');
            window.location.href = 'index.html';
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `auth-notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            ${message}
        `;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Инициализация менеджера авторизации
const authManager = new AuthManager();

// Проверка авторизации на защищенных страницах
if (window.location.pathname !== '/auth.html') {
    authManager.checkAuth();
}

// Обработчик выхода из системы
document.addEventListener('click', (e) => {
    if (e.target.id === 'logoutBtn') {
        authManager.logout();
    }
}); 
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Требуется авторизация' });
    }
};
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);

module.exports = router;

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const authTabs = document.querySelectorAll('.auth-tab');

    // Переключение между формами входа и регистрации
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetForm = tab.dataset.tab === 'login' ? loginForm : registerForm;
            const otherForm = tab.dataset.tab === 'login' ? registerForm : loginForm;

            authTabs.forEach(t => t.classList.toggle('active'));
            targetForm.classList.remove('hidden');
            otherForm.classList.add('hidden');
        });
    });

    // Обработка формы входа
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = loginForm.querySelector('input[type="email"]').value;
        const password = loginForm.querySelector('input[type="password"]').value;

        // Получаем список пользователей
        const users = JSON.parse(localStorage.getItem('users')) || [];
        
        // Ищем пользователя
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            // Удаляем пароль из объекта пользователя перед сохранением в currentUser
            const { password, ...userWithoutPassword } = user;
            localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
            window.location.href = 'index.html';
        } else {
            showNotification('Неверный email или пароль', 'error');
        }
    });

    // Обработка формы регистрации
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = registerForm.querySelector('input[type="text"]').value;
        const email = registerForm.querySelector('input[type="email"]').value;
        const password = registerForm.querySelectorAll('input[type="password"]')[0].value;
        const confirmPassword = registerForm.querySelectorAll('input[type="password"]')[1].value;

        if (password !== confirmPassword) {
            showNotification('Пароли не совпадают', 'error');
            return;
        }

        // Получаем список пользователей
        const users = JSON.parse(localStorage.getItem('users')) || [];
        
        // Проверяем, существует ли пользователь с таким email
        if (users.some(u => u.email === email)) {
            showNotification('Пользователь с таким email уже существует', 'error');
            return;
        }

        // Создаем нового пользователя
        const newUser = {
            id: Date.now(), // Используем timestamp как уникальный ID
            name,
            email,
            password, // В реальном приложении пароль должен быть захеширован
            settings: {
                theme: 'light',
                currency: 'RUB'
            }
        };

        // Добавляем пользователя в список
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));

        // Сохраняем текущего пользователя (без пароля)
        const { password: _, ...userWithoutPassword } = newUser;
        localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
        
        showNotification('Регистрация успешна!', 'success');
        window.location.href = 'index.html';
    });

    // Функция для показа уведомлений
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            ${message}
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
});