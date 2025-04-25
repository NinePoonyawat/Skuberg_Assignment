const { Wallet, Currency, Transaction } = require("../models");

class WalletController {
  // Get all wallets for a user
  async getUserWallets(req, res) {
    try {
      const userId = req.user.id;

      const wallets = await Wallet.findAll({
        where: { user_id: userId },
        include: [Currency],
      });

      res.status(200).json({
        wallets,
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to fetch wallets",
        error: error.message,
      });
    }
  }

  // Get specific wallet
  async getWallet(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const wallet = await Wallet.findOne({
        where: { id, user_id: userId },
        include: [Currency],
      });

      if (!wallet) {
        return res.status(404).json({
          message: "Wallet not found",
        });
      }

      res.status(200).json({
        wallet,
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to fetch wallet",
        error: error.message,
      });
    }
  }

  // Deposit funds
  async deposit(req, res) {
    try {
      const { wallet_id, amount } = req.body;
      const userId = req.user.id;

      // Check if wallet belongs to user
      const wallet = await Wallet.findOne({
        where: { id: wallet_id, user_id: userId },
        include: [Currency],
      });

      if (!wallet) {
        return res.status(404).json({
          message: "Wallet not found",
        });
      }

      // Create deposit transaction
      const transaction = await Transaction.create({
        type: "deposit",
        to_wallet_id: wallet.id,
        amount,
        status: "completed",
      });

      console.log("before:", wallet.balance);
      // Update wallet balance
      await wallet.updateBalance(parseFloat(amount));
      console.log("after:", wallet.balance);

      res.status(200).json({
        message: "Deposit successful",
        transaction,
        wallet: {
          id: wallet.id,
          balance: wallet.balance,
          currency: wallet.Currency.symbol,
        },
      });
    } catch (error) {
      res.status(500).json({
        message: "Deposit failed",
        error: error.message,
      });
    }
  }

  // Withdraw funds
  async withdraw(req, res) {
    try {
      const { wallet_id, amount, external_address } = req.body;
      const userId = req.user.id;

      // Check if wallet belongs to user
      const wallet = await Wallet.findOne({
        where: { id: wallet_id, user_id: userId },
        include: [Currency],
      });

      if (!wallet) {
        return res.status(404).json({
          message: "Wallet not found",
        });
      }

      // Check if sufficient balance
      if (wallet.balance < amount) {
        return res.status(400).json({
          message: "Insufficient balance",
        });
      }

      // Create withdrawal transaction
      const transaction = await Transaction.create({
        type: "withdrawal",
        from_wallet_id: wallet.id,
        amount,
        status: "pending",
        external_address,
      });

      // Update wallet balance (will be updated once transaction is confirmed)
      await wallet.updateBalance(-parseFloat(amount));

      res.status(200).json({
        message: "Withdrawal initiated",
        transaction,
        wallet: {
          id: wallet.id,
          balance: wallet.balance,
          currency: wallet.Currency.symbol,
        },
      });
    } catch (error) {
      res.status(500).json({
        message: "Withdrawal failed",
        error: error.message,
      });
    }
  }

  // Transfer funds to another user within the system
  async transfer(req, res) {
    try {
      const { from_wallet_id, to_user_id, amount } = req.body;
      const userId = req.user.id;

      // Check if source wallet belongs to user
      const fromWallet = await Wallet.findOne({
        where: { id: from_wallet_id, user_id: userId },
        include: [Currency],
      });

      if (!fromWallet) {
        return res.status(404).json({
          message: "Wallet not found",
        });
      }

      // Check if sufficient balance
      if (fromWallet.balance < amount) {
        return res.status(400).json({
          message: "Insufficient balance",
        });
      }

      // Find destination wallet by address
      console.log(to_user_id);
      console.log(fromWallet.currency_id);
      const toWallet = await Wallet.findOne({
        where: { user_id: to_user_id, currency_id: fromWallet.currency_id },
        include: [Currency],
      });

      if (!toWallet) {
        return res.status(404).json({
          message: "Destination wallet not found",
        });
      }

      // Create transfer transaction
      const transaction = await Transaction.create({
        type: "trade",
        from_wallet_id: fromWallet.id,
        to_wallet_id: toWallet.id,
        amount,
        status: "completed",
      });

      // Update wallet balances
      await fromWallet.updateBalance(-parseFloat(amount));
      await toWallet.updateBalance(parseFloat(amount));

      res.status(200).json({
        message: "Transfer successful",
        transaction,
        wallet: {
          id: fromWallet.id,
          balance: fromWallet.balance,
          currency: fromWallet.Currency.symbol,
        },
      });
    } catch (error) {
      res.status(500).json({
        message: "Transfer failed",
        error: error.message,
      });
    }
  }
}

module.exports = new WalletController();
