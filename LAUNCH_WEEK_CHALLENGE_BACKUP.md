# Launch Week Challenge - Backup Code

## To Re-enable the Challenge

Add this code back to `src/pages/BurpSuite.tsx` between the demo cards grid and the instructions section:

```tsx
        {/* CTF Challenge */}
        <div className="mt-12 card-hack p-8 rounded-lg border-2 border-matrix/40 bg-gradient-to-br from-matrix/5 to-transparent">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">🚩</span>
            <h2 className="text-3xl font-bold text-matrix">Launch Week Challenge</h2>
          </div>
          <p className="text-gray-300 mb-4 text-lg">
            Think you've mastered the demos? Put your skills to the test with our CTF puzzle.
          </p>
          <p className="text-gray-400 mb-6 text-sm">
            First person to capture the flag wins! This challenge requires creative thinking and mastery of Proxy, Repeater, and Intruder techniques.
          </p>
          <Link
            to="/burpsuite/dashboard"
            className="inline-block btn-hack-filled rounded-lg px-8 py-4 font-semibold text-lg"
          >
            Launch Week 1 Puzzle →
          </Link>
        </div>
```

## Files Involved

The challenge uses these files (all still in place, just hidden):
- Frontend: `src/pages/burpsuite/Dashboard.tsx`
- Backend: `netlify/functions/burpsuite-dashboard-auth.js`
- Backend: `netlify/functions/burpsuite-dashboard-data.js`
- Solution: `CTF_SOLUTION.md`
- Route: Already configured in `src/main.tsx` at `/burpsuite/dashboard`

## Flag
`Week 1 - Bear`

## Challenge Overview
- Students login with `analyst@acme.com` / `analytics2024`
- Token is plain JSON: `{"role":"analyst","timestamp":...,"userid":"analyst001"}`
- Must use Repeater to test different roles
- Must use Intruder to brute-force finding `"c-level"` from 17 corporate roles
- Must use Intruder again to find timestamp in Launch Week 1 window (Jan 1-7, 2024)
