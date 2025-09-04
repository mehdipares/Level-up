'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('goal_templates', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      category_id: { type: Sequelize.INTEGER, allowNull: false },
      title: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      frequency: { type: Sequelize.STRING, allowNull: true }, // 'daily' | 'weekly' | etc.
      base_xp: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 30 },
      enabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') }
    });

    await queryInterface.addIndex('goal_templates', ['category_id']);
    await queryInterface.addIndex('goal_templates', ['enabled']);
  },

  async down (queryInterface) {
    await queryInterface.dropTable('goal_templates');
  }
};
