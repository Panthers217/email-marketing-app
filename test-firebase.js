// Quick Firebase Admin test script
require('dotenv').config({ path: './server/.env' });
const admin = require('firebase-admin');

console.log('🔍 Testing Firebase Admin SDK...\n');

// Check environment variables
console.log('Environment Variables:');
console.log('✓ FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? 'Set' : '❌ Missing');
console.log('✓ FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL ? 'Set' : '❌ Missing');
console.log('✓ FIREBASE_PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? 'Set (length: ' + process.env.FIREBASE_PRIVATE_KEY.length + ')' : '❌ Missing');
console.log('');

try {
  // Initialize Firebase Admin
  const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
  
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
  });

  console.log('✅ Firebase Admin SDK initialized successfully!');
  console.log('');
  
  // Test creating a custom token (this verifies the credentials work)
  console.log('🧪 Testing token creation...');
  const testUid = 'test-user-' + Date.now();
  
  admin.auth().createCustomToken(testUid)
    .then((customToken) => {
      console.log('✅ Successfully created a test custom token!');
      console.log('   Token length:', customToken.length);
      console.log('');
      console.log('🎉 Firebase is working correctly!');
      console.log('');
      console.log('Your Firebase Admin SDK is properly configured and can:');
      console.log('  ✓ Authenticate with Firebase');
      console.log('  ✓ Create tokens');
      console.log('  ✓ Verify ID tokens (when users log in)');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error creating custom token:', error.message);
      console.error('');
      console.error('This might indicate an issue with your credentials.');
      process.exit(1);
    });

} catch (error) {
  console.error('❌ Error initializing Firebase Admin:', error.message);
  console.error('');
  console.error('Common issues:');
  console.error('  - Private key format (check for proper \\n escape sequences)');
  console.error('  - Incorrect project_id or client_email');
  console.error('  - Missing environment variables');
  process.exit(1);
}
