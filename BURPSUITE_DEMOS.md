# Burp Suite Demo Setup

This directory contains 4 intentionally vulnerable demos for demonstrating Burp Suite features to your cybersecurity club.

## ⚠️ IMPORTANT: Running the Demos

For the demos to work properly with Burp Suite (especially Demo 1), you need to run **BOTH** the frontend and the API server:

### Option 1: Run both services together (Recommended)
```bash
npm run dev:full
```

This will start:
- Frontend (Vite dev server) on `http://localhost:5173`
- API server on `http://localhost:3001`

### Option 2: Run separately in different terminals

Terminal 1 - Frontend:
```bash
npm run dev
```

Terminal 2 - API Server:
```bash
npm run api
```

## Burp Suite Configuration

1. **Set up Burp Proxy**: Configure your browser to use Burp Suite as a proxy (usually `localhost:8080`)

2. **Configure Burp to intercept localhost**:
   - Go to Proxy → Options
   - Under "Intercept Client Requests", ensure localhost requests are intercepted
   - Add `localhost:3001` to your target scope if needed

## How Each Demo Works

### Demo 1: Proxy Intercept (/burpsuite/demo1)
- **What it demonstrates**: Request interception and modification
- **How it works**:
  - Enter any username and password
  - Burp Suite will intercept the POST request
  - Modify the `password` field to `12345678` in Burp Suite
  - Forward the request
  - The API server will validate the MODIFIED password and grant access!

- **Key point**: This shows that Burp Suite can modify requests in transit

### Demo 2: IDOR Vulnerability (/burpsuite/demo2)
- **What it demonstrates**: Insecure Direct Object Reference
- **How it works**:
  - Click "Get My Performance Review" (loads document 1001)
  - Intercept the request in Burp
  - Send to Repeater
  - Change `id=1001` to `id=1002`, `1003`, or `1004`
  - Access unauthorized documents!

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

## Troubleshooting

### "Connection error" alert in Demo 1
- Make sure the API server is running: `npm run api`
- Check that port 3001 is not in use by another application
- Verify Burp Suite is configured to intercept localhost requests

### Demos 2, 3, 4 still use client-side simulation
- These demos don't require the API server for basic functionality
- The API server is optional for these demos but provides a more realistic experience

### Burp Suite not intercepting requests
- Check your browser proxy settings
- Make sure Intercept is turned ON in Burp Suite
- Verify Burp Suite is configured to intercept localhost traffic

## Educational Use Only

These demos contain intentional security vulnerabilities and are for authorized security training purposes only. Do not use these techniques on systems you don't own or have explicit permission to test.
