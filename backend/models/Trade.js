const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class Trade extends Model {
    static associate(models) {
      Trade.belongsTo(models.Order, {
        foreignKey: "buy_order_id",
        as: "buyOrder",
      });
      Trade.belongsTo(models.Order, {
        foreignKey: "sell_order_id",
        as: "sellOrder",
      });
    }

    // Method to get detailed trade information
    async getTradeDetails() {
      return await sequelize.models.Trade.findByPk(this.id, {
        include: [
          {
            model: sequelize.models.Order,
            as: "buyOrder",
            include: [
              sequelize.models.User,
              { model: sequelize.models.Currency, as: "currency" },
              { model: sequelize.models.Currency, as: "fiatCurrency" },
            ],
          },
          {
            model: sequelize.models.Order,
            as: "sellOrder",
            include: [
              sequelize.models.User,
              { model: sequelize.models.Currency, as: "currency" },
              { model: sequelize.models.Currency, as: "fiatCurrency" },
            ],
          },
        ],
      });
    }
  }

  Trade.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      buy_order_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "orders",
          key: "id",
        },
      },
      sell_order_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "orders",
          key: "id",
        },
      },
      amount: {
        type: DataTypes.DECIMAL(18, 8),
        allowNull: false,
      },
      price: {
        type: DataTypes.DECIMAL(18, 2),
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: "Trade",
      tableName: "trades",
      timestamps: false,
    }
  );

  return Trade;
};
