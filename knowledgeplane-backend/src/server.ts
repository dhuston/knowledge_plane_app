import express from 'express';
import { setRoutes } from './api/routes/index';
import { config } from './config/index';
import { logger } from './utils/logger';

const app = express();

// Middleware
app.use(express.json());

// Set up routes
setRoutes(app);

// Start the server
const PORT = config.PORT || 3000;
app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
});