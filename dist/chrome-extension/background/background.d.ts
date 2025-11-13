/**
 * Log an event for debugging and analytics
 * @param {string} eventType - Type of event
 * @param {Object} data - Event data
 */
export function logEvent(eventType: string, data?: Object): void;
/**
 * Log an error for debugging
 * @param {string} errorType - Type of error
 * @param {Error} error - Error object
 */
export function logError(errorType: string, error: Error): void;
/**
 * Get recent errors and events
 * @returns {Array} Recent errors and events
 */
export function getErrorLog(): any[];
//# sourceMappingURL=background.d.ts.map