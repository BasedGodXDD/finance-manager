const swaggerJsDoc = require('swagger-jsdoc');

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Finance Manager API',
            version: '1.0.0',
            description: 'API для управления финансами'
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Development server'
            }
        ]
    },
    apis: ['./server/routes/*.js']
};

module.exports = swaggerJsDoc(swaggerOptions); 