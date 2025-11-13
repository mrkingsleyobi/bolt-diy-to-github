"use strict";
/**
 * Popup entry point for Bolt.DIY to GitHub extension
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const App_svelte_1 = __importDefault(require("./App.svelte"));
// Initialize the Svelte app
const app = new App_svelte_1.default({
    target: document.getElementById('app')
});
exports.app = app;
// Handle messages from background script
chrome.runtime.onMessage.addListener(handleBackgroundMessage);
/**
 * Handle messages from background script
 * @param {Object} message - The message received
 */
function handleBackgroundMessage(message) {
    console.log('[Bolt.DIY to GitHub Popup] Received message:', message);
    switch (message.type) {
        case 'PROJECT_UPDATED':
            // Update the app with new project information
            app.$set({ project: message.project });
            break;
        case 'SYNC_STARTED':
            // Update UI to show sync in progress
            app.$set({ syncInProgress: true, syncStatus: 'Sync started...' });
            break;
        case 'SYNC_COMPLETED':
            // Update UI to show sync completion
            app.$set({
                syncInProgress: false,
                syncStatus: 'Sync completed successfully!',
                lastSyncResult: message.result
            });
            break;
        case 'SYNC_FAILED':
            // Update UI to show sync failure
            app.$set({
                syncInProgress: false,
                syncStatus: `Sync failed: ${message.error}`,
                error: message.error
            });
            break;
        default:
            console.warn('[Bolt.DIY to GitHub Popup] Unknown message type:', message.type);
    }
}
//# sourceMappingURL=popup.js.map