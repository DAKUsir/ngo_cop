import motor.motor_asyncio
from app.config import get_settings

settings = get_settings()

client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGODB_URL)
db = client[settings.MONGODB_DB_NAME]

# Collections
users_collection = db["users"]
uploads_collection = db["uploads"]
reports_collection = db["reports"]
predictions_collection = db["predictions"]


async def create_indexes():
    """Create database indexes on startup."""
    await users_collection.create_index("email", unique=True)
    await uploads_collection.create_index("user_id")
    await reports_collection.create_index("user_id")
    await predictions_collection.create_index("report_id")
