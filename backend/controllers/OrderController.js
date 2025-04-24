const {
  Order,
  Currency,
  Wallet,
  Trade,
  Transaction,
  User,
  sequelize,
} = require("../models");

class OrderController {
  // Get all orders
  async getAllOrders(req, res) {
    try {
      const { currency_id, fiat_currency_id, type } = req.query;

      const query = {};
      if (currency_id) query.currency_id = currency_id;
      if (fiat_currency_id) query.fiat_currency_id = fiat_currency_id;
      if (type) query.type = type;

      const orders = await Order.findAll({
        where: query,
        include: [
          User,
          { model: Currency, as: "currency" },
          { model: Currency, as: "fiatCurrency" },
        ],
      });

      res.status(200).json({
        orders,
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to fetch orders",
        error: error.message,
      });
    }
  }

  // Get user orders
  async getUserOrders(req, res) {
    try {
      const userId = req.user.id;
      const { status } = req.query;

      const query = { user_id: userId };
      if (status) query.status = status;

      const orders = await Order.findAll({
        where: query,
        include: [
          { model: Currency, as: "currency" },
          { model: Currency, as: "fiatCurrency" },
        ],
      });

      res.status(200).json({
        orders,
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to fetch orders",
        error: error.message,
      });
    }
  }

  // Create a new order
  async createOrder(req, res) {
    const t = await sequelize.transaction();

    try {
      const { type, currency_id, fiat_currency_id, amount, price } = req.body;
      const userId = req.user.id;

      // Create the order
      const order = await Order.create(
        {
          user_id: userId,
          type,
          currency_id,
          fiat_currency_id,
          amount,
          price,
          status: "open",
        },
        { transaction: t }
      );

      // Check if we need to reserve funds
      if (type === "sell") {
        // Find user's wallet for this currency
        const wallet = await Wallet.findOne({
          where: {
            user_id: userId,
            currency_id,
          },
          transaction: t,
        });

        if (!wallet || wallet.balance < amount) {
          await t.rollback();
          return res.status(400).json({
            message: "Insufficient balance",
          });
        }

        // Lock the funds
        await wallet.updateBalance(-parseFloat(amount));
      } else if (type === "buy") {
        // Find user's wallet for the fiat currency
        const wallet = await Wallet.findOne({
          where: {
            user_id: userId,
            currency_id: fiat_currency_id,
          },
          transaction: t,
        });

        const totalCost = parseFloat(amount) * parseFloat(price);

        if (!wallet || wallet.balance < totalCost) {
          await t.rollback();
          return res.status(400).json({
            message: "Insufficient balance",
          });
        }

        // Lock the funds
        await wallet.updateBalance(-parseFloat(totalCost));
      }

      // Find matching orders
      const matchingOrders = await order.findMatchingOrders();

      // Process matching orders
      let remainingAmount = parseFloat(amount);

      for (const matchingOrder of matchingOrders) {
        if (remainingAmount <= 0) break;

        const tradeAmount = Math.min(
          remainingAmount,
          parseFloat(matchingOrder.amount)
        );
        const tradePrice = type === "buy" ? matchingOrder.price : order.price;

        // Create trade record
        const trade = await Trade.create(
          {
            buy_order_id: type === "buy" ? order.id : matchingOrder.id,
            sell_order_id: type === "sell" ? order.id : matchingOrder.id,
            amount: tradeAmount,
            price: tradePrice,
          },
          { transaction: t }
        );

        // Update order status if fully filled
        if (tradeAmount >= parseFloat(matchingOrder.amount)) {
          await matchingOrder.update({ status: "filled" }, { transaction: t });
        } else {
          await matchingOrder.update(
            {
              amount: parseFloat(matchingOrder.amount) - tradeAmount,
            },
            { transaction: t }
          );
        }

        remainingAmount -= tradeAmount;

        // Process the trade (transfer funds)
        const buyer = type === "buy" ? userId : matchingOrder.user_id;
        const seller = type === "sell" ? userId : matchingOrder.user_id;

        // Get buyer and seller wallets
        const buyerFiatWallet = await Wallet.findOne({
          where: { user_id: buyer, currency_id: fiat_currency_id },
          transaction: t,
        });

        const buyerCryptoWallet = await Wallet.findOne({
          where: { user_id: buyer, currency_id },
          transaction: t,
        });

        const sellerFiatWallet = await Wallet.findOne({
          where: { user_id: seller, currency_id: fiat_currency_id },
          transaction: t,
        });

        const sellerCryptoWallet = await Wallet.findOne({
          where: { user_id: seller, currency_id },
          transaction: t,
        });

        // Calculate total cost
        const totalFiatAmount = tradeAmount * parseFloat(tradePrice);

        // Transfer crypto from seller to buyer
        await Transaction.create(
          {
            type: "trade",
            from_wallet_id: sellerCryptoWallet.id,
            to_wallet_id: buyerCryptoWallet.id,
            amount: tradeAmount,
            status: "completed",
          },
          { transaction: t }
        );

        await buyerCryptoWallet.updateBalance(tradeAmount);

        // Transfer fiat from buyer to seller
        await Transaction.create(
          {
            type: "trade",
            from_wallet_id: buyerFiatWallet.id,
            to_wallet_id: sellerFiatWallet.id,
            amount: totalFiatAmount,
            status: "completed",
          },
          { transaction: t }
        );

        await sellerFiatWallet.updateBalance(totalFiatAmount);
      }

      // Update order status if fully filled
      if (remainingAmount <= 0) {
        await order.update({ status: "filled" }, { transaction: t });
      } else if (remainingAmount < parseFloat(amount)) {
        await order.update({ amount: remainingAmount }, { transaction: t });
      }

      await t.commit();

      res.status(201).json({
        message: "Order created successfully",
        order,
      });
    } catch (error) {
      await t.rollback();
      res.status(500).json({
        message: "Order creation failed",
        error: error.message,
      });
    }
  }

  // Cancel an order
  async cancelOrder(req, res) {
    const t = await sequelize.transaction();

    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Find the order
      const order = await Order.findOne({
        where: { id, user_id: userId },
        include: [
          { model: Currency, as: "currency" },
          { model: Currency, as: "fiatCurrency" },
        ],
        transaction: t,
      });

      if (!order) {
        await t.rollback();
        return res.status(404).json({
          message: "Order not found",
        });
      }

      if (order.status !== "open") {
        await t.rollback();
        return res.status(400).json({
          message: "Only open orders can be canceled",
        });
      }

      // Return locked funds
      if (order.type === "sell") {
        // Find user's crypto wallet
        const wallet = await Wallet.findOne({
          where: {
            user_id: userId,
            currency_id: order.currency_id,
          },
          transaction: t,
        });

        // Return crypto
        await wallet.updateBalance(parseFloat(order.amount));
      } else if (order.type === "buy") {
        // Find user's fiat wallet
        const wallet = await Wallet.findOne({
          where: {
            user_id: userId,
            currency_id: order.fiat_currency_id,
          },
          transaction: t,
        });

        // Return fiat
        const totalAmount = parseFloat(order.amount) * parseFloat(order.price);
        await wallet.updateBalance(totalAmount);
      }

      // Update order status
      await order.update({ status: "canceled" }, { transaction: t });

      await t.commit();

      res.status(200).json({
        message: "Order canceled successfully",
        order,
      });
    } catch (error) {
      await t.rollback();
      res.status(500).json({
        message: "Failed to cancel order",
        error: error.message,
      });
    }
  }
}

module.exports = new OrderController();
