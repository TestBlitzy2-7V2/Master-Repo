# hao-backprop-test

A security-hardened Express.js application providing dual-protocol HTTP/HTTPS server functionality with comprehensive security middleware integration for backpropagation algorithm testing and development workflows.

## Table of Contents

- [Overview](#overview)
- [Security Architecture](#security-architecture)
- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Certificate Management](#certificate-management)
- [Configuration](#configuration)
- [Security Features](#security-features)
- [Testing & Verification](#testing--verification)
- [Troubleshooting](#troubleshooting)
- [Development Guidelines](#development-guidelines)
- [API Documentation](#api-documentation)

## Overview

This project implements a production-ready, security-hardened web server built on Express.js framework with comprehensive security controls including:

- **Dual-Protocol Support**: HTTP (port 3000) and HTTPS (port 3443) endpoints
- **Transport Layer Security**: TLS 1.2+ encryption with self-signed certificates for development
- **HTTP Security Headers**: Comprehensive protection via helmet.js (15 security headers)
- **Input Validation**: Request sanitization and validation via express-validator
- **Rate Limiting**: DoS protection with configurable IP-based request throttling
- **CORS Protection**: Cross-origin resource sharing controls with dynamic policy enforcement

### System Architecture

The application follows a defense-in-depth security model with layered middleware protection:

```
Client Request → Network Layer → Express.js Router → Security Middleware Stack → Response Handler
                      ↓                                      ↓
                 (localhost only)              [helmet → cors → rate-limit → validator]
```

## Security Architecture

### Security Middleware Processing Order

All incoming requests execute through the following mandatory security middleware layers:

1. **helmet** → Applies comprehensive HTTP security headers (CSP, X-Frame-Options, etc.)
2. **cors** → Validates cross-origin resource sharing policies and handles preflight requests
3. **express-rate-limit** → Enforces IP-based request quotas (100 requests per 15-minute window)
4. **express-validator** → Validates and sanitizes input parameters for data integrity
5. **route handlers** → Processes validated requests and generates secure responses

### Protocol Security Matrix

| Protocol | Port | Certificate Type | Security Features | Use Case |
|----------|------|------------------|-------------------|----------|
| HTTP | 3000 | Not applicable | Security headers, validation, rate limiting, CORS | Development and testing |
| HTTPS | 3443 | Self-signed (TLS 1.2+) | All HTTP features + encrypted communication | Secure development workflows |

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Generate development certificates
mkdir -p certificates/
openssl genrsa -out certificates/key.pem 2048
openssl req -new -x509 -key certificates/key.pem -out certificates/cert.pem -days 365 \
  -subj "/C=US/ST=Dev/L=Local/O=Development/CN=localhost"

# 3. Set secure file permissions
chmod 600 certificates/key.pem certificates/cert.pem

# 4. Start the server
node server.js

# 5. Test endpoints
curl http://localhost:3000     # HTTP endpoint
curl -k https://localhost:3443 # HTTPS endpoint (self-signed)
```

## Prerequisites

### System Requirements

- **Node.js**: Version 14+ (verify: `node --version`)
- **NPM**: Version 6+ (verify: `npm --version`)
- **OpenSSL**: For certificate generation (verify: `openssl version`)
- **Available Ports**: 3000 (HTTP) and 3443 (HTTPS) must be free

### Runtime Dependencies

- **express**: ^4.x (core web framework)
- **helmet**: ^8.1.0 (HTTP security headers)
- **express-validator**: ^7.2.1 (input validation and sanitization)
- **express-rate-limit**: ^7.x (request rate limiting)
- **cors**: ^2.x (cross-origin resource sharing)

## Installation & Setup

### Step 1: Dependency Installation

```bash
# Install all security dependencies
npm install

# Verify installation
npm list --depth=0
```

### Step 2: Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit configuration (optional)
nano .env
```

### Step 3: Certificate Generation

```bash
# Create certificates directory
mkdir -p certificates/

# Generate 2048-bit RSA private key
openssl genrsa -out certificates/key.pem 2048

# Generate self-signed certificate (365 days validity)
openssl req -new -x509 -key certificates/key.pem -out certificates/cert.pem -days 365 \
  -subj "/C=US/ST=Dev/L=Local/O=Development/CN=localhost"

# Set secure file permissions
chmod 600 certificates/key.pem certificates/cert.pem

# Verify certificate generation
ls -la certificates/
openssl x509 -in certificates/cert.pem -text -noout | grep "Not After"
```

### Step 4: Server Startup

```bash
# Start the server (both HTTP and HTTPS)
node server.js

# Expected output:
# HTTP server running at http://127.0.0.1:3000/
# HTTPS server running at https://127.0.0.1:3443/
```

## Certificate Management

### Self-Signed Certificate Generation

The system uses self-signed certificates for development. These certificates provide encryption but will trigger browser security warnings.

#### Initial Certificate Setup

```bash
# Create certificates directory
mkdir -p certificates/

# Generate private key (2048-bit RSA)
openssl genrsa -out certificates/key.pem 2048

# Generate self-signed certificate (1 year validity)
openssl req -new -x509 -key certificates/key.pem -out certificates/cert.pem -days 365 \
  -subj "/C=US/ST=Dev/L=Local/O=Development/CN=localhost"

# Verify key and certificate match
openssl rsa -in certificates/key.pem -check
openssl x509 -in certificates/cert.pem -text -noout
```

#### Certificate Validation Commands

```bash
# Check certificate expiration
openssl x509 -in certificates/cert.pem -text -noout | grep "Not After"

# Verify certificate details
openssl x509 -in certificates/cert.pem -text -noout | grep -A 2 "Subject:"

# Test certificate-key pair matching
diff <(openssl x509 -in certificates/cert.pem -pubkey -noout) \
     <(openssl rsa -in certificates/key.pem -pubout 2>/dev/null)
```

#### Certificate Renewal

```bash
# Check days until expiration
openssl x509 -in certificates/cert.pem -checkend 86400 && echo "Certificate expires within 24 hours"

# Regenerate certificate (keep existing key)
openssl req -new -x509 -key certificates/key.pem -out certificates/cert.pem -days 365 \
  -subj "/C=US/ST=Dev/L=Local/O=Development/CN=localhost"

# Restart server to load new certificate
node server.js
```

## Configuration

### Environment Variables (.env.example)

```bash
# Security Configuration
RATE_LIMIT_REQUESTS=100           # Requests per window
RATE_LIMIT_WINDOW_MS=900000       # 15 minutes in milliseconds
CORS_ORIGIN=*                     # Allowed origins (use specific domains in production)
TLS_MIN_VERSION=TLSv1.2          # Minimum TLS version

# Certificate Paths
TLS_KEY_PATH=certificates/key.pem
TLS_CERT_PATH=certificates/cert.pem

# Server Configuration
HTTP_PORT=3000
HTTPS_PORT=3443
SERVER_HOST=127.0.0.1

# Security Headers (helmet configuration)
CSP_DEFAULT_SRC="'self'"
CSP_SCRIPT_SRC="'self'"
CSP_STYLE_SRC="'self' 'unsafe-inline'"
```

### Security Middleware Configuration Examples

#### helmet.js Configuration

```javascript
// Comprehensive security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

#### express-validator Configuration

```javascript
// Input validation middleware
const { body, validationResult } = require('express-validator');

const validateInput = [
  body('input').isLength({ min: 1, max: 1000 }).trim().escape(),
  body('type').isIn(['string', 'number', 'object']),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];
```

#### express-rate-limit Configuration

```javascript
// Rate limiting middleware
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
});
```

#### CORS Configuration

```javascript
// CORS middleware
const cors = require('cors');

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = ['http://localhost:3000', 'https://localhost:3443'];
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));
```

## Security Features

### HTTP Security Headers (helmet.js)

The application automatically applies 15 comprehensive security headers to all responses:

| Header | Purpose | Value |
|--------|---------|--------|
| Content-Security-Policy | Prevents XSS attacks | `default-src 'self'` |
| Cross-Origin-Opener-Policy | Isolates browsing contexts | `same-origin` |
| Cross-Origin-Resource-Policy | Controls resource loading | `same-origin` |
| X-Content-Type-Options | Prevents MIME sniffing | `nosniff` |
| X-DNS-Prefetch-Control | Controls DNS prefetching | `off` |
| X-Frame-Options | Prevents clickjacking | `SAMEORIGIN` |
| X-Permitted-Cross-Domain-Policies | Controls cross-domain policies | `none` |
| Referrer-Policy | Controls referrer information | `no-referrer` |
| Strict-Transport-Security | Enforces HTTPS | `max-age=31536000` |

### Input Validation & Sanitization

All user inputs are processed through express-validator middleware:

- **HTML Escape**: Prevents XSS attacks by escaping HTML entities
- **Length Validation**: Enforces minimum and maximum input lengths
- **Type Validation**: Ensures inputs match expected data types
- **Sanitization**: Removes potentially dangerous characters

### Rate Limiting Protection

IP-based request throttling protects against abuse:

- **Limit**: 100 requests per 15-minute window per IP address
- **Response**: HTTP 429 (Too Many Requests) when exceeded
- **Headers**: Rate limit information included in all responses
- **Reset**: Automatic quota reset after time window expires

### CORS Security

Cross-origin request controls:

- **Origin Validation**: Configurable allowed origins list
- **Method Control**: Restricts allowed HTTP methods
- **Credential Handling**: Configurable credential support
- **Preflight Support**: Handles complex CORS scenarios

## Testing & Verification

### Security Header Verification

```bash
# Verify all security headers are present
curl -I http://localhost:3000

# Expected headers include:
# Content-Security-Policy: default-src 'self'
# X-Frame-Options: SAMEORIGIN
# X-Content-Type-Options: nosniff
# Strict-Transport-Security: max-age=31536000 (HTTPS only)
```

### HTTPS/TLS Testing

```bash
# Test HTTPS connectivity
curl -k -I https://localhost:3443

# Test TLS version and cipher suites
openssl s_client -connect localhost:3443 -tls1_2

# Verify certificate details
echo | openssl s_client -servername localhost -connect localhost:3443 2>/dev/null | \
  openssl x509 -text -noout | grep -A 2 "Subject:"
```

### Rate Limiting Testing

```bash
# Test rate limiting with rapid requests
for i in {1..105}; do
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000
done

# Expected behavior:
# Requests 1-100: HTTP 200
# Requests 101+: HTTP 429 (Too Many Requests)
```

### Input Validation Testing

```bash
# Test valid input (if POST endpoints exist)
curl -X POST http://localhost:3000/api/test \
  -H "Content-Type: application/json" \
  -d '{"input": "valid test data", "type": "string"}'

# Test invalid input
curl -X POST http://localhost:3000/api/test \
  -H "Content-Type: application/json" \
  -d '{"input": "<script>alert(\"xss\")</script>", "type": "invalid"}'

# Expected: HTTP 400 with validation errors
```

### CORS Testing

```bash
# Test cross-origin request
curl -H "Origin: http://example.com" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: X-Requested-With" \
  -X OPTIONS http://localhost:3000

# Check for CORS headers in response
```

### Complete Security Verification Script

```bash
#!/bin/bash
# security-check.sh - Comprehensive security verification

echo "=== Security Verification Script ==="

# 1. Check server accessibility
echo "1. Testing HTTP endpoint..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
echo "HTTP Status: $HTTP_STATUS"

echo "2. Testing HTTPS endpoint..."
HTTPS_STATUS=$(curl -k -s -o /dev/null -w "%{http_code}" https://localhost:3443)
echo "HTTPS Status: $HTTPS_STATUS"

# 2. Verify security headers
echo "3. Checking security headers..."
curl -s -I http://localhost:3000 | grep -E "(Content-Security-Policy|X-Frame-Options|X-Content-Type-Options)"

# 3. Test rate limiting
echo "4. Testing rate limiting..."
RATE_LIMIT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
echo "Rate limit test status: $RATE_LIMIT_STATUS"

# 4. Check certificate expiration
echo "5. Checking certificate expiration..."
openssl x509 -in certificates/cert.pem -text -noout | grep "Not After"

# 5. Verify TLS configuration
echo "6. Testing TLS configuration..."
echo | openssl s_client -connect localhost:3443 -brief 2>/dev/null

echo "=== Security verification complete ==="
```

## Troubleshooting

### Common Security Issues

#### Certificate Problems

**Issue**: HTTPS server fails to start with certificate errors

```bash
# Diagnosis
node server.js
# Error: ENOENT: no such file or directory, open 'certificates/cert.pem'

# Solution
mkdir -p certificates/
openssl genrsa -out certificates/key.pem 2048
openssl req -new -x509 -key certificates/key.pem -out certificates/cert.pem -days 365 \
  -subj "/C=US/ST=Dev/L=Local/O=Development/CN=localhost"
chmod 600 certificates/*.pem
```

**Issue**: Browser shows "Your connection is not private"

```bash
# Diagnosis: Expected behavior with self-signed certificates
# Solution: Click "Advanced" → "Proceed to localhost (unsafe)"
# Or use curl with -k flag: curl -k https://localhost:3443
```

**Issue**: Certificate expired

```bash
# Diagnosis
openssl x509 -in certificates/cert.pem -checkend 0

# Solution: Regenerate certificate
openssl req -new -x509 -key certificates/key.pem -out certificates/cert.pem -days 365 \
  -subj "/C=US/ST=Dev/L=Local/O=Development/CN=localhost"
```

#### Rate Limiting Issues

**Issue**: Getting HTTP 429 errors unexpectedly

```bash
# Diagnosis: Rate limit exceeded
curl -v http://localhost:3000 | grep -i ratelimit

# Solution: Wait for window reset or increase limits in configuration
# Temporary: Restart server to reset counters
```

**Issue**: Rate limiting not working

```bash
# Diagnosis: Check middleware configuration
# Verify express-rate-limit is properly imported and configured

# Test with rapid requests
for i in {1..5}; do curl -s http://localhost:3000; done
```

#### Security Header Problems

**Issue**: Security headers missing from responses

```bash
# Diagnosis
curl -I http://localhost:3000 | grep -E "(helmet|security)"

# Solution: Verify helmet middleware is imported and applied
# Check middleware order in server.js
```

**Issue**: CORS blocking legitimate requests

```bash
# Diagnosis
curl -H "Origin: http://localhost:3000" -v http://localhost:3000

# Solution: Update CORS configuration in server.js
# Add allowed origins to corsOptions
```

#### TLS/SSL Connection Issues

**Issue**: TLS handshake failures

```bash
# Diagnosis
openssl s_client -connect localhost:3443 -debug

# Common solutions:
# 1. Verify certificate and key match
# 2. Check file permissions (should be 600)
# 3. Ensure TLS 1.2+ support
```

**Issue**: Port binding failures

```bash
# Diagnosis
lsof -i :3000  # Check if port is in use
lsof -i :3443

# Solution: Kill existing processes or use different ports
kill -9 <PID>
```

### Dependency Issues

**Issue**: NPM package installation failures

```bash
# Diagnosis
npm install --verbose

# Common solutions:
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

**Issue**: Version compatibility problems

```bash
# Diagnosis
npm audit
npm outdated

# Solution: Update to compatible versions
npm update
npm audit fix
```

### Performance Issues

**Issue**: Slow response times with security middleware

```bash
# Diagnosis: Check middleware processing time
# Add timing logs in server.js

# Optimization: Review middleware order
# Ensure rate limiting is not causing unnecessary delays
```

### Debug Mode

Enable detailed logging for troubleshooting:

```bash
# Set debug environment variables
DEBUG=express:* node server.js

# Enable helmet debug
DEBUG=helmet node server.js

# Enable all debug output
DEBUG=* node server.js
```

## Development Guidelines

### Security Best Practices

1. **Certificate Management**
   - Rotate certificates annually
   - Never commit private keys to version control
   - Use secure file permissions (600) for certificate files

2. **Middleware Configuration**
   - Maintain security middleware order: helmet → cors → rate-limit → validator
   - Test security controls after any configuration changes
   - Monitor for security header presence in all responses

3. **Rate Limiting**
   - Adjust thresholds based on expected traffic patterns
   - Monitor for abuse patterns and adjust accordingly
   - Consider different limits for different endpoints

4. **Input Validation**
   - Validate all user inputs before processing
   - Use sanitization to prevent XSS attacks
   - Implement appropriate length and type restrictions

### Code Quality Standards

- Follow Express.js middleware best practices
- Implement comprehensive error handling
- Use consistent code formatting and naming conventions
- Document all security-related configuration changes

### Testing Requirements

- Verify all security headers on every response
- Test rate limiting thresholds regularly
- Validate HTTPS/TLS configuration changes
- Perform security testing after dependency updates

## API Documentation

### HTTP Endpoints

#### GET /

Returns a simple "Hello, World!" message with comprehensive security headers.

**Request:**
```bash
curl http://localhost:3000/
```

**Response:**
```
HTTP/1.1 200 OK
Content-Security-Policy: default-src 'self'
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
X-Content-Type-Options: nosniff
X-DNS-Prefetch-Control: off
X-Frame-Options: SAMEORIGIN
X-Permitted-Cross-Domain-Policies: none
Referrer-Policy: no-referrer
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1640995200
Content-Type: text/plain; charset=utf-8
Content-Length: 14

Hello, World!
```

### HTTPS Endpoints

#### GET https://localhost:3443/

Same functionality as HTTP endpoint but with TLS encryption and additional security headers.

**Request:**
```bash
curl -k https://localhost:3443/
```

**Additional Headers:**
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### Error Responses

#### Rate Limit Exceeded (HTTP 429)

When rate limit is exceeded:

```json
{
  "error": "Too many requests from this IP, please try again later.",
  "retryAfter": "900"
}
```

#### Validation Error (HTTP 400)

When input validation fails:

```json
{
  "errors": [
    {
      "type": "field",
      "value": "<script>alert('xss')</script>",
      "msg": "Invalid value",
      "path": "input",
      "location": "body"
    }
  ]
}
```

---

**Project**: hao-backprop-test  
**Version**: 1.0.0  
**License**: MIT  
**Security Framework**: Express.js with comprehensive middleware stack  
**TLS Support**: Self-signed certificates for development environment
