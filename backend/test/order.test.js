const request = require("supertest");
const app = require("../app");
const { sequelize } = require("../models");
const seed = require("../seeders/DatabaseSeeder");

let token;
let testOrderId;

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

describe("Order Endpoints", () => {
  describe("GET /api/orders", () => {
    it("should get all public orders", async () => {
      const res = await request(app).get("/api/orders");

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("orders");
      expect(Array.isArray(res.body.orders)).toBe(true);
    });

    it("should filter orders by query parameters", async () => {
      const res = await request(app).get("/api/orders?currency_id=1&type=buy");

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("orders");

      // Check that all returned orders match the filter criteria
      if (res.body.orders.length > 0) {
        const allMatchFilter = res.body.orders.every(
          (order) => order.currency_id === 1 && order.type === "buy"
        );
        expect(allMatchFilter).toBe(true);
      }
    });
  });

  describe("GET /api/orders/user", () => {
    it("should get orders for authenticated user", async () => {
      const res = await request(app)
        .get("/api/orders/user")
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("orders");
      expect(Array.isArray(res.body.orders)).toBe(true);
    });

    it("should filter user orders by status", async () => {
      const res = await request(app)
        .get("/api/orders/user?status=open")
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("orders");

      // Check that all returned orders match the filter criteria
      if (res.body.orders.length > 0) {
        const allMatchFilter = res.body.orders.every(
          (order) => order.status === "open"
        );
        expect(allMatchFilter).toBe(true);
      }
    });
  });

  describe("POST /api/orders", () => {
    it("should create a new buy order", async () => {
      // First get a wallet with sufficient balance
      const walletsRes = await request(app)
        .get("/api/wallets")
        .set("Authorization", `Bearer ${token}`);

      // Find a fiat wallet with some balance
      const fiatWallet = walletsRes.body.wallets.find(
        (w) =>
          w.Currency && w.Currency.type === "fiat" && parseFloat(w.balance) > 0
      );

      if (!fiatWallet) {
        console.log(
          "Skipping buy order test - no fiat wallet with balance found"
        );
        return;
      }

      const res = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${token}`)
        .send({
          type: "buy",
          currency_id: 1, // BTC
          fiat_currency_id: fiatWallet.currency_id,
          amount: 0.01,
          price: 10000.0,
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty("order");
      expect(res.body.message).toEqual("Order created successfully");

      testOrderId = res.body.order.id;
    });

    it("should create a new sell order", async () => {
      // First get a wallet with sufficient balance
      const walletsRes = await request(app)
        .get("/api/wallets")
        .set("Authorization", `Bearer ${token}`);

      // Find a crypto wallet with some balance
      const cryptoWallet = walletsRes.body.wallets.find(
        (w) =>
          w.Currency &&
          w.Currency.type === "crypto" &&
          parseFloat(w.balance) > 0
      );

      if (!cryptoWallet) {
        console.log(
          "Skipping sell order test - no crypto wallet with balance found"
        );
        return;
      }

      const res = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${token}`)
        .send({
          type: "sell",
          currency_id: cryptoWallet.currency_id,
          fiat_currency_id: 5, // THB
          amount: 0.001, // Small amount to ensure there's enough balance
          price: 35000.0,
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty("order");
      expect(res.body.message).toEqual("Order created successfully");

      if (!testOrderId) {
        testOrderId = res.body.order.id;
      }
    });

    it("should not create order with insufficient balance", async () => {
      // Attempt to create an order with extremely high amount
      const res = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${token}`)
        .send({
          type: "buy",
          currency_id: 1,
          fiat_currency_id: 5,
          amount: 1000000, // Very high amount
          price: 35000.0,
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toEqual("Insufficient balance");
    });
  });

  describe("DELETE /api/orders/:id", () => {
    it("should cancel an order", async () => {
      // Skip if no test order was created
      if (!testOrderId) {
        console.log("Skipping cancel test - no test order available");
        return;
      }

      const res = await request(app)
        .delete(`/api/orders/${testOrderId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toEqual("Order canceled successfully");
      expect(res.body.order.status).toEqual("canceled");
    });

    it("should not cancel non-existent order", async () => {
      const res = await request(app)
        .delete("/api/orders/99999")
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toEqual("Order not found");
    });
  });
});
