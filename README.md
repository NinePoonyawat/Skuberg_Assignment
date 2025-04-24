# Skuberg_Assignment

This reposition use for Skuberg backend position examination

# Cryptocurrency Exchange Platform

A Node.js backend for a cryptocurrency exchange platform that allows users to trade cryptocurrencies for fiat currencies.

## Features

- User authentication (register/login)
- Wallet management for both crypto and fiat currencies
- Order creation and management (buy/sell)
- Automatic order matching and trade execution
- Transaction history
- Internal and external transfers

## Prerequisites

- Node.js (v14+)
- MySQL/PostgreSQL database

## Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/crypto-exchange.git
cd crypto-exchange
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory with the following content:

```
PORT=3000
DB_NAME=crypto_exchange
DB_USER=your_database_user
DB_PASS=your_database_password
DB_HOST=localhost
DB_PORT=3306
DB_DIALECT=mysql
JWT_SECRET=your_jwt_secret_key
```

4. Create the database:

```bash
npx sequelize-cli db:create
```

5. Run database migrations:

```bash
npx sequelize-cli db:migrate
```

6. Seed the database with initial data:

```bash
node seeders/DatabaseSeeder.js
```

## Running the Application

Start the server:

```bash
npm start
```

The API will be available at `http://localhost:3000/api`.

## API Endpoints

### Authentication

- POST /api/auth/register - Register a new user
- POST /api/auth/login - Login a user

### Wallets

- GET /api/wallets - Get all wallets for authenticated user
- GET /api/wallets/:id - Get a specific wallet
- POST /api/wallets/deposit - Deposit funds
- POST /api/wallets/withdraw - Withdraw funds
- POST /api/wallets/transfer - Transfer funds to another user

### Orders

- GET /api/orders - Get all public orders
- GET /api/orders/user - Get orders for authenticated user
- POST /api/orders - Create a new order
- DELETE /api/orders/:id - Cancel an order

### Transactions

- GET /api/transactions - Get all transactions for authenticated user
- GET /api/transactions/:id - Get a specific transaction

## Testing

Run tests:

```bash
npm test
```
