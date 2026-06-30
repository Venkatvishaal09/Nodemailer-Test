# Nodemailer Bulk Email Sender

A full-stack web application designed for sending emails and managing email campaigns securely. It features a premium, responsive React frontend and a powerful Express/Node.js backend, protected by JWT authentication and backed by a PostgreSQL database.

## Features

- **Full-Stack Architecture**: React 19 + Vite on the frontend, Express 5 on the backend.
- **Secure Authentication**: User sign-up and sign-in powered by PostgreSQL and bcrypt password hashing.
- **JWT Sessions**: API routes are protected using JSON Web Tokens (JWT).
- **OAuth2 Email Delivery**: Uses the Nodemailer library integrated with Gmail's OAuth2 API, which is far more secure than using App Passwords.
- **File Attachments**: Supports file uploads (up to 5MB) using `multer`.
- **Bulk Sending Interface**: Clean UI for composing emails and managing a list of contacts.
- **Auto-Reply**: Automatically sends a confirmation email back to the sender.

## Folder Structure

```
Nodemailer/
├── .env                 ← Environment variables (DB URL, OAuth keys, etc.)
├── package.json         ← Root dependencies and concurrently scripts
├── server/              ← Express Backend
│   ├── index.js         ← Express app, email transporter, and API routes
│   ├── db.js            ← PostgreSQL connection pool and initialization
│   ├── middleware/      ← JWT authentication middleware
│   └── routes/          ← Express routers (auth.js)
└── client/              ← React Frontend (Vite)
    ├── package.json     
    ├── vite.config.js   ← Vite config (includes API proxy)
    └── src/
        ├── App.jsx      ← Main application router (Login vs Dashboard)
        ├── main.jsx     
        └── components/  ← UI Components (Sidebar, Topbar, Toast, etc.)
```

## Setup & Installation

1. **Install root and client dependencies:**
   ```bash
   npm install
   npm install --prefix client
   ```

2. **Database Setup (PostgreSQL):**
   This project uses a PostgreSQL database (e.g., Supabase) to store user accounts. 
   You must provide a valid Postgres connection string. The `users` table will be automatically created on startup.

3. **OAuth2 Email Setup (Gmail):**
   Follow these steps to obtain your Google OAuth credentials:
   1. Create a Google Cloud project and enable the **Gmail API**.
   2. Configure the OAuth consent screen.
   3. Create an **OAuth client ID** (Web application) to get your `CLIENT_ID` and `CLIENT_SECRET`.
   4. Use the [OAuth2 Playground](https://developers.google.com/oauthplayground) (Scope: `https://mail.google.com/`) to generate a `REFRESH_TOKEN`.

4. **Environment Variables:**
   Create a `.env` file in the root directory and fill in your credentials:
   ```env
   EMAIL_USER=your-email@gmail.com
   CLIENT_ID=your-google-client-id
   CLIENT_SECRET=your-google-client-secret
   REFRESH_TOKEN=your-google-refresh-token
   RECEIVER=receiver-email@gmail.com
   PORT=3005
   DATABASE_URL=postgresql://user:password@host:port/dbname
   JWT_SECRET=your_super_secret_jwt_key
   ```

## Running the Application

To start both the backend Express server (port 3005) and the Vite React development server (port 5173) simultaneously:

```bash
npm run dev
```

The application will be accessible in your browser at `http://localhost:5173`. Any API requests to `/api` or `/send` are automatically proxied to the backend server.

## Production Build

To build the React frontend for production:
```bash
npm run build
```
The built files will be located in `client/dist`. The Express backend is configured to automatically serve these static files in a production environment via a catch-all route.
