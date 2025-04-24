const express = require("express");
const router = express.Router();
const WalletController = require("../controllers/WalletController");
const { authenticate } = require("../middleware/auth");

router.get("/", authenticate, WalletController.getUserWallets);
router.get("/:id", authenticate, WalletController.getWallet);
router.post("/deposit", authenticate, WalletController.deposit);
router.post("/withdraw", authenticate, WalletController.withdraw);
router.post("/transfer", authenticate, WalletController.transfer);

module.exports = router;
