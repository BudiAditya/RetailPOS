from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Literal, Optional
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Optional third-party integration creds (hybrid mode — endpoint returns 501 if missing)
TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN')
TWILIO_WHATSAPP_FROM = os.environ.get('TWILIO_WHATSAPP_FROM')
RESEND_API_KEY = os.environ.get('RESEND_API_KEY')
RESEND_FROM_EMAIL = os.environ.get('RESEND_FROM_EMAIL')

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks


# ---------------------------------------------------------------------------
# Receipt Send — Hybrid integration (Twilio WhatsApp / Resend Email)
# Endpoint returns 501 with which env vars are missing when creds are not set.
# ---------------------------------------------------------------------------
class ReceiptSendRequest(BaseModel):
    channel: Literal['whatsapp', 'email']
    to: str
    body: str
    subject: Optional[str] = 'Struk Pembelian Anda'
    trx_number: Optional[str] = None


@api_router.get('/receipt/integrations')
async def receipt_integrations_status():
    """Reports which channels are configured. Frontend uses this to enable/disable buttons."""
    return {
        'whatsapp': {
            'configured': bool(TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN and TWILIO_WHATSAPP_FROM),
            'missing': [
                k for k, v in (
                    ('TWILIO_ACCOUNT_SID', TWILIO_ACCOUNT_SID),
                    ('TWILIO_AUTH_TOKEN', TWILIO_AUTH_TOKEN),
                    ('TWILIO_WHATSAPP_FROM', TWILIO_WHATSAPP_FROM),
                ) if not v
            ],
        },
        'email': {
            'configured': bool(RESEND_API_KEY and RESEND_FROM_EMAIL),
            'missing': [
                k for k, v in (
                    ('RESEND_API_KEY', RESEND_API_KEY),
                    ('RESEND_FROM_EMAIL', RESEND_FROM_EMAIL),
                ) if not v
            ],
        },
    }


@api_router.post('/receipt/send')
async def send_receipt(req: ReceiptSendRequest):
    from fastapi import HTTPException
    if req.channel == 'whatsapp':
        missing = [k for k, v in (
            ('TWILIO_ACCOUNT_SID', TWILIO_ACCOUNT_SID),
            ('TWILIO_AUTH_TOKEN', TWILIO_AUTH_TOKEN),
            ('TWILIO_WHATSAPP_FROM', TWILIO_WHATSAPP_FROM),
        ) if not v]
        if missing:
            raise HTTPException(status_code=501, detail={'message': 'Twilio belum dikonfigurasi.', 'missing': missing})
        try:
            from twilio.rest import Client as TwilioClient
            twilio_client = TwilioClient(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
            to_number = req.to if req.to.startswith('whatsapp:') else f'whatsapp:{req.to}'
            message = twilio_client.messages.create(
                from_=TWILIO_WHATSAPP_FROM,
                body=req.body,
                to=to_number,
            )
            await db.receipt_dispatch.insert_one({
                'channel': 'whatsapp',
                'to': req.to,
                'trx_number': req.trx_number,
                'provider_id': message.sid,
                'createdAt': datetime.now(timezone.utc).isoformat(),
            })
            return {'status': 'success', 'provider': 'twilio_whatsapp', 'id': message.sid}
        except Exception as e:
            logger.exception('Twilio send failed')
            raise HTTPException(status_code=500, detail=str(e))

    # email channel
    missing = [k for k, v in (
        ('RESEND_API_KEY', RESEND_API_KEY),
        ('RESEND_FROM_EMAIL', RESEND_FROM_EMAIL),
    ) if not v]
    if missing:
        raise HTTPException(status_code=501, detail={'message': 'Resend belum dikonfigurasi.', 'missing': missing})
    try:
        import resend
        resend.api_key = RESEND_API_KEY
        # Send as <pre>-wrapped HTML so the thermal-receipt monospace layout is preserved
        html = f'<pre style="font-family:ui-monospace,Menlo,Monaco,Consolas,monospace;font-size:12px;line-height:1.35;white-space:pre;">{req.body}</pre>'
        result = resend.Emails.send({
            'from': RESEND_FROM_EMAIL,
            'to': req.to,
            'subject': req.subject or 'Struk Pembelian Anda',
            'html': html,
            'text': req.body,
        })
        await db.receipt_dispatch.insert_one({
            'channel': 'email',
            'to': req.to,
            'trx_number': req.trx_number,
            'provider_id': result.get('id') if isinstance(result, dict) else None,
            'createdAt': datetime.now(timezone.utc).isoformat(),
        })
        return {'status': 'success', 'provider': 'resend', 'id': result.get('id') if isinstance(result, dict) else None}
    except Exception as e:
        logger.exception('Resend send failed')
        raise HTTPException(status_code=500, detail=str(e))

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()