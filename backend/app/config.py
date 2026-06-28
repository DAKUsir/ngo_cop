from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "impactlens"
    GEMINI_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    JWT_SECRET: str = "change_me_in_production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_HOURS: int = 72
    FRONTEND_URL: str = "http://localhost:3000"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
