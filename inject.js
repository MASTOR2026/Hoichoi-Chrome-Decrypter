// inject.js
(function() {
    // ArrayBuffer to Base64 helper function
    function toBase64(buffer) {
        let binary = '';
        let bytes = new Uint8Array(buffer);
        let len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }

    // Hook into the EME API (Standard DRM function)
    const originalGenerateRequest = MediaKeySession.prototype.generateRequest;

    MediaKeySession.prototype.generateRequest = function(initDataType, initData) {
        // Capture the PSSH (initData)
        if (initData) {
            const psshBase64 = toBase64(initData);
            console.log("[Hoichoi Spy] PSSH Found:", psshBase64);

            // Send to Content Script
            window.postMessage({
                type: "PSSH_CAPTURED",
                data: psshBase64
            }, "*");
        }
        
        // Call the original function so video plays normally
        return originalGenerateRequest.apply(this, arguments);
    };
})();