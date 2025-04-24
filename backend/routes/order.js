const express = require("express");
const router = express.Router();
const OrderController = require("../controllers/OrderController");
const { authenticate } = require("../middleware/auth");

router.get("/", OrderController.getAllOrders);
router.get("/user", authenticate, OrderController.getUserOrders);
router.post("/", authenticate, OrderController.createOrder);
router.delete("/:id", authenticate, OrderController.cancelOrder);

module.exports = router;
