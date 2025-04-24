const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class Wallet extends Model {
    static associate(models) {
      Wallet.belongsTo(models.User, { foreignKey: "user_id" });
      Wallet.belongsTo(models.Currency, { foreignKey: "currency_id" });
      Wallet.hasMany(models.Transaction, {
        foreignKey: "from_wallet_id",
        as: "outgoingTransactions",
      });
      Wallet.hasMany(models.Transaction, {
        foreignKey: "to_wallet_id",
        as: "incomingTransactions",
      });
    }

    // Method to get wallet's transactions
    async getTransactions() {
      return await sequelize.models.Transaction.findAll({
        where: {
          [sequelize.Op.or]: [
            { from_wallet_id: this.id },
            { to_wallet_id: this.id },
          ],
        },
        include: [
          {
            model: sequelize.models.Wallet,
            as: "fromWallet",
            include: [sequelize.models.Currency],
          },
          {
            model: sequelize.models.Wallet,
            as: "toWallet",
            include: [sequelize.models.Currency],
          },
        ],
      });
    }

    // Method to update balance
    async updateBalance(amount) {
      this.balance += amount;
      return await this.save();
    }
  }

  Wallet.init(
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
      currency_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "currencies",
          key: "id",
        },
      },
      balance: {
        type: DataTypes.DECIMAL(18, 8),
        allowNull: false,
        defaultValue: 0,
      },
      address: {
        type: DataTypes.STRING,
        allowNull: true,
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
      modelName: "Wallet",
      tableName: "wallets",
      timestamps: false,
    }
  );

  return Wallet;
};
