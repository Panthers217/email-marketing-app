import admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

let firebaseInitialized = false;

export const initializeFirebase = () => {
  if (firebaseInitialized) {
    return admin;
  }

  try {
    // Option 1: Use service account file path (local development)
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    
    if (serviceAccountPath && fs.existsSync(path.resolve(serviceAccountPath))) {
      const serviceAccount = JSON.parse(
        fs.readFileSync(path.resolve(serviceAccountPath), 'utf8')
      );
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      
      console.log('✓ Firebase Admin initialized with service account file');
      firebaseInitialized = true;
      return admin;
    }

    // Option 2: Use environment variables (production/cloud deployment)
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (projectId && clientEmail && privateKey) {
      // Replace escaped newlines with actual newlines in private key
      const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: formattedPrivateKey,
        }),
      });

      console.log('✓ Firebase Admin initialized with environment variables');
      firebaseInitialized = true;
      return admin;
    }

    console.warn('⚠ Firebase Admin not initialized - no credentials provided');
    return null;
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    return null;
  }
};

export const getFirebaseAdmin = () => {
  if (!firebaseInitialized) {
    return initializeFirebase();
  }
  return admin;
};

export default { initializeFirebase, getFirebaseAdmin };
