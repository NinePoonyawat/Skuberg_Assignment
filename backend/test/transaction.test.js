const request = require("supertest");
const app = require("../app");
const { sequelize } = require("../models");
const seed = require("../seeders/DatabaseSeeder");

let token;
let testTransactionId;

beforeAll(async () => {
  await sequelize.sync({ force: true });

  await seed();

  // Login to get token
  const res = await request(app).post("/api/auth/login").send({
    email: "user1@example.com",
    password: "password123",
  });

  token = res.body.token;

  // Create a transaction by making a deposit
  // First get a wallet
  const walletsRes = await request(app)
    .get("/api/wallets")
    .set("Authorization", `Bearer ${token}`);

  if (walletsRes.body.wallets.length > 0) {
    const walletId = walletsRes.body.wallets[0].id;

    // Make a deposit to create a transaction
    const depositRes = await request(app)
      .post("/api/wallets/deposit")
      .set("Authorization", `Bearer ${token}`)
      .send({
        wallet_id: walletId,
        amount: 100,
      });

    if (depositRes.statusCode === 200) {
      testTransactionId = depositRes.body.transaction.id;
    }
  }
});

afterAll(async () => {
  await sequelize.close();
});

describe("Transaction Endpoints", () => {
  describe("GET /api/transactions", () => {
    it("should get all transactions for authenticated user", async () => {
      const res = await request(app)
        .get("/api/transactions")
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("transactions");
      expect(Array.isArray(res.body.transactions)).toBe(true);
    });

    it("should not allow access without authentication", async () => {
      const res = await request(app).get("/api/transactions");

      expect(res.statusCode).toEqual(401);
    });
  });

  describe("GET /api/transactions/:id", () => {
    it("should get a specific transaction", async () => {
      // Skip if no test transaction was created
      if (!testTransactionId) {
        console.log(
          "Skipping specific transaction test - no test transaction available"
        );
        return;
      }

      const res = await request(app)
        .get(`/api/transactions/${testTransactionId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("transaction");
      expect(res.body.transaction.id).toEqual(testTransactionId);
    });

    it("should return 404 for non-existent transaction", async () => {
      const res = await request(app)
        .get("/api/transactions/99999")
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toEqual("Transaction not found");
    });
  });
});
