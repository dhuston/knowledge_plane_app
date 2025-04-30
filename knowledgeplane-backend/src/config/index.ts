// This file exports configuration settings for the application, such as database connection strings and environment variables.

export const config = {
    port: process.env.PORT || 3000,
    db: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        user: process.env.DB_USER || 'user',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_NAME || 'knowledgeplane'
    },
    jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret',
    apiUrl: process.env.API_URL || 'http://localhost:3000/api'
};