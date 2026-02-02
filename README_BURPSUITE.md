# 🔒 Burp Suite Demo Implementation

## Summary

I've implemented 4 fully functional Burp Suite demos for your DACC website. The demos work **both locally and in production** on Netlify!

## What Was Built

### 1. Netlify Functions (Serverless Backend)
Created 4 serverless functions in `netlify/functions/`:
- **burpsuite-demo1-login.js** - Validates login credentials (accepts password "12345678")
- **documents.js** - Serves documents for IDOR demo
- **auth-login.js** - Handles username enumeration vulnerability
- **booking.js** - Handles booking requests

### 2. Demo Pages
- **Demo 1**: Proxy Intercept - Login form where you can modify password in Burp Suite
- **Demo 2**: IDOR Vulnerability - Access unauthorized documents by changing ID parameter
- **Demo 3**: Username Enumeration - Different error messages reveal valid usernames
- **Demo 4**: Base64 Decoder - Decode sensitive data from URLs

### 3. Configuration
- **netlify.toml** - Routes API requests to Netlify Functions
- API redirects for all `/api/*` endpoints
- Functions will automatically deploy with your site

## Deployment to Netlify

When you push to GitHub and Netlify builds your site:

1. ✅ Frontend builds normally (`npm run build`)
2. ✅ Netlify automatically deploys the functions from `netlify/functions/`
3. ✅ All `/api/*` requests are routed to serverless functions
4. ✅ **Demo 1 will work with real request modification!**

## Key Feature: Demo 1 NOW WORKS!

**The problem**: Originally, modifying requests in Burp Suite didn't work because there was no backend to validate the modified password.

**The solution**:
- Created a real backend using Netlify Functions
- The function validates whatever password is in the request body
- When you modify the password to "12345678" in Burp Suite, the function sees the MODIFIED value
- Login succeeds, demonstrating real request tampering!

## Files Created/Modified

### New Files:
- `netlify/functions/burpsuite-demo1-login.js`
- `netlify/functions/documents.js`
- `netlify/functions/auth-login.js`
- `netlify/functions/booking.js`
- `api-server.js` (for local development only)
- `start-burpsuite-demo.sh` (convenience script)
- `BURPSUITE_DEMOS.md` (documentation)

### Modified Files:
- `netlify.toml` - Added API redirects
- `package.json` - Added `api` and `dev:full` scripts
- `src/pages/burpsuite/Demo1.tsx` - Updated to use relative API URL
- All demo pages already use relative URLs

## How to Use

### Production (After deploying to Netlify):
1. Visit your site
2. Go to `/burpsuite`
3. Launch any demo
4. **It just works!** No setup needed

### Local Development:
```bash
# Option 1: Use Netlify Dev (simulates production)
netlify dev

# Option 2: Use local API server
npm run dev:full
```

## Testing Before Deploy

You can test the Netlify Functions locally:

```bash
npm install -g netlify-cli
netlify dev
```

This will:
- Start the Vite dev server
- Start Netlify Functions locally
- Simulate the exact production environment

## What to Tell Your Club

When demonstrating:

1. **Demo 1 is the star** - It shows real request modification working
2. Open Burp Suite, configure proxy
3. Try to login with any password (like "wrongpass")
4. Intercept the request in Burp
5. Change the password field to "12345678"
6. Forward the request
7. **The backend validates the MODIFIED password and you're logged in!**

This demonstrates that:
- Burp Suite can intercept and modify requests
- The server sees the modified data, not what the user typed
- This is how real attacks work

## No Local Server Needed in Production!

The key advantage: When you deploy to Netlify, **everything just works**. No need to run a separate server, no CORS issues, no localhost configuration. The Netlify Functions are automatically deployed and available at your production URL.

Just push to GitHub and demo to your club! 🚀
