const jwt = require("jsonwebtoken");
const { User, Wallet, Currency } = require("../models");

class AuthController {
  // Register a new user
  async register(req, res) {
    try {
      const { username, email, password, phone_number } = req.body;

      // Create user
      const user = await User.create({
        username,
        email,
        password, // will be hashed via hooks
        phone_number,
      });

      // Create default wallets for the user (one for each currency)
      const currencies = await Currency.findAll();

      for (const currency of currencies) {
        await Wallet.create({
          user_id: user.id,
          currency_id: currency.id,
          balance: 0,
          address:
            currency.type === "crypto" ? this.generateWalletAddress() : null,
        });
      }

      // Generate JWT token
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: "24h",
      });

      res.status(201).json({
        message: "User registered successfully",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
        token,
      });
    } catch (error) {
      res.status(400).json({
        message: "Registration failed",
        error: error.message,
      });
    }
  }

  // Login user
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ where: { email } });

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      // Verify password
      const isPasswordValid = await user.verifyPassword(password);

      if (!isPasswordValid) {
        return res.status(401).json({
          message: "Invalid credentials",
        });
      }

      // Generate JWT token
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: "24h",
      });

      res.status(200).json({
        message: "Login successful",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
        token,
      });
    } catch (error) {
      res.status(500).json({
        message: "Login failed",
        error: error.message,
      });
    }
  }

  // Helper to generate wallet address for crypto
  generateWalletAddress() {
    // In a real system, this would be more sophisticated
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }
}

module.exports = new AuthController();
