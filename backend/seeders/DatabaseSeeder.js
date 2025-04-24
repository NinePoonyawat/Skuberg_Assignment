const { sequelize, User, Currency, Wallet } = require("../models");
const bcrypt = require("bcrypt");

async function seed() {
  try {
    // Sync database with force option to recreate tables
    await sequelize.sync({ force: true });

    // Create currencies
    const currencies = await Currency.bulkCreate([
      { name: "Bitcoin", symbol: "BTC", type: "crypto" },
      { name: "Ethereum", symbol: "ETH", type: "crypto" },
      { name: "Ripple", symbol: "XRP", type: "crypto" },
      { name: "Dogecoin", symbol: "DOGE", type: "crypto" },
      { name: "Thai Baht", symbol: "THB", type: "fiat" },
      { name: "US Dollar", symbol: "USD", type: "fiat" },
    ]);

    // Create test users
    const hashedPassword = await bcrypt.hash("password123", 10);

    const users = await User.bulkCreate([
      {
        username: "testuser1",
        email: "user1@example.com",
        password: hashedPassword,
        phone_number: "+66123456789",
        kyc_verified: true,
      },
      {
        username: "testuser2",
        email: "user2@example.com",
        password: hashedPassword,
        phone_number: "+66987654321",
        kyc_verified: true,
      },
      {
        username: "testuser3",
        email: "user3@example.com",
        password: hashedPassword,
        phone_number: "+66555555555",
        kyc_verified: false,
      },
    ]);

    // Create wallets for users
    const wallets = [];

    for (const user of users) {
      for (const currency of currencies) {
        wallets.push({
          user_id: user.id,
          currency_id: currency.id,
          balance: currency.type === "fiat" ? 10000 : 1,
          address:
            currency.type === "crypto"
              ? Math.random().toString(36).substring(2, 15) +
                Math.random().toString(36).substring(2, 15)
              : null,
        });
      }
    }

    await Wallet.bulkCreate(wallets);

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Seeding failed:", error);
  } finally {
    // Close database connection
    await sequelize.close();
  }
}

// Run the seeder if called directly
if (require.main === module) {
  seed();
}

module.exports = seed;
