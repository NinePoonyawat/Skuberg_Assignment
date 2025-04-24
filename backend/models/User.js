const { Model, DataTypes } = require("sequelize");
const bcrypt = require("bcrypt");

module.exports = (sequelize) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.Wallet, { foreignKey: "user_id" });
      User.hasMany(models.Order, { foreignKey: "user_id" });
    }

    // Method to get user's wallets
    async getWallets() {
      return await sequelize.models.Wallet.findAll({
        where: { user_id: this.id },
      });
    }

    // Method to get user's orders
    async getOrders(status = null) {
      const query = { user_id: this.id };
      if (status) query.status = status;

      return await sequelize.models.Order.findAll({
        where: query,
        include: [
          { model: sequelize.models.Currency, as: "currency" },
          { model: sequelize.models.Currency, as: "fiatCurrency" },
        ],
      });
    }

    // Method to get user's transactions
    async getTransactions() {
      const wallets = await this.getWallets();
      const walletIds = wallets.map((wallet) => wallet.id);

      return await sequelize.models.Transaction.findAll({
        where: {
          [sequelize.Op.or]: [
            { from_wallet_id: walletIds },
            { to_wallet_id: walletIds },
          ],
        },
        include: [
          { model: sequelize.models.Wallet, as: "fromWallet" },
          { model: sequelize.models.Wallet, as: "toWallet" },
        ],
      });
    }

    // Helper method to verify password
    async verifyPassword(password) {
      return await bcrypt.compare(password, this.password);
    }
  }

  User.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      phone_number: {
        type: DataTypes.STRING,
      },
      kyc_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
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
      modelName: "User",
      tableName: "users",
      timestamps: false,
      hooks: {
        beforeCreate: async (user) => {
          if (user.password) {
            user.password = await bcrypt.hash(user.password, 10);
          }
        },
        beforeUpdate: async (user) => {
          if (user.changed("password")) {
            user.password = await bcrypt.hash(user.password, 10);
          }
        },
      },
    }
  );

  return User;
};
