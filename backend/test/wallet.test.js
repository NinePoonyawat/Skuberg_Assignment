const request = require("supertest");
const app = require("../app");
const { sequelize, User, Wallet } = require("../models");
const seed = require("../seeders/DatabaseSeeder");

let token;
let testWalletId;

beforeAll(async () => {
  await sequelize.sync({ force: true });

  await seed();

  // Login to get token
  const res = await request(app).post("/api/auth/login").send({
    email: "user1@example.com",
    password: "password123",
  });

  token = res.body.token;
});

afterAll(async () => {
  await sequelize.close();
});

describe("Wallet Endpoints", () => {
  describe("GET /api/wallets", () => {
    it("should get all wallets for authenticated user", async () => {
      const res = await request(app)
        .get("/api/wallets")
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("wallets");
      expect(Array.isArray(res.body.wallets)).toBe(true);
      expect(res.body.wallets.length).toBeGreaterThan(0);

      // Save a wallet ID for later tests
      testWalletId = res.body.wallets[0].id;
    });

    it("should not allow access without authentication", async () => {
      const res = await request(app).get("/api/wallets");

      expect(res.statusCode).toEqual(401);
    });
  });

  describe("GET /api/wallets/:id", () => {
    it("should get a specific wallet", async () => {
      const res = await request(app)
        .get(`/api/wallets/${testWalletId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("wallet");
      expect(res.body.wallet.id).toEqual(testWalletId);
    });

    it("should return 404 for non-existent wallet", async () => {
      const res = await request(app)
        .get("/api/wallets/9999")
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toEqual(404);
    });
  });

  describe("POST /api/wallets/deposit", () => {
    it("should deposit funds to wallet", async () => {
      const depositAmount = 500;

      // Get initial balance
      const initialWallet = await request(app)
        .get(`/api/wallets/${testWalletId}`)
        .set("Authorization", `Bearer ${token}`);

      const initialBalance = parseFloat(initialWallet.body.wallet.balance);

      // Make deposit
      const res = await request(app)
        .post("/api/wallets/deposit")
        .set("Authorization", `Bearer ${token}`)
        .send({
          wallet_id: testWalletId,
          amount: depositAmount,
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("transaction");
      expect(res.body).toHaveProperty("wallet");
      expect(parseFloat(res.body.wallet.balance)).toEqual(
        initialBalance + depositAmount
      );
    });
  });

  describe("POST /api/wallets/withdraw", () => {
    it("should withdraw funds from wallet", async () => {
      const withdrawAmount = 200;

      // Get initial balance
      const initialWallet = await request(app)
        .get(`/api/wallets/${testWalletId}`)
        .set("Authorization", `Bearer ${token}`);

      const initialBalance = parseFloat(initialWallet.body.wallet.balance);

      // Make withdrawal
      const res = await request(app)
        .post("/api/wallets/withdraw")
        .set("Authorization", `Bearer ${token}`)
        .send({
          wallet_id: testWalletId,
          amount: withdrawAmount,
          external_address: "0x123abc456def789ghi",
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("transaction");
      expect(res.body).toHaveProperty("wallet");
      expect(parseFloat(res.body.wallet.balance)).toEqual(
        initialBalance - withdrawAmount
      );
    });

    it("should not allow withdrawal with insufficient funds", async () => {
      // Get current balance
      const walletRes = await request(app)
        .get(`/api/wallets/${testWalletId}`)
        .set("Authorization", `Bearer ${token}`);

      const currentBalance = parseFloat(walletRes.body.wallet.balance);
      const excessiveAmount = currentBalance + 10000;

      const res = await request(app)
        .post("/api/wallets/withdraw")
        .set("Authorization", `Bearer ${token}`)
        .send({
          wallet_id: testWalletId,
          amount: excessiveAmount,
          external_address: "0x123abc456def789ghi",
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toEqual("Insufficient balance");
    });
  });

  describe("POST /api/wallets/transfer", () => {
    it("should transfer funds between users", async () => {
      // First, we need a destination wallet address
      // Get all wallets
      const walletsRes = await request(app)
        .get("/api/wallets")
        .set("Authorization", `Bearer ${token}`);

      // Find a different wallet for the same currency
      const sourceWallet = walletsRes.body.wallets.find(
        (w) => w.id === testWalletId
      );
      const destWallet = walletsRes.body.wallets.find(
        (w) =>
          w.id !== testWalletId && w.currency_id === sourceWallet.currency_id
      );

      if (!destWallet) {
        // Skip test if no suitable destination wallet found
        console.log("Skipping transfer test - no suitable destination wallet");
        return;
      }

      const transferAmount = 50;

      // Get initial balance
      const initialWallet = await request(app)
        .get(`/api/wallets/${testWalletId}`)
        .set("Authorization", `Bearer ${token}`);

      const initialBalance = parseFloat(initialWallet.body.wallet.balance);

      // Make transfer
      const res = await request(app)
        .post("/api/wallets/transfer")
        .set("Authorization", `Bearer ${token}`)
        .send({
          from_wallet_id: testWalletId,
          to_address: destWallet.address,
          amount: transferAmount,
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("transaction");
      expect(res.body).toHaveProperty("wallet");
      expect(parseFloat(res.body.wallet.balance)).toEqual(
        initialBalance - transferAmount
      );
    });
  });
});
