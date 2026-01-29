// content.js
// 1. Inject the Spy Script
var s = document.createElement('script');
s.src = chrome.runtime.getURL('inject.js');
s.onload = function() {
    this.remove();
};
(document.head || document.documentElement).appendChild(s);

// 2. Listen for PSSH from Spy Script
window.addEventListener("message", function(event) {
    if (event.source != window) return;

    if (event.data.type && (event.data.type == "PSSH_CAPTURED")) {
        console.log("Content Script recieved PSSH");
        
        // Save to Chrome Storage
        chrome.storage.local.set({ 'capturedPssh': event.data.data });
    }
});