const express = require("express");
const router = express.Router();

const authRoutes = require("./auth");
const walletRoutes = require("./wallet");
const orderRoutes = require("./order");
const transactionRoutes = require("./transaction");

router.use("/auth", authRoutes);
router.use("/wallets", walletRoutes);
router.use("/orders", orderRoutes);
router.use("/transactions", transactionRoutes);

module.exports = router;
