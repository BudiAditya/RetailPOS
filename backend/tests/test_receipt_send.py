"""Backend tests for the hybrid Receipt Send feature.

Covers:
- GET /api/receipt/integrations -> 200 with whatsapp+email configured:false + missing arrays
- POST /api/receipt/send (whatsapp) -> 501 with Twilio missing keys
- POST /api/receipt/send (email)    -> 501 with Resend missing keys
- Regression: GET /api/status and POST /api/status still work
"""
import os
import pytest
import requests

BASE_URL = os.environ['REACT_APP_BACKEND_URL'].rstrip('/') if 'REACT_APP_BACKEND_URL' in os.environ \
    else open('/app/frontend/.env').read().split('REACT_APP_BACKEND_URL=')[1].splitlines()[0].strip()


@pytest.fixture(scope='module')
def api():
    s = requests.Session()
    s.headers.update({'Content-Type': 'application/json'})
    return s


# ------------------------------ integrations status ------------------------------
class TestIntegrationsStatus:
    def test_get_integrations_returns_200_and_unconfigured(self, api):
        r = api.get(f'{BASE_URL}/api/receipt/integrations', timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert 'whatsapp' in data and 'email' in data
        # Both must be unconfigured because no env keys are set
        assert data['whatsapp']['configured'] is False
        assert data['email']['configured'] is False
        # Missing keys reported correctly
        wa_missing = set(data['whatsapp']['missing'])
        assert {'TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_WHATSAPP_FROM'}.issubset(wa_missing)
        em_missing = set(data['email']['missing'])
        assert {'RESEND_API_KEY', 'RESEND_FROM_EMAIL'}.issubset(em_missing)


# ------------------------------ send: whatsapp (501) ------------------------------
class TestSendReceiptWhatsApp:
    def test_post_send_whatsapp_returns_501_with_missing_keys(self, api):
        r = api.post(
            f'{BASE_URL}/api/receipt/send',
            json={'channel': 'whatsapp', 'to': '+62812000000', 'body': 'hi'},
            timeout=15,
        )
        assert r.status_code == 501, r.text
        body = r.json()
        # FastAPI HTTPException wraps custom dict in 'detail'
        detail = body.get('detail')
        assert isinstance(detail, dict), f'detail not dict: {detail!r}'
        assert detail.get('message') == 'Twilio belum dikonfigurasi.'
        miss = set(detail.get('missing') or [])
        assert {'TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_WHATSAPP_FROM'}.issubset(miss)


# ------------------------------ send: email (501) ------------------------------
class TestSendReceiptEmail:
    def test_post_send_email_returns_501_with_missing_keys(self, api):
        r = api.post(
            f'{BASE_URL}/api/receipt/send',
            json={'channel': 'email', 'to': 'a@b.com', 'body': 'hi'},
            timeout=15,
        )
        assert r.status_code == 501, r.text
        body = r.json()
        detail = body.get('detail')
        assert isinstance(detail, dict)
        assert detail.get('message') == 'Resend belum dikonfigurasi.'
        miss = set(detail.get('missing') or [])
        assert {'RESEND_API_KEY', 'RESEND_FROM_EMAIL'}.issubset(miss)

    def test_post_send_invalid_channel_returns_422(self, api):
        r = api.post(
            f'{BASE_URL}/api/receipt/send',
            json={'channel': 'sms', 'to': 'x', 'body': 'y'},
            timeout=15,
        )
        # Pydantic Literal validation -> 422
        assert r.status_code == 422, r.text


# ------------------------------ regression: /api/status ------------------------------
class TestStatusRegression:
    def test_get_status_works(self, api):
        r = api.get(f'{BASE_URL}/api/status', timeout=15)
        assert r.status_code == 200, r.text
        assert isinstance(r.json(), list)

    def test_post_status_works_and_persists(self, api):
        payload = {'client_name': 'TEST_receipt_regression'}
        r = api.post(f'{BASE_URL}/api/status', json=payload, timeout=15)
        assert r.status_code == 200, r.text
        created = r.json()
        assert created['client_name'] == payload['client_name']
        assert isinstance(created.get('id'), str) and len(created['id']) > 0
        # GET again, confirm presence
        r2 = api.get(f'{BASE_URL}/api/status', timeout=15)
        assert r2.status_code == 200
        names = [d['client_name'] for d in r2.json()]
        assert payload['client_name'] in names
