"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("orders", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      type: { type: Sequelize.ENUM("buy", "sell"), allowNull: false },
      currency_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "currencies", key: "id" },
        onDelete: "CASCADE",
      },
      fiat_currency_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "currencies", key: "id" },
        onDelete: "CASCADE",
      },
      amount: { type: Sequelize.DECIMAL(18, 8), allowNull: false },
      price: { type: Sequelize.DECIMAL(18, 2), allowNull: false },
      status: {
        type: Sequelize.ENUM("open", "filled", "canceled"),
        allowNull: false,
        defaultValue: "open",
      },
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
    await queryInterface.dropTable("orders");
  },
};
