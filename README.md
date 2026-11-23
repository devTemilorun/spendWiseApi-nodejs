# SpendWise — Smart Expense Tracker API

A backend API that turns Nigerian bank SMS alerts into structured, categorized spending data. Users forward a bank alert and the API parses it, identifies the bank, categorizes the merchant, and tracks it against monthly budgets.

## Tech Stack

Node.js · Express · TypeScript · MongoDB · Mongoose · JWT · Zod · node-cron · Jest

## Features

- JWT authentication with access and refresh tokens
- SMS parser for Nigerian banks including GTB, Access, UBA, FirstBank, Opay, Kuda, and Moniepoint
- Automatic bank detection and parsing
- Keyword-based automatic categorization with gambling flagging
- Budgets with configurable spending thresholds
- Analytics using MongoDB aggregations
- Monthly reports through node-cron
- SMS gateway webhook ingestion with duplicate protection using SHA-256
- Bulk SMS import
- CSV export
- Rate limiting, Helmet hardening, and cross-user isolation tests
- Docker and Docker Compose support

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/devTemilorun/spendWiseApi-nodejs.git
cd spendWiseApi-nodejs
npm install
```

### 2. Configure the environment

```bash
cp .env.example .env
```

Set the variables in `.env`:

| Variable | Description |
|---|---|
| `PORT` | HTTP port (default: `5000`) |
| `NODE_ENV` | `development`, `production`, or `test` |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Access-token signing secret |
| `JWT_EXPIRES_IN` | Access-token lifetime, for example `15m` |
| `JWT_REFRESH_SECRET` | Refresh-token signing secret |
| `JWT_REFRESH_EXPIRES_IN` | Refresh-token lifetime, for example `7d` |
| `SMS_WEBHOOK_SECRET` | Shared secret for SMS gateway webhooks |
| `CORS_ORIGINS` | Optional comma-separated allowlist of frontend origins |

Use strong, unique values for `JWT_SECRET`, `JWT_REFRESH_SECRET`, and `SMS_WEBHOOK_SECRET` in production.

### 3. Run the API

**Locally:**

```bash
npm run dev
```

**With Docker:**

```bash
docker compose up --build
```

The API is available at `http://localhost:5000`, and the health check is at `http://localhost:5000/api/health`.

### 4. Run the monthly report

```bash
npm run report:run
```

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | No | Server uptime and database status |
| POST | `/api/auth/register` | No | Register a user |
| POST | `/api/auth/login` | No | Log in |
| POST | `/api/auth/refresh` | No | Refresh access and refresh tokens |
| POST | `/api/auth/logout` | Yes | Log out |
| POST | `/api/auth/change-password` | Yes | Change password |
| POST | `/api/auth/forgot-password` | No | Request a password-reset token |
| POST | `/api/auth/reset-password` | No | Reset a password |
| GET | `/api/users/me` | Yes | Get the current user's profile |
| PUT | `/api/users/me` | Yes | Update the current user's profile |
| DELETE | `/api/users/me` | Yes | Delete the current user's account |
| POST | `/api/users/link-bank` | Yes | Link a bank account |
| POST | `/api/transactions/manual` | Yes | Create a manual transaction |
| GET | `/api/transactions` | Yes | List transactions with filters and pagination |
| GET | `/api/transactions/:id` | Yes | Get one transaction |
| PUT | `/api/transactions/:id` | Yes | Update a transaction |
| DELETE | `/api/transactions/:id` | Yes | Delete a transaction |
| POST | `/api/transactions/bulk` | Yes | Bulk-import SMS transactions |
| GET | `/api/categories` | Yes | List categories |
| POST | `/api/categories` | Yes | Create a custom category |
| DELETE | `/api/categories/:id` | Yes | Delete a custom category |
| POST | `/api/sms/parse` | Yes | Parse one SMS alert |
| POST | `/api/sms/webhook` | Secret | Receive an SMS gateway webhook |
| POST | `/api/budgets` | Yes | Set or update a budget |
| GET | `/api/budgets` | Yes | List budgets for a month |
| GET | `/api/budgets/category` | Yes | Get a category budget |
| DELETE | `/api/budgets/:id` | Yes | Delete a budget |
| GET | `/api/analytics/monthly` | Yes | Monthly spending summary |
| GET | `/api/analytics/category-breakdown` | Yes | Spending by category |
| GET | `/api/analytics/trend` | Yes | Spending trend |
| GET | `/api/analytics/compare` | Yes | Compare spending between months |
| GET | `/api/analytics/top-merchants` | Yes | List top merchants |
| GET | `/api/analytics/alerts` | Yes | List current budget breaches |
| GET | `/api/reports/monthly` | Yes | Generate a monthly report |
| GET | `/api/reports/export/csv` | Yes | Export transactions as CSV |
| GET | `/api/notifications` | Yes | List notifications |
| PATCH | `/api/notifications/:id/read` | Yes | Mark a notification as read |

## Project Structure

```text
src/
├── config/         # Environment and database configuration
├── models/         # Mongoose schemas
├── controllers/    # HTTP handlers
├── services/       # Business logic
├── routes/         # Express routers
├── middlewares/    # Authentication, validation, rate limiting, errors
├── jobs/           # Node cron jobs
├── utils/          # Shared helpers
├── validators/     # Zod schemas
├── types/          # Shared TypeScript types
└── scripts/        # Operational scripts
```

## Testing

```bash
npm test
npm run test:coverage
npm run typecheck
```

Tests cover SMS parsing, budget thresholds, authentication, password reset, reports, and cross-user isolation.

## Deployment

### Render or Railway

1. Push the repository to GitHub.
2. Create a Web Service and connect the repository.
3. Set all required environment variables, using a MongoDB Atlas URI for `MONGO_URI`.
4. Set `CORS_ORIGINS` to the deployed frontend URL if applicable.
5. Use `npm ci && npm run build` as the build command.
6. Use `npm start` as the start command.

For Docker deployments, use `docker compose up --build -d` after supplying a deployment `.env` file.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).