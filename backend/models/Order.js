const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class Order extends Model {
    static associate(models) {
      Order.belongsTo(models.User, { foreignKey: "user_id" });
      Order.belongsTo(models.Currency, {
        foreignKey: "currency_id",
        as: "currency",
      });
      Order.belongsTo(models.Currency, {
        foreignKey: "fiat_currency_id",
        as: "fiatCurrency",
      });
      Order.hasMany(models.Trade, {
        foreignKey: "buy_order_id",
        as: "buyTrades",
      });
      Order.hasMany(models.Trade, {
        foreignKey: "sell_order_id",
        as: "sellTrades",
      });
    }

    // Method to get all trades related to this order
    async getTrades() {
      return await sequelize.models.Trade.findAll({
        where: {
          [sequelize.Op.or]: [
            { buy_order_id: this.id },
            { sell_order_id: this.id },
          ],
        },
      });
    }

    // Method to find matching orders
    async findMatchingOrders() {
      const oppositeType = this.type === "buy" ? "sell" : "buy";

      return await sequelize.models.Order.findAll({
        where: {
          type: oppositeType,
          currency_id: this.currency_id,
          fiat_currency_id: this.fiat_currency_id,
          status: "open",
          // For buy orders, find sell orders with price <= this.price
          // For sell orders, find buy orders with price >= this.price
          price:
            this.type === "buy"
              ? { [sequelize.Op.lte]: this.price }
              : { [sequelize.Op.gte]: this.price },
        },
        order: [["price", this.type === "buy" ? "ASC" : "DESC"]],
        include: [sequelize.models.User],
      });
    }
  }

  Order.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      type: {
        type: DataTypes.ENUM("buy", "sell"),
        allowNull: false,
      },
      currency_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "currencies",
          key: "id",
        },
      },
      fiat_currency_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "currencies",
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
      status: {
        type: DataTypes.ENUM("open", "filled", "canceled"),
        allowNull: false,
        defaultValue: "open",
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: "Order",
      tableName: "orders",
      timestamps: false,
    }
  );

  return Order;
};
