# WhatsApp Accounting

A WhatsApp-based accounting solution for small business owners. Track customer payments, calculate balances, and manage payment history through WhatsApp messages and an admin dashboard.

## Features

- 💬 WhatsApp Integration
  - Process informal payment messages
  - Support balance and history queries
  - Automatic customer creation
  - Multi-language support (coming soon)

- 💼 Admin Dashboard
  - Overview of total paid/received amounts
  - Customer management
  - Transaction history
  - Manual payment entry
  - Export functionality

- 📊 Business Analytics
  - Customer balances
  - Payment trends
  - Outstanding amounts

## Tech Stack

- Backend:
  - Node.js + Express.js
  - PostgreSQL with Prisma ORM
  - Natural language processing for message parsing
  - RESTful API design

- Frontend:
  - React with Vite
  - Tailwind CSS for styling
  - React Router for navigation
  - Axios for API calls

## Setup Instructions

### Prerequisites

- Node.js 16+
- PostgreSQL 12+
- WhatsApp Business API account (Twilio or 360dialog)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your:
   - Database URL
   - WhatsApp provider credentials
   - Other configuration

5. Initialize the database:
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file:
   ```bash
   echo "VITE_API_URL=http://localhost:3000" > .env
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## WhatsApp Integration

### Using Twilio

1. Create a Twilio account and get WhatsApp sandbox access
2. Set up your webhook URL: `https://your-domain.com/webhook`
3. Update the `.env` file with your Twilio credentials

### Using 360dialog

1. Create a 360dialog account and set up a WhatsApp Business API
2. Configure the webhook URL in your 360dialog dashboard
3. Add your API key to the `.env` file

## Deployment

### Backend (Railway)

1. Create a new project on Railway
2. Connect your GitHub repository
3. Add environment variables from `.env`
4. Deploy!

### Frontend (Vercel)

1. Import your repository to Vercel
2. Set the build command: `npm run build`
3. Set the output directory: `dist`
4. Add environment variables
5. Deploy!

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 