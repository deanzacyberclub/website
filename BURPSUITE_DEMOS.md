# Burp Suite Demo Setup

This directory contains 4 intentionally vulnerable demos for demonstrating Burp Suite features to your cybersecurity club.

## 🚀 Deployment

The demos are **deployed and fully functional** at your production URL. All API endpoints are handled by Netlify Functions, so no local server setup is required for demos!

## 🧪 Local Development (Optional)

If you want to test locally before deploying:

### Option 1: Using Netlify Dev (Recommended for local testing)
```bash
npm install -g netlify-cli  # If not already installed
netlify dev
```

This simulates the production environment locally with Netlify Functions.

### Option 2: Using the local API server
```bash
npm run dev:full
```

This starts:
- Frontend (Vite dev server) on `http://localhost:5173`
- Local API server on `http://localhost:3001`

Note: The local API server (`api-server.js`) is only for local development. In production, Netlify Functions handle all API requests automatically.

## Burp Suite Configuration

1. **Set up Burp Proxy**: Configure your browser to use Burp Suite as a proxy (usually `localhost:8080`)

2. **Important for Production URL**:
   - Go to Proxy → Options → Proxy Listeners
   - Make sure "Support invisible proxying" is enabled
   - Add your production domain to Burp's target scope

3. **For Local Development**:
   - Ensure localhost requests are intercepted
   - Go to Proxy → Options
   - Under "Intercept Client Requests", configure for localhost

## How Each Demo Works

### Demo 1: Proxy Intercept (/burpsuite/demo1)
- **What it demonstrates**: Request interception and modification
- **How it works**:
  - Enter any username and password
  - Burp Suite will intercept the POST request to `/api/burpsuite/demo1/login`
  - Modify the `password` field to `12345678` in Burp Suite
  - Forward the request
  - **The server validates the MODIFIED password and grants access!**

- **Key point**: This demonstrates real request tampering - the server sees what Burp modified, not the original input

### Demo 2: IDOR Vulnerability (/burpsuite/demo2)
- **What it demonstrates**: Insecure Direct Object Reference
- **How it works**:
  - Click "Get My Performance Review" (loads document 1001)
  - Intercept the request in Burp
  - Send to Repeater
  - Change `id=1001` to `id=1002`, `1003`, or `1004`
  - The server returns unauthorized documents!

### Demo 3: Username Enumeration (/burpsuite/demo3)
- **What it demonstrates**: Automated attacks with Intruder
- **How it works**:
  - Try logging in with different usernames
  - Notice different error messages ("User not found" vs "Invalid password")
  - Use Burp Intruder to automate username enumeration
  - Valid usernames: jsmith, admin, ceo, hradmin
  - Working credentials: admin / admin123

### Demo 4: Base64 Decoding (/burpsuite/demo4)
- **What it demonstrates**: Encoding is not encryption
- **How it works**:
  - Load Example 1 or 2
  - Copy the Base64 data from the URL
  - Use Burp Decoder to decode it
  - See all the sensitive booking information in plain text!
  - Modify it, re-encode, and reload

## Architecture

### Production (Netlify)
```
Browser → Burp Suite → Your Site → Netlify Functions → Response
```

All `/api/*` requests are automatically routed to Netlify Functions via `netlify.toml` redirects.

### Local Development
```
Browser → Burp Suite → localhost:5173 → Vite Dev Server
                                      → Optional: API Server on :3001
```

## Files Structure

- `netlify/functions/` - Serverless functions for production
  - `burpsuite-demo1-login.js` - Demo 1 login validation
  - `documents.js` - Demo 2 document IDOR
  - `auth-login.js` - Demo 3 username enumeration
  - `booking.js` - Demo 4 booking endpoint
- `api-server.js` - Local development API server (not used in production)
- `netlify.toml` - Netlify configuration with API redirects

## Troubleshooting

### Demo 1 not accepting modified password
- Verify Burp Suite is actually intercepting the request
- Check that you're modifying the password field in the request body
- Make sure you forward the request after modifying it

### Burp Suite not intercepting requests
- Check your browser proxy settings (should be localhost:8080)
- Make sure Intercept is turned ON in Burp Suite
- For production URLs, add the domain to Burp's target scope

### Local development not working
- Try using `netlify dev` instead of `npm run dev`
- Make sure ports 5173 and 3001 (or 8888 for Netlify Dev) aren't in use
- Check console for error messages

## Educational Use Only

⚠️ **WARNING**: These demos contain intentional security vulnerabilities and are for authorized security training purposes only. Do not use these techniques on systems you don't own or have explicit permission to test.
