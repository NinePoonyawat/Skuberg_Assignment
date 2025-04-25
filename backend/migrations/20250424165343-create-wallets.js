"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("wallets", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      currency_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "currencies", key: "id" },
        onDelete: "CASCADE",
      },
      balance: {
        type: Sequelize.DECIMAL(18, 8),
        allowNull: false,
        defaultValue: 0,
      },
      address: { type: Sequelize.STRING },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("wallets");
  },
};
