// Create a test user in Firebase Authentication
require('dotenv').config({ path: './server/.env' });
const admin = require('firebase-admin');

const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: privateKey,
  }),
});

const email = process.argv[2] || 'test@example.com';
const password = process.argv[3] || 'TestPassword123!';

console.log('Creating test user...');
console.log('Email:', email);
console.log('Password:', password);
console.log('');

admin.auth().createUser({
  email: email,
  password: password,
  emailVerified: true,
  disabled: false,
})
  .then((userRecord) => {
    console.log('✅ Successfully created user!');
    console.log('');
    console.log('User Details:');
    console.log('  UID:', userRecord.uid);
    console.log('  Email:', userRecord.email);
    console.log('  Email Verified:', userRecord.emailVerified);
    console.log('');
    console.log('🎉 You can now use these credentials to log in:');
    console.log('  Email:', email);
    console.log('  Password:', password);
    console.log('  Workspace Password:', process.env.WORKSPACE_PASSWORD);
    process.exit(0);
  })
  .catch((error) => {
    if (error.code === 'auth/email-already-exists') {
      console.log('ℹ️  User already exists with this email');
      console.log('');
      console.log('You can log in with:');
      console.log('  Email:', email);
      console.log('  Password:', password, '(if unchanged)');
      console.log('  Workspace Password:', process.env.WORKSPACE_PASSWORD);
      process.exit(0);
    }
    console.error('❌ Error creating user:', error);
    process.exit(1);
  });
