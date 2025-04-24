const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class Transaction extends Model {
    static associate(models) {
      Transaction.belongsTo(models.Wallet, {
        foreignKey: "from_wallet_id",
        as: "fromWallet",
      });
      Transaction.belongsTo(models.Wallet, {
        foreignKey: "to_wallet_id",
        as: "toWallet",
      });
    }

    // Method to get details with related models
    async getDetails() {
      return await sequelize.models.Transaction.findByPk(this.id, {
        include: [
          {
            model: sequelize.models.Wallet,
            as: "fromWallet",
            include: [sequelize.models.User, sequelize.models.Currency],
          },
          {
            model: sequelize.models.Wallet,
            as: "toWallet",
            include: [sequelize.models.User, sequelize.models.Currency],
          },
        ],
      });
    }
  }

  Transaction.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      type: {
        type: DataTypes.ENUM("deposit", "withdrawal", "trade"),
        allowNull: false,
      },
      from_wallet_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "wallets",
          key: "id",
        },
      },
      to_wallet_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "wallets",
          key: "id",
        },
      },
      amount: {
        type: DataTypes.DECIMAL(18, 8),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("pending", "completed", "failed"),
        allowNull: false,
        defaultValue: "pending",
      },
      fee: {
        type: DataTypes.DECIMAL(18, 8),
        allowNull: false,
        defaultValue: 0,
      },
      external_address: {
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
      modelName: "Transaction",
      tableName: "transactions",
      timestamps: false,
    }
  );

  return Transaction;
};
