import requests
import base64
from flask import Flask, request, jsonify
from flask_cors import CORS
from pywidevine.cdm import Cdm
from pywidevine.device import Device
from pywidevine.pssh import PSSH

app = Flask(__name__)
CORS(app)  # Allows the Chrome Extension to talk to this server

# --- CONFIGURATION ---
DEVICE_PATH = "device.wvd" 
WIDEVINE_SYSTEM_ID = "edef8ba9-79d6-4ace-a3c8-27dcd51d21ed"

@app.route('/decrypt', methods=['POST'])
def decrypt():
    try:
        data = request.json
        
        # 1. Get Data from Extension
        license_url = data.get('url')
        headers = data.get('headers')
        pssh_string = data.get('pssh')

        # Check if we have everything
        if not license_url or not headers or not pssh_string:
            return jsonify({"error": "Server needs URL, Headers, and PSSH. Update your extension."}), 400

        print(f"[*] Processing Request for: {license_url}")

        # 2. Load Device
        try:
            device = Device.load(DEVICE_PATH)
            cdm = Cdm.from_device(device)
            session_id = cdm.open()
        except Exception as e:
            return jsonify({"error": f"Device Error: {str(e)}"}), 500

        # 3. Process PSSH
        try:
            pssh_string = pssh_string.strip()
            # Fix padding if needed
            if len(pssh_string) % 4 != 0:
                pssh_string += '=' * (4 - (len(pssh_string) % 4))
            
            pssh = PSSH(pssh_string)
            
            # Verify it is Widevine
            if str(pssh.system_id).lower() != WIDEVINE_SYSTEM_ID:
                cdm.close(session_id)
                return jsonify({"error": "Wrong PSSH! This is not Widevine."}), 400
                
            challenge = cdm.get_license_challenge(session_id, pssh)
        except Exception as e:
            cdm.close(session_id)
            return jsonify({"error": f"PSSH Error: {str(e)}"}), 400

        # 4. Send License Request
        try:
            # Convert headers to string to be safe
            clean_headers = {k: str(v) for k, v in headers.items()}
            response = requests.post(license_url, headers=clean_headers, data=challenge)
        except Exception as e:
            cdm.close(session_id)
            return jsonify({"error": f"Network Error: {str(e)}"}), 500

        if response.status_code != 200:
            cdm.close(session_id)
            return jsonify({"error": f"Hoichoi Error {response.status_code}: {response.text}"}), 400

        # 5. Decrypt Keys
        try:
            try:
                json_resp = response.json()
                if 'data' in json_resp:
                    lic_data = base64.b64decode(json_resp['data'])
                else:
                    lic_data = response.content
            except:
                lic_data = response.content

            cdm.parse_license(session_id, lic_data)
            keys = []
            for key in cdm.get_keys(session_id):
                if key.type == 'CONTENT':
                    keys.append(f"{key.kid.hex}:{key.key.hex()}")
            
            cdm.close(session_id)
            
            if keys:
                return jsonify({"status": "success", "keys": keys})
            else:
                return jsonify({"error": "No keys found."}), 404

        except Exception as e:
            cdm.close(session_id)
            return jsonify({"error": f"Decryption Failed: {str(e)}"}), 500

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("Server running on port 5000...")
    app.run(debug=True, port=5000)