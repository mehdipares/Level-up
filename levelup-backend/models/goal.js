'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Goal extends Model {
    static associate(models) {
      this.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
      this.belongsTo(models.Category, { foreignKey: 'category_id', as: 'category' });
    }
  }
  Goal.init({
    user_id: DataTypes.INTEGER,
    category_id: DataTypes.INTEGER,
    title: DataTypes.STRING,
    description: DataTypes.TEXT,
    frequency: DataTypes.STRING,
    xp_reward: DataTypes.INTEGER,
    completed: DataTypes.BOOLEAN,
    due_date: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Goal',
  });
  return Goal;
};
