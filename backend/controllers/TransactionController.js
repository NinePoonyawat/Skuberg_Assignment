const { Transaction, Wallet, Currency, User } = require("../models");

class TransactionController {
  // Get user transactions
  async getUserTransactions(req, res) {
    try {
      const userId = req.user.id;

      // Get all user wallets
      const wallets = await Wallet.findAll({
        where: { user_id: userId },
      });

      const walletIds = wallets.map((wallet) => wallet.id);

      // Get transactions for these wallets
      const transactions = await Transaction.findAll({
        where: {
          [sequelize.Op.or]: [
            { from_wallet_id: walletIds },
            { to_wallet_id: walletIds },
          ],
        },
        include: [
          {
            model: Wallet,
            as: "fromWallet",
            include: [User, Currency],
          },
          {
            model: Wallet,
            as: "toWallet",
            include: [User, Currency],
          },
        ],
      });

      res.status(200).json({
        transactions,
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to fetch transactions",
        error: error.message,
      });
    }
  }

  // Get transaction details
  async getTransaction(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Get all user wallets
      const wallets = await Wallet.findAll({
        where: { user_id: userId },
      });

      const walletIds = wallets.map((wallet) => wallet.id);

      // Find transaction
      const transaction = await Transaction.findOne({
        where: {
          id,
          [sequelize.Op.or]: [
            { from_wallet_id: walletIds },
            { to_wallet_id: walletIds },
          ],
        },
        include: [
          {
            model: Wallet,
            as: "fromWallet",
            include: [User, Currency],
          },
          {
            model: Wallet,
            as: "toWallet",
            include: [User, Currency],
          },
        ],
      });

      if (!transaction) {
        return res.status(404).json({
          message: "Transaction not found",
        });
      }

      res.status(200).json({
        transaction,
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to fetch transaction",
        error: error.message,
      });
    }
  }
}

module.exports = new TransactionController();
