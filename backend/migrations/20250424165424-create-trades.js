"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("trades", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      buy_order_id: {
        type: Sequelize.INTEGER,
        references: { model: "orders", key: "id" },
        onDelete: "SET NULL",
      },
      sell_order_id: {
        type: Sequelize.INTEGER,
        references: { model: "orders", key: "id" },
        onDelete: "SET NULL",
      },
      amount: { type: Sequelize.DECIMAL(18, 8), allowNull: false },
      price: { type: Sequelize.DECIMAL(18, 2), allowNull: false },
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
    await queryInterface.dropTable("trades");
  },
};
