const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');

// Ограничение количества запросов
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 100 // максимум 100 запросов с одного IP
});

// Настройка безопасности для API
const securityMiddleware = (app) => {
    // Базовая защита заголовков
    app.use(helmet());

    // Защита от NoSQL инъекций
    app.use(mongoSanitize());

    // Защита от XSS атак
    app.use(xss());

    // Ограничение запросов
    app.use('/api/', limiter);

    // Отключение информации о сервере
    app.disable('x-powered-by');
};

module.exports = securityMiddleware; 