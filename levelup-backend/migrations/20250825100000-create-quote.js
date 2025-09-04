'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Quotes', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      text: { type: Sequelize.TEXT, allowNull: false },
      author: { type: Sequelize.STRING, allowNull: true },
      language: { type: Sequelize.STRING, allowNull: false, defaultValue: 'fr' },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Quotes');
  }
};
