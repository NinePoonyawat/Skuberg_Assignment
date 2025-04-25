const express = require("express");
const router = express.Router();
const AuthController = require("../controllers/AuthController");

router.get("/", AuthController.getAllUsers);
router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.post("/edit", AuthController.updateUser);
router.delete("/", AuthController.deleteUser);

module.exports = router;
