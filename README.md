
# Positive Insights App

An application for tracking daily activities and gaining positive insights, now powered by Firebase.

## Setup

This project uses Firebase for its backend. To run and develop this application locally, you need to configure Firebase.

### Environment Variables

The application expects Firebase configuration to be available as environment variables. Create a `.env` file in the root of your project (this file is gitignored) or set these variables in your deployment environment.

**Required variables:**

*   `FIREBASE_API_KEY`: Your Firebase project's API Key.
*   `FIREBASE_AUTH_DOMAIN`: Your Firebase project's Auth Domain (e.g., `your-project-id.firebaseapp.com`).
*   `FIREBASE_PROJECT_ID`: Your Firebase project's ID.

**Optional but recommended variables:**

*   `FIREBASE_STORAGE_BUCKET`: Your Firebase project's Storage Bucket (e.g., `your-project-id.appspot.com`).
*   `FIREBASE_MESSAGING_SENDER_ID`: Your Firebase project's Messaging Sender ID.
*   `FIREBASE_APP_ID`: Your Firebase project's App ID.
*   `FIREBASE_MEASUREMENT_ID`: (Optional) Your Firebase project's Measurement ID for Google Analytics.

**Example `.env` file:**
```
FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXX
FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
FIREBASE_MESSAGING_SENDER_ID=1234567890
FIREBASE_APP_ID=1:1234567890:web:abcdef1234567890
FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Firebase Project Setup

1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Create a new Firebase project or use an existing one.
3.  In your project, go to Project settings (click the gear icon).
4.  Under the "General" tab, find your Firebase SDK snippet config values (API Key, Auth Domain, etc.).
5.  In your Firebase project, enable Firestore Database:
    *   Go to "Build" -> "Firestore Database".
    *   Click "Create database".
    *   Start in **test mode** for initial development (allows open reads/writes). Remember to set up proper security rules before going to production.
    *   Choose a location for your Firestore data.
6.  Update `.firebaserc` with your actual Firebase Project ID:
    ```json
    {
      "projects": {
        "default": "your-actual-firebase-project-id"
      }
    }
    ```

## Development

This project uses ES modules and CDNs for dependencies, so no build step is strictly necessary for development. Simply open `index.html` in your browser (preferably served by a local web server that can handle `process.env` or by manually replacing them in `firebaseClient.ts` for local testing if not using a dev server that injects them).

For CI/CD with Firebase Hosting:
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize Firebase in your project (if not done): `firebase init hosting` (select your project)
4. Deploy: `firebase deploy --only hosting`

Ensure your CI environment has the necessary Firebase environment variables set for the `firebaseClient.ts` to pick up.
