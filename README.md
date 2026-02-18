# Secure React Auth Application

A modern full-stack application featuring a secure registration and login system with a premium dynamic React frontend and a Node.js API.

## Features
- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui.
- **Components**: Integrated `GradientButton` with high-performance CSS animations.
- **Backend**: Node.js, Express.js (Dedicated API).
- **Security**: Bcrypt password hashing and secure environment variables.
- **Database**: PostgreSQL (Aiven) with automatic table initialization.

## Prerequisites
- Node.js installed.
- Your Aiven PostgreSQL credentials in `.env`.

## Setup & Running

### 1. Root Directory (Backend)
Install backend dependencies and start the API:
```bash
npm install
node server.js
```
*API running at http://localhost:3000*

### 2. Frontend Directory
Open a new terminal, navigate to the `/frontend` folder, and start the development server:
```bash
cd frontend
npm install
npm run dev
```
*App running at http://localhost:5173*

## How it Works
1.  **Register**: Navigate to `http://localhost:5173/register`. Fill in your details. The `GradientButton` will handle the submission.
2.  **Login**: Once registered, go to `http://localhost:5173/login`. Use your User ID and Password.
3.  **Redirect**: Successful login will redirect you to the specified movie-flix landing page.

## Project Structure
- `server.js`: Express API and database connection.
- `frontend/`: React source code.
    - `src/components/ui/`: Reusable UI components including `GradientButton`.
    - `src/pages/`: Authentication pages (Login/Register).
    - `src/globals.css`: Global styles and animation logic.
