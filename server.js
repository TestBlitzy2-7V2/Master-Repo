const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Express application initialization
const app = express();

// Configuration constants
const HTTP_PORT = 3000;
const HTTPS_PORT = 3443;
const HOSTNAME = '127.0.0.1';
const CERT_PATH = path.join(__dirname, 'certificates', 'cert.pem');
const KEY_PATH = path.join(__dirname, 'certificates', 'key.pem');

// Rate limiting configuration - 100 requests per 15-minute window per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

// CORS configuration with security-focused defaults
const corsOptions = {
  origin: ['http://localhost:3000', 'https://localhost:3443'], // Allow only local origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: false, // No credentials support for development
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

// Input validation middleware chains
const validateInput = [
  // Example validation rules - can be extended for specific endpoints
  body('*').optional().trim().escape(), // Escape HTML entities for any body content
];

// Error handling middleware for validation
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Invalid input provided',
      details: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  next();
};

// Security middleware stack - Applied in proper order per Section 6.4.1.2
// 1. Helmet - Comprehensive HTTP security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disabled for development compatibility
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: false // No preload for development
  }
}));

// 2. CORS - Cross-origin resource sharing control
app.use(cors(corsOptions));

// 3. Rate limiting - DoS protection
app.use(limiter);

// 4. Body parsing - Enable JSON parsing for validation
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 5. Input validation middleware (applied to all routes)
app.use(validateInput);
app.use(handleValidationErrors);

// Health check endpoint for monitoring
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    security: {
      https: 'enabled',
      rateLimit: 'active',
      headers: 'protected',
      validation: 'active'
    }
  });
});

// Main route - Preserves original "Hello, World!" functionality
app.get('/', (req, res) => {
  res.status(200).send('Hello, World!\n');
});

// 404 handler for unknown routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found on this server.',
    path: req.originalUrl
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred. Please try again later.'
  });
});

// TLS certificate loading with error handling
function loadTLSCertificates() {
  try {
    const cert = fs.readFileSync(CERT_PATH, 'utf8');
    const key = fs.readFileSync(KEY_PATH, 'utf8');
    
    console.log('✓ TLS certificates loaded successfully');
    return { cert, key };
  } catch (error) {
    console.error('✗ Failed to load TLS certificates:', error.message);
    console.error('  Please ensure certificates exist in the certificates/ directory');
    console.error('  Generate certificates using:');
    console.error('    mkdir -p certificates');
    console.error('    openssl genrsa -out certificates/key.pem 2048');
    console.error('    openssl req -new -x509 -key certificates/key.pem -out certificates/cert.pem -days 365 -subj "/C=US/ST=Dev/L=Local/O=Development/CN=localhost"');
    return null;
  }
}

// HTTP server setup
const httpServer = http.createServer(app);

httpServer.listen(HTTP_PORT, HOSTNAME, () => {
  console.log(`✓ HTTP Server running at http://${HOSTNAME}:${HTTP_PORT}/`);
  console.log('  Security features active:');
  console.log('    • Rate limiting: 100 requests per 15-minute window');
  console.log('    • Security headers: helmet.js protection');
  console.log('    • Input validation: express-validator sanitization');
  console.log('    • CORS protection: configured origin restrictions');
});

// HTTPS server setup with certificate handling
const certificates = loadTLSCertificates();
if (certificates) {
  const httpsOptions = {
    cert: certificates.cert,
    key: certificates.key,
    // TLS configuration for security
    secureProtocol: 'TLSv1_2_method', // Minimum TLS 1.2
    ciphers: 'ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384',
    honorCipherOrder: true
  };
  
  const httpsServer = https.createServer(httpsOptions, app);
  
  httpsServer.listen(HTTPS_PORT, HOSTNAME, () => {
    console.log(`✓ HTTPS Server running at https://${HOSTNAME}:${HTTPS_PORT}/`);
    console.log('  TLS Configuration:');
    console.log('    • Protocol: TLS 1.2+');
    console.log('    • Certificate: Self-signed development certificate');
    console.log('    • Cipher suites: Modern secure ciphers only');
    console.log('    • Perfect Forward Secrecy: Enabled');
  });
  
  httpsServer.on('error', (error) => {
    console.error('✗ HTTPS Server error:', error.message);
    if (error.code === 'EADDRINUSE') {
      console.error(`  Port ${HTTPS_PORT} is already in use`);
    }
  });
} else {
  console.log('⚠ HTTPS Server not started due to certificate loading failure');
  console.log('  HTTP server is still available for development');
}

// HTTP server error handling
httpServer.on('error', (error) => {
  console.error('✗ HTTP Server error:', error.message);
  if (error.code === 'EADDRINUSE') {
    console.error(`  Port ${HTTP_PORT} is already in use`);
  }
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  httpServer.close(() => {
    console.log('HTTP server closed');
    if (certificates) {
      const httpsServer = https.createServer({ cert: certificates.cert, key: certificates.key }, app);
      httpsServer.close(() => {
        console.log('HTTPS server closed');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  });
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  httpServer.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

// Export app for testing purposes
module.exports = app;