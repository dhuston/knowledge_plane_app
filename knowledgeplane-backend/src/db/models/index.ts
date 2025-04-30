// This file exports database models, defining the structure of the data and methods for interacting with the database.

import { Sequelize } from 'sequelize';
import UserModel from './user';
import ProductModel from './product';

const sequelize = new Sequelize(process.env.DATABASE_URL || 'sqlite::memory:');

const models = {
  User: UserModel(sequelize),
  Product: ProductModel(sequelize),
};

Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

export { sequelize };
export default models;