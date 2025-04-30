import { Router } from 'express';
import IndexController from '../controllers/index';

const router = Router();
const indexController = new IndexController();

export const setRoutes = (app) => {
    app.use('/api/users', router);
    router.get('/', indexController.getUsers);
    router.post('/', indexController.createUser);
};