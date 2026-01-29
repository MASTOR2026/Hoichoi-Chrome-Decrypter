// popup.js
document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const streamBox = document.getElementById('streamBox');
    const subBox = document.getElementById('subBox');
    const psshBox = document.getElementById('psshBox');
    const btnDecrypt = document.getElementById('btnDecrypt');
    const btnFloat = document.getElementById('btnFloat');
    const keysArea = document.getElementById('keysArea');
    const toast = document.getElementById('toast');
    
    // Sections
    const drmSection = document.getElementById('drmSection');
    const noDrmMsg = document.getElementById('noDrmMsg');
    const lblStream = document.getElementById('lblStream');

    // Status Badges
    const stStream = document.getElementById('st_stream');
    const stSub = document.getElementById('st_sub');
    const stLic = document.getElementById('st_lic');
    const stPssh = document.getElementById('st_pssh');

    // --- TOAST FUNCTION ---
    function showToast(msg) {
        toast.innerText = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 1500);
    }

    // --- COPY FUNCTION ---
    function setupCopy(element) {
        element.addEventListener('click', () => {
            const text = element.value || element.innerText;
            if (text && !text.includes("Waiting") && !text.includes("Turn on")) {
                navigator.clipboard.writeText(text);
                showToast("COPIED!");
                const oldBorder = element.style.borderColor;
                element.style.borderColor = "#fff";
                setTimeout(() => element.style.borderColor = oldBorder, 200);
            }
        });
    }

    setupCopy(streamBox);
    setupCopy(subBox);
    setupCopy(psshBox);

    // --- FLOAT ---
    btnFloat.addEventListener('click', () => {
        chrome.windows.create({
            url: "popup.html", type: "popup", width: 500, height: 720, focused: true
        });
        window.close();
    });

    // --- LOAD DATA & LOGIC ---
    chrome.storage.local.get(['hoichoiData', 'capturedPssh'], (result) => {
        let data = result.hoichoiData || {};
        let pssh = result.capturedPssh;
        
        // 1. STREAM HANDLING (MPD vs M3U8)
        if (data.streamCurl) {
            streamBox.value = data.streamCurl;
            
            if (data.streamType === 'M3U8') {
                // --- M3U8 MODE (NO DRM) ---
                stStream.innerText = "M3U8 CURL";
                stStream.classList.add('active', 'm3u8-mode');
                streamBox.classList.add('m3u8-theme');
                
                // Hide DRM stuff
                drmSection.style.display = 'none';
                stLic.style.display = 'none';
                stPssh.style.display = 'none';
                
                // Show Message
                noDrmMsg.style.display = 'block';
                
            } else {
                // --- MPD MODE (DRM) ---
                stStream.innerText = "MPD CURL";
                stStream.classList.add('active');
            }
        }

        // 2. SUBTITLE
        if (data.subtitleUrl) {
            subBox.value = data.subtitleUrl;
            stSub.classList.add('active');
        }

        // 3. LICENSE & PSSH (Only relevant for MPD)
        if (data.streamType !== 'M3U8') {
            if (data.licenseUrl) stLic.classList.add('active');
            if (pssh) {
                psshBox.value = pssh;
                stPssh.classList.add('active');
            }
            if (data.licenseUrl && pssh) {
                btnDecrypt.innerText = "START DECRYPTION";
                btnDecrypt.style.boxShadow = "0 0 10px #00ff41";
            }
        }
    });

    // --- DECRYPT ACTION (Only active for MPD) ---
    btnDecrypt.addEventListener('click', async () => {
        const pssh = psshBox.value.trim();
        chrome.storage.local.get(['hoichoiData'], async (result) => {
            let data = result.hoichoiData || {};
            
            if (!data.licenseUrl) { showToast("NO LICENSE FOUND!"); return; }

            btnDecrypt.innerText = "EXTRACTING...";
            btnDecrypt.style.background = "#ffff00";
            keysArea.style.display = 'none';

            try {
                const response = await fetch('http://127.0.0.1:5000/decrypt', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        url: data.licenseUrl,
                        headers: data.licenseHeaders,
                        pssh: pssh
                    })
                });
                const resData = await response.json();
                if (resData.keys) {
                    let html = '';
                    resData.keys.forEach(k => html += `<div class="key-item">${k}</div>`);
                    keysArea.innerHTML = html;
                    keysArea.style.display = 'block';
                    document.querySelectorAll('.key-item').forEach(item => {
                        item.addEventListener('click', () => {
                            navigator.clipboard.writeText(item.innerText);
                            showToast("KEY COPIED!");
                        });
                    });
                    btnDecrypt.innerText = "SUCCESS";
                    btnDecrypt.style.background = "#00ff41";
                } else {
                    alert("Error: " + (resData.error || "Unknown"));
                    btnDecrypt.innerText = "RETRY";
                    btnDecrypt.style.background = "#ff4444";
                }
            } catch (err) {
                alert("Ensure 'app.py' is running!");
                btnDecrypt.innerText = "SERVER ERROR";
                btnDecrypt.style.background = "#ff4444";
            }
        });
    });
});