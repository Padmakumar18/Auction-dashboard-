/**
 * Session Manager Utility
 * Handles session validation and timeout
 */

const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export const sessionManager = {
  /**
   * Set session timestamp
   */
  setSessionTimestamp: () => {
    localStorage.setItem("session_timestamp", Date.now().toString());
  },

  /**
   * Get session timestamp
   */
  getSessionTimestamp: () => {
    const timestamp = localStorage.getItem("session_timestamp");
    return timestamp ? parseInt(timestamp, 10) : null;
  },

  /**
   * Check if session is valid
   */
  isSessionValid: () => {
    const timestamp = sessionManager.getSessionTimestamp();
    if (!timestamp) return false;

    const now = Date.now();
    const elapsed = now - timestamp;

    return elapsed < SESSION_TIMEOUT;
  },

  /**
   * Clear session
   */
  clearSession: () => {
    localStorage.removeItem("session_timestamp");
    localStorage.removeItem("admin_user");
  },

  /**
   * Refresh session timestamp
   */
  refreshSession: () => {
    if (sessionManager.isSessionValid()) {
      sessionManager.setSessionTimestamp();
    }
  },

  /**
   * Initialize session
   */
  initSession: () => {
    sessionManager.setSessionTimestamp();
  },
};

export default sessionManager;
