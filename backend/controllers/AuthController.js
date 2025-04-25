const jwt = require("jsonwebtoken");
const { User, Wallet, Currency } = require("../models");

const SECRET = process.env.JWT_SECRET || "test_jwt_secret";

class AuthController {
  // Register a new user
  async register(req, res) {
    try {
      const { username, email, password, phone_number } = req.body;

      // Basic validation
      if (!username || !email || !password || !phone_number) {
        return res.status(400).json({
          message:
            "All fields (username, email, password, phone_number) are required",
        });
      }

      // Simple email format check
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          message: "Invalid email format",
        });
      }

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
            currency.type === "crypto"
              ? Math.random().toString(36).substring(2, 15) +
                Math.random().toString(36).substring(2, 15)
              : null,
        });
      }

      // Generate JWT token
      const token = jwt.sign({ id: user.id }, SECRET, {
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
      const token = jwt.sign({ id: user.id }, SECRET, {
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

  //Get all users
  async getAllUsers(req, res) {
    try {
      const users = await User.findAll();

      res.status(200).json({
        users,
      });
    } catch (error) {
      res.status(500).json({
        message: "Get users failed",
        error: error.message,
      });
    }
  }

  //Update user
  async updateUser(req, res) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const { username, email, phone_number } = req.body;

      if (!username && !email && !phone_number) {
        return res.status(400).json({
          message:
            "At least one field (username, email, phone_number) is required",
        });
      }

      const user = await User.findByPk(decoded.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (username) user.username = username;
      if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({ message: "Invalid email format" });
        }
        user.email = email;
      }
      if (phone_number) user.phone_number = phone_number;

      await user.save();

      res.status(200).json({
        message: "User updated successfully",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          phone_number: user.phone_number,
        },
      });
    } catch (error) {
      res.status(400).json({
        message: "Update failed",
        error: error.message,
      });
    }
  }

  //Delete user
  async deleteUser(req, res) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          message: "Email and password must be provided in headers",
        });
      }

      const user = await User.findByPk(decoded.id);
      if (!user || user.email !== email) {
        return res.status(404).json({ message: "User not found" });
      }

      const isPasswordValid = await user.verifyPassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      await user.destroy();

      res.status(200).json({
        message: "User deleted successfully",
      });
    } catch (error) {
      res.status(400).json({
        message: "Delete failed",
        error: error.message,
      });
    }
  }
}

module.exports = new AuthController();
