const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Настройка статических файлов
app.use(express.static(path.join(__dirname, 'client')));
app.use(express.json());

// Маршруты
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

app.get('/auth', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'auth.html'));
});

// Обработка всех остальных маршрутов
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});
