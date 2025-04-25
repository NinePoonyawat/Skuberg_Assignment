const request = require("supertest");
const app = require("../app");
const { sequelize, User } = require("../models");
const seed = require("../seeders/DatabaseSeeder");

let token;
let testUserId;

beforeAll(async () => {
  // Run the seeder to set up test data
  await seed();
});

afterAll(async () => {
  // Clean up database connection
  await sequelize.close();
});

describe("Authentication Endpoints", () => {
  describe("POST /api/auth/register", () => {
    it("should register a new user", async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "jestuser",
        email: "jestuser@example.com",
        password: "password123",
        phone_number: "+66333444555",
      });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty("token");
      expect(res.body).toHaveProperty("user");
      expect(res.body.user).toHaveProperty("id");
      expect(res.body.message).toEqual("User registered successfully");

      testUserId = res.body.user.id;
    });

    it("should not register with duplicate email", async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "duplicateuser",
        email: "jestuser@example.com", // Same email as before
        password: "password123",
        phone_number: "+66987654321",
      });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty("error");
    });
  });

  describe("POST /api/auth/login", () => {
    it("should login existing user", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "jestuser@example.com",
        password: "password123",
      });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("token");
      expect(res.body.message).toEqual("Login successful");

      // Save token for later tests
      token = res.body.token;
    });

    it("should not login with invalid credentials", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "jestuser@example.com",
        password: "wrongpassword",
      });

      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toEqual("Invalid credentials");
    });

    it("should not login non-existent user", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "nonexistent@example.com",
        password: "password123",
      });

      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toEqual("User not found");
    });
  });
});
