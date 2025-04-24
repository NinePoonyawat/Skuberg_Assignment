const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class Currency extends Model {
    static associate(models) {
      Currency.hasMany(models.Wallet, { foreignKey: "currency_id" });
      Currency.hasMany(models.Order, {
        foreignKey: "currency_id",
        as: "currencyOrders",
      });
      Currency.hasMany(models.Order, {
        foreignKey: "fiat_currency_id",
        as: "fiatCurrencyOrders",
      });
    }

    // Method to get all wallets with this currency
    async getWallets() {
      return await sequelize.models.Wallet.findAll({
        where: { currency_id: this.id },
        include: [sequelize.models.User],
      });
    }

    // Method to get all buy/sell orders for this currency
    async getOrders(type = null) {
      const query = { currency_id: this.id };
      if (type) query.type = type;

      return await sequelize.models.Order.findAll({
        where: query,
        include: [
          sequelize.models.User,
          { model: sequelize.models.Currency, as: "fiatCurrency" },
        ],
      });
    }
  }

  Currency.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      symbol: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      type: {
        type: DataTypes.ENUM("crypto", "fiat"),
        allowNull: false,
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
      modelName: "Currency",
      tableName: "currencies",
      timestamps: false,
    }
  );

  return Currency;
};
