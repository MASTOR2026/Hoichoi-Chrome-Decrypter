// background.js

// Global variables
let capturedData = {
    streamType: null, // 'MPD' or 'M3U8'
    streamCurl: null, // The full cURL command
    licenseUrl: null,
    licenseHeaders: null,
    subtitleUrl: null,
    pssh: null
};

// --- HELPER: Generate Windows cURL ---
function generateWindowsCurl(url, headers) {
    let cmd = `curl ^"${url}^" ^\n`;
    for (let name in headers) {
        // Exclude problematic headers, keep stream_policy, stream_key, etc.
        if (!name.startsWith(":") && !name.toLowerCase().includes("content-length")) {
            let value = headers[name].replace(/"/g, '\\"'); // Escape quotes
            cmd += `  -H ^"${name}: ${value}^" ^\n`;
        }
    }
    cmd = cmd.slice(0, -3); // Remove last slash
    return cmd;
}

// --- HELPER: Save Data ---
function updateStorage() {
    chrome.storage.local.set({ 'hoichoiData': capturedData });
}

// =================================================================
// 1. LICENSE LISTENER (High Priority - Only for MPD/Widevine)
// =================================================================
chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    if (details.method === "POST" && details.url.includes("entitlement")) {
      let headers = {};
      details.requestHeaders.forEach(h => {
        headers[h.name] = h.value;
      });
      
      capturedData.licenseUrl = details.url;
      capturedData.licenseHeaders = headers;
      
      updateStorage();
      console.log("✅ LICENSE CAPTURED");
    }
  },
  { urls: ["*://prod-api.hoichoi.dev/*"] },
  ["requestHeaders"]
);

// =================================================================
// 2. HYBRID STREAM & SUBTITLE LISTENER
// =================================================================
chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    const url = details.url;
    let headers = {};
    if (details.requestHeaders) {
        details.requestHeaders.forEach(h => headers[h.name] = h.value);
    }

    // --- A. MPD Detection (Widevine Encrypted) ---
    if (url.includes(".mpd")) {
        capturedData.streamType = 'MPD';
        capturedData.streamCurl = generateWindowsCurl(url, headers);
        updateStorage();
        console.log("✅ MPD Detected");
    }

    // --- B. M3U8 Detection (No DRM / HLS) ---
    // We ignore 'master.m3u8' if we want, but usually Hoichoi requests master then chunks.
    // We capture whatever the player requests.
    else if (url.includes(".m3u8")) {
        capturedData.streamType = 'M3U8';
        capturedData.streamCurl = generateWindowsCurl(url, headers);
        // Clear DRM data if we switched to M3U8 to avoid confusion
        capturedData.licenseUrl = null;
        capturedData.pssh = null;
        updateStorage();
        console.log("⚠️ M3U8 Detected (No DRM)");
    }

    // --- C. Subtitle Detection (.vtt / .srt) ---
    else if (url.includes(".vtt") || url.includes(".srt")) {
        capturedData.subtitleUrl = url;
        updateStorage();
        console.log("✅ Subtitle Found");
    }
  },
  { urls: ["<all_urls>"] },
  ["requestHeaders"]
);