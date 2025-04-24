const express = require("express");
const router = express.Router();
const TransactionController = require("../controllers/TransactionController");
const { authenticate } = require("../middleware/auth");

router.get("/", authenticate, TransactionController.getUserTransactions);
router.get("/:id", authenticate, TransactionController.getTransaction);

module.exports = router;
