from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import PostgresDsn, computed_field
from typing import Optional


class Settings(BaseSettings):
    # Define application settings here
    # Example: API prefix, database URL, secrets, etc.
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "KnowledgePlane AI Backend"

    # Development flags
    DISABLE_OAUTH: bool = False
    DISABLE_OPENAI: bool = False

    # Database
    POSTGRES_SERVER: str = "db" # Service name in docker-compose
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "password"
    POSTGRES_DB: str = "knowledgeplan_dev"
    POSTGRES_PORT: int = 5432

    # Construct SQLAlchemy Database URL asynchronously
    @computed_field # type: ignore[misc]
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> PostgresDsn:
        return PostgresDsn.build(
            scheme="postgresql+asyncpg",
            username=self.POSTGRES_USER,
            password=self.POSTGRES_PASSWORD,
            host=self.POSTGRES_SERVER,
            port=self.POSTGRES_PORT,
            path=self.POSTGRES_DB,
        )

    # Security
    SECRET_KEY: str = "a_very_secret_key_change_this"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8 # 8 days for example
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # Google OAuth
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None

    # OpenAI
    OPENAI_API_KEY: Optional[str] = None



settings = Settings() 