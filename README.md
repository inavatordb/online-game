# Online Party Game

This project contains a real-time online party game.

## Project Structure

- `/frontend`: Contains the React.js client application.
- `/backend`: Contains the Node.js/Express server for API endpoints and admin actions.

## Getting Started

### Prerequisites

- Node.js and npm
- A Firebase project

### Setup

1.  **Install dependencies for both frontend and backend.**
    ```bash
    cd frontend
    npm install
    cd ../backend
    npm install
    cd ..
    ```

2.  **Set up Firebase:**
    - Create a new project on the [Firebase Console](https://console.firebase.google.com/).
    - In your Firebase project, go to **Project Settings** > **General**.
    - Under "Your apps", click the web icon (`</>`) to add a new web app.
    - Copy the `firebaseConfig` object.

3.  **Configure Frontend:**
    - Navigate to the `frontend` directory.
    - Create a `.env` file in the `frontend` directory.
    - Add your Firebase configuration to the `.env` file like this. You need to paste your actual config object as a JSON string.

      ```
      REACT_APP_FIREBASE_CONFIG='{ "apiKey": "...", "authDomain": "...", "projectId": "...", ... }'
      REACT_APP_ID="your-app-id"
      ```
    - The `App.js` file is already set up to read these environment variables.

4.  **Configure Backend (Optional - for admin features):**
    - To use the Firebase Admin SDK in the backend, you'll need a service account key.
    - In your Firebase project settings, go to the "Service accounts" tab and generate a new private key.
    - Save the downloaded JSON file in the `backend` directory (e.g., as `serviceAccountKey.json`).
    - Uncomment the relevant lines in `backend/index.js` and update the path to your service account file.

### Running the Application

1.  **Start the Backend Server:**
    - Open a terminal and navigate to the `backend` directory.
    - Run `npm start`.
    - The server will start on `http://localhost:3001`.

2.  **Start the Frontend Development Server:**
    - Open a second terminal and navigate to the `frontend` directory.
    - Run `npm start`.
    - The React app will open in your browser at `http://localhost:3000`.

Enjoy your game! 