require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const NodeCache = require('node-cache');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize cache with TTL from environment or default to 1 hour
const cache = new NodeCache({
  stdTTL: parseInt(process.env.CACHE_TTL_SECONDS) || 3600,
  checkperiod: 120
});

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:3000'];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting middleware for API endpoints
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes default
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting middleware for general routes (more lenient)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // More lenient for static assets
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', apiLimiter);
app.use('/', generalLimiter);

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    cache_stats: cache.getStats()
  });
});

// Main API endpoint to generate chart descriptions using Gemini
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, chartType } = req.body;

    // Validation
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ 
        error: 'Invalid request', 
        message: 'Prompt is required and must be a string' 
      });
    }

    if (prompt.length > 5000) {
      return res.status(400).json({ 
        error: 'Invalid request', 
        message: 'Prompt is too long (max 5000 characters)' 
      });
    }

    // Check API key
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ 
        error: 'Server configuration error', 
        message: 'API key not configured' 
      });
    }

    // Create cache key using SHA256 hash to avoid collisions
    const promptHash = crypto.createHash('sha256').update(prompt).digest('hex');
    const cacheKey = `chart_${chartType || 'default'}_${promptHash}`;

    // Check cache first
    const cachedResponse = cache.get(cacheKey);
    if (cachedResponse) {
      console.log('Cache hit for:', cacheKey);
      return res.json({ 
        ...cachedResponse, 
        cached: true 
      });
    }

    // Prepare the prompt for Gemini
    const fullPrompt = chartType 
      ? `Generate a detailed description for a ${chartType} chart based on this request: ${prompt}. Include data points, labels, and styling suggestions.`
      : `Generate a detailed chart description based on this request: ${prompt}. Include data points, labels, chart type recommendation, and styling suggestions.`;

    // Call Gemini API
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    // Prepare response
    const responseData = {
      success: true,
      description: text,
      chartType: chartType || 'auto',
      timestamp: new Date().toISOString()
    };

    // Cache the response
    cache.set(cacheKey, responseData);

    res.json(responseData);

  } catch (error) {
    console.error('Error generating chart description:', error);
    
    // Handle specific error types
    if (error.message && error.message.includes('API key')) {
      return res.status(401).json({ 
        error: 'Authentication error', 
        message: 'Invalid API key' 
      });
    }

    res.status(500).json({ 
      error: 'Server error', 
      message: 'Failed to generate chart description',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Cache management endpoints (optional, for debugging)
app.get('/api/cache/stats', (req, res) => {
  res.json(cache.getStats());
});

app.delete('/api/cache/clear', (req, res) => {
  cache.flushAll();
  res.json({ message: 'Cache cleared successfully' });
});

// Catch-all route to serve index.html for SPA
// Note: This route is protected by the generalLimiter middleware applied at line 78
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Chartie backend server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 Rate limiting: ${process.env.RATE_LIMIT_MAX_REQUESTS || 100} requests per ${(parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000) / 60000} minutes`);
  console.log(`💾 Cache TTL: ${process.env.CACHE_TTL_SECONDS || 3600} seconds`);
});

module.exports = app;
