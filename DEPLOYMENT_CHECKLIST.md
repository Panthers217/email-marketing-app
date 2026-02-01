# Pre-Deployment Checklist

Use this checklist before deploying to production.

## ✅ Backend (Render) Checklist

### Code Preparation
- [ ] All code committed and pushed to GitHub
- [ ] `.env` file is NOT committed (check `.gitignore`)
- [ ] Firebase service account JSON is NOT committed
- [ ] All dependencies listed in `server/package.json`
- [ ] Build command works: `cd server && npm install && npm run build`
- [ ] Start command works: `cd server && npm start`

### Environment Variables Ready
- [ ] `APP_SECRET_KEY` - Generate with `npm run generate-keys`
- [ ] `WORKSPACE_PASSWORD` - Choose a strong password
- [ ] `RESEND_API_KEY` - Get from https://resend.com
- [ ] `RESEND_FROM_EMAIL` - Must be verified in Resend
- [ ] `MONGODB_URI` - Get from MongoDB Atlas
- [ ] `CLIENT_URL` - Will be your Netlify URL (update after frontend deployment)
- [ ] `NODE_ENV=production`
- [ ] `PORT=3001`

### Firebase Configuration (Required)
- [ ] Firebase project created
- [ ] Firebase Authentication enabled (Email/Password)
- [ ] Firebase user created for testing
- [ ] `FIREBASE_PROJECT_ID` - From Firebase Console
- [ ] `FIREBASE_CLIENT_EMAIL` - From service account JSON
- [ ] `FIREBASE_PRIVATE_KEY` - From service account JSON (keep quotes and `\n` escapes)

### Database Setup
- [ ] MongoDB Atlas cluster created
- [ ] Database user created with read/write permissions
- [ ] Network access allows connections from anywhere (0.0.0.0/0) or Render IPs whitelisted
- [ ] Connection string tested locally

### API Configuration
- [ ] Resend account created
- [ ] Sender email verified in Resend
- [ ] API key generated
- [ ] Test email sent successfully

## ✅ Frontend (Netlify) Checklist

### Code Preparation
- [ ] All code committed and pushed to GitHub
- [ ] `netlify.toml` exists in root directory
- [ ] Backend URL updated in `netlify.toml` (after backend deployment)
- [ ] Build command works: `cd client && npm install && npm run build`
- [ ] Build outputs to `client/dist`

### Configuration
- [ ] Base directory set to `client`
- [ ] Build command: `npm install && npm run build`
- [ ] Publish directory: `client/dist`
- [ ] API redirect configured in `netlify.toml`

### Firebase Environment Variables (Required)
- [ ] `VITE_FIREBASE_API_KEY` - From Firebase project settings
- [ ] `VITE_FIREBASE_AUTH_DOMAIN` - From Firebase project settings
- [ ] `VITE_FIREBASE_PROJECT_ID` - From Firebase project settings
- [ ] `VITE_FIREBASE_STORAGE_BUCKET` - From Firebase project settings
- [ ] `VITE_FIREBASE_MESSAGING_SENDER_ID` - From Firebase project settings
- [ ] `VITE_FIREBASE_APP_ID` - From Firebase project settings

## ✅ Post-Deployment Checklist

### Backend Verification
- [ ] Backend deployed successfully on Render
- [ ] Health check endpoint working: `https://your-backend.onrender.com/api/health`
- [ ] No build errors in Render logs
- [ ] Database connection successful (check logs)

### Frontend Verification
- [ ] Frontend deployed successfully on Netlify
- [ ] Site loads without errors
- [ ] No 404 errors in browser console
- [ ] API calls working (check Network tab)

### Integration Testing
- [ ] Firebase user created in Authentication console
- [ ] Login works with Firebase email + password + workspace password
- [ ] Redirects to dashboard after successful login
- [ ] Can access all pages (Dashboard, Recipients, Campaigns, Settings, Logs)
- [ ] Can create recipients
- [ ] Can create campaigns
- [ ] Can send test email campaign
- [ ] Email received successfully
- [ ] Logout works and redirects to login
- [ ] Cannot access protected pages when logged out

### CORS Configuration
- [ ] Backend `CLIENT_URL` matches Netlify URL exactly
- [ ] No CORS errors in browser console
- [ ] Authorization headers working properly
- [ ] Firebase ID tokens being sent correctly

### Firebase Authentication Check
- [ ] Firebase Authentication is enabled in Console
- [ ] Email/Password provider is enabled
- [ ] Test user can sign in via Firebase
- [ ] Firebase ID tokens are being verified on backend
- [ ] Custom claims for workspace access working

### Security Verification
- [ ] Strong `WORKSPACE_PASSWORD` set (not default)
- [ ] `APP_SECRET_KEY` is unique and secure
- [ ] No sensitive data in Git repository
- [ ] Firebase service account JSON not committed
- [ ] MongoDB not publicly accessible through UI
- [ ] Rate limiting working
- [ ] Firebase security rules configured (if using Firestore/Storage)
- [ ] Firebase API key restrictions set (optional but recommended)

### Performance Check
- [ ] Backend responds within reasonable time
- [ ] Frontend loads quickly
- [ ] No memory leaks (check Render metrics)
- [ ] Email sending works reliably

## 🔧 Troubleshooting

### Backend Issues

**"Application failed to respond"**
- Check Render logs for errors
- Verify all environment variables are set
- Check MongoDB connection string
- Ensure PORT=3001 is set
- Verify Firebase credentials are correct

**"CORS errors"**
- Verify CLIENT_URL matches Netlify URL exactly (no trailing slash)
- Redeploy backend after updating CLIENT_URL
- Check browser console for specific CORS error
- Ensure Authorization header is allowed

**"Firebase Admin not initialized"**
- Check FIREBASE_PROJECT_ID is set
- Verify FIREBASE_CLIENT_EMAIL is correct
- Ensure FIREBASE_PRIVATE_KEY has proper format (with quotes and `\n`)
- Check Render logs for Firebase initialization errors

**"Invalid or expired token"**
- Verify Firebase Authentication is enabled
- Check that Email/Password provider is enabled
- Ensure user exists in Firebase Authentication
- Verify backend is using correct Firebase project

**"Database connection failed"**
- Check MongoDB connection string format
- Verify database user credentials
- Whitelist IP addresses in MongoDB Atlas (0.0.0.0/0 for allow all)
- Check network access settings

### Frontend Issues

**"API calls failing"**
- Check `netlify.toml` has correct backend URL
- Verify backend is running and accessible
- Check browser Network tab for API call details
- Ensure no typos in API URLs
- Verify Firebase tokens are being sent in Authorization header

**"Build failed"**
- Check Netlify build logs
- Ensure all dependencies in `client/package.json`
- Verify build command is correct
- Check for TypeScript errors
- Ensure all Firebase environment variables are set

**"Page not found (404)"**
- Ensure redirect rules in `netlify.toml`
- Check publish directory is `client/dist`
- Verify build outputs to correct directory

### Email Issues

**"Emails not sending"**
- Verify Resend API key is correct
- Check sender email is verified in Resend
- Check Resend dashboard for send logs
- Review backend logs for email sending errors

**"Emails going to spam"**
- Verify sender domain SPF/DKIM records
- Use Resend's verified domain
- Check email content for spam triggers

## 📊 Monitoring

### Regular Checks
- [ ] Monitor Render logs for errors
- [ ] Check email delivery rates in Resend
- [ ] Review MongoDB Atlas performance metrics
- [ ] Monitor Netlify bandwidth usage
- [ ] Check Firebase Authentication usage and quotas
- [ ] Review Firebase logs for authentication errors

### Monthly Maintenance
- [ ] Review and rotate secrets (APP_SECRET_KEY)
- [ ] Update dependencies: `npm update`
- [ ] Check for security vulnerabilities: `npm audit`
- [ ] Review and clean up old send logs in database
- [ ] Review Firebase users and remove inactive accounts
- [ ] Check Firebase quotas and upgrade if needed

## 🚨 Emergency Procedures

### Backend Down
1. Check Render status page
2. Review recent deployments
3. Check environment variables
4. Roll back to previous deployment if needed

### Database Issues
1. Check MongoDB Atlas status
2. Verify connection string
3. Check IP whitelist
4. Review database metrics

### Firebase Issues
1. Check Firebase Console for service status
2. Verify Authentication is enabled
3. Check user exists and is enabled
4. Review Firebase logs for errors
5. Verify service account credentials

### Frontend Issues
1. Check Netlify status page
2. Review recent deployments
3. Clear Netlify cache and redeploy
4. Check build logs
5. Verify Firebase environment variables

## 📞 Support Contacts

- **Render Support**: https://render.com/support
- **Netlify Support**: https://www.netlify.com/support/
- **MongoDB Atlas Support**: https://www.mongodb.com/cloud/atlas/support
- **Resend Support**: https://resend.com/support
- **Firebase Support**: https://firebase.google.com/support

## ✨ Success Criteria

Your deployment is successful when:
- ✅ Users can log in with Firebase credentials + workspace password
- ✅ Authentication redirects to dashboard
- ✅ All pages load without errors
- ✅ Recipients can be created and managed
- ✅ Campaigns can be created and sent
- ✅ Emails are delivered successfully
- ✅ Firebase tokens are verified correctly
- ✅ No errors in logs (Render, Netlify, Firebase)
- ✅ Performance is acceptable
- ✅ HTTPS works on both frontend and backend
