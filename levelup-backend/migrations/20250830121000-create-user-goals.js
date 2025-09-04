'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('user_goals', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      user_id: { type: Sequelize.INTEGER, allowNull: false },
      template_id: { type: Sequelize.INTEGER, allowNull: false },
      active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      completed: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      due_date: { type: Sequelize.DATE, allowNull: true },
      xp_reward_override: { type: Sequelize.INTEGER, allowNull: true }, // laisse NULL si tu interdis l’override
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') }
    });

    await queryInterface.addConstraint('user_goals', {
      fields: ['user_id','template_id'],
      type: 'unique',
      name: 'user_goals_user_template_unique'
    });

    await queryInterface.addIndex('user_goals', ['user_id', 'active']);
    await queryInterface.addIndex('user_goals', ['template_id']);
  },

  async down (queryInterface) {
    await queryInterface.dropTable('user_goals');
  }
};
