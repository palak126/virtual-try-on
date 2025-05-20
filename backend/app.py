from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import base64
import time

app = Flask(__name__)
CORS(app, origins="http://localhost:3000")


FASHN_API_KEY = "fa-HEYZimqUCujY-nQmxVgr2k8B297cfKZfpj0VH"
FASHN_API_RUN_URL = "https://api.fashn.ai/v1/run"
FASHN_API_STATUS_URL = "https://api.fashn.ai/v1/status/"

def image_to_base64(file):
    encoded = base64.b64encode(file.read()).decode('utf-8')
    return f"data:image/jpeg;base64,{encoded}"

@app.route('/api/tryon', methods=['POST'])
def tryon():
    if 'personImage' not in request.files or 'clothImage' not in request.files:
        return jsonify({'error': 'Both person and clothing images are required'}), 400

    person = request.files['personImage']
    cloth = request.files['clothImage']

    payload = {
    "model_image": image_to_base64(person),
    "garment_image": image_to_base64(cloth),
    "category": "tops",  # or 'auto', 'bottoms', etc.
    "garment_photo_type": "flat-lay",
    "moderation_level": "none",
    "mode": "balanced",
    "output_format": "jpeg"
    }


    headers = {
        "Authorization": f"Bearer {FASHN_API_KEY}",
        "Content-Type": "application/json"
    }

    # Step 1: Initiate prediction
    try:
        init_res = requests.post(FASHN_API_RUN_URL, json=payload, headers=headers)
        if init_res.status_code != 200:
            print("Init error:", init_res.text)
            return jsonify({'error': 'Could not initiate try-on'}), 500

        prediction_id = init_res.json().get('id')
        if not prediction_id:
            return jsonify({'error': 'No prediction ID received'}), 500

    except Exception as e:
        return jsonify({'error': f'Init request exception: {str(e)}'}), 500

    # Step 2: Poll for status
    for attempt in range(20):  # up to 40 seconds total
        try:
            status_res = requests.get(FASHN_API_STATUS_URL + prediction_id, headers=headers)
            status_data = status_res.json()

            if status_data['status'] == 'completed':
                output_url = status_data.get('output', [None])[0]
                print("✅ Generated image:", output_url)
                print("✅ Returning to React:", {'output_url': output_url})
                return jsonify({'output_url': output_url})

            elif status_data['status'] == 'failed':
                error_info = status_data.get('error', {})
                error_name = error_info.get('name', 'UnknownError')
                error_message = error_info.get('message', 'Try-on failed with no message')
                print(f"❌ FASHN API Error: {error_name} - {error_message}")
                return jsonify({'error': f'{error_name}: {error_message}'}), 500

            time.sleep(2)
        except Exception as e:
            return jsonify({'error': f'Status check failed: {str(e)}'}), 500

    return jsonify({'error': 'Try-on timed out'}), 504

if __name__ == '__main__':
    app.run(debug=True)
