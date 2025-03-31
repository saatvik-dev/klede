// Serverless function entry point for Vercel
import express, { Request, Response, NextFunction } from 'express';
import { registerRoutes } from '../server/routes';
import { serveStatic } from '../server/vite';
import session from 'express-session';
import MemoryStore from 'memorystore';

// Set VERCEL environment flag
process.env.VERCEL = 'true';
// Ensure NODE_ENV is set to production
process.env.NODE_ENV = 'production';

// Create session store
const SessionStore = MemoryStore(session);

// Simple express app for serverless
const app = express();

// Add CORS headers for Vercel deployment
app.use((req, res, next) => {
  // Allow requests from Netlify frontend domain
  // In production, replace * with your Netlify domain (e.g. https://your-app.netlify.app)
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5000',
    'https://euphonious-cannoli-23a920.netlify.app/' // Replace with your actual Netlify domain
  ];
  
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Configure session
app.use(
  session({
    secret: process.env.SESSION_SECRET || "klede-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true, // Always use secure cookies in production
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
    store: new SessionStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    }),
  })
);

// Enable JSON parsing
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Initialize routes (don't use the returned server since we're in serverless)
registerRoutes(app);

// Serve static files for non-API routes
serveStatic(app);

// Express error handling
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

// Vercel serverless handler
export default app;
