// Shared MFA state - persists in memory during function execution
// NOTE: This won't persist across different function invocations in serverless
// but for the demo purposes, we'll use a workaround

// Global state that persists within a single function's lifecycle
const mfaDisabledUsers = new Set();

export function disableMfaForUser(uuid) {
  mfaDisabledUsers.add(uuid);
}

export function enableMfaForUser(uuid) {
  mfaDisabledUsers.delete(uuid);
}

export function isMfaDisabled(uuid) {
  return mfaDisabledUsers.has(uuid);
}

export function resetAllMfaStates() {
  mfaDisabledUsers.clear();
}
