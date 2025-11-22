# UniVote Project Verification & Setup

I have checked the entire project, verified the backend and frontend, and ensured they are configured to work together.

## Status Check

### Backend
- **Status**: ✅ Verified
- **Dependencies**: Installed successfully.
- **Server**: Starts correctly on port 4000.
- **Database**: File-based (`users.json`, `data.json`).
- **CORS**: Configured to allow `http://localhost:3000`.

### Frontend
- **Status**: ✅ Verified
- **Dependencies**: Installed successfully.
- **Build**: `npm run build` completed without errors.
- **Configuration**: Connects to `http://localhost:4000` by default (or via `REACT_APP_AUTH_API_URL`).

## Changes Made

I added a **Seed Script** to the backend to populate the database with initial election data (Positions and Candidates). This ensures the app isn't empty when you run it.

- **New Script**: `backend/scripts/seed_db.js`
- **New Command**: `npm run seed` (in `backend` directory)

## How to Run

1.  **Start the Backend**:
    Open a terminal in `UniVote_V1/backend` and run:
    ```bash
    npm start
    ```
    The server will start on `http://localhost:4000`.

2.  **Start the Frontend**:
    Open a new terminal in `UniVote_V1/frontend` and run:
    ```bash
    npm start
    ```
    The application will open at `http://localhost:3000`.

## Credentials

You can use the following default credentials to log in:

- **Admin**: `admin` / `password`
- **Voter**: `voter1` / `password`

## Troubleshooting

- If the frontend cannot connect to the backend, ensure the backend is running on port 4000.
- If you see an empty election, run `npm run seed` in the `backend` folder to reset the data.
