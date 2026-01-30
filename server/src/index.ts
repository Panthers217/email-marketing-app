import express, { Application } from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth';
import settingsRoutes from './routes/settings';
import recipientsRoutes from './routes/recipients';
import campaignsRoutes from './routes/campaigns';
import logsRoutes from './routes/logs';
import dashboardRoutes from './routes/dashboard';
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3001;

// Trust proxy (for Codespaces/production behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Auth routes (public)
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/settings', authMiddleware, settingsRoutes);
app.use('/api/recipients', authMiddleware, recipientsRoutes);
app.use('/api/campaigns', authMiddleware, campaignsRoutes);
app.use('/api/logs', authMiddleware, logsRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);

// Error handler (must be last)
app.use(errorHandler);

// Database connection
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/email-marketing';
    await mongoose.connect(mongoUri);
    console.log('✓ MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Start server
const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`✓ Server running on port ${PORT}`);
    console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  });
};

startServer();
