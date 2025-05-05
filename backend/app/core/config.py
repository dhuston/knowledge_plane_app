from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import PostgresDsn, computed_field
from typing import Optional
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    # Define application settings here
    # Example: API prefix, database URL, secrets, etc.
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "KnowledgePlane AI Backend"

    # Development flags
    DISABLE_OAUTH: bool = False
    DISABLE_OPENAI: bool = False
    
    # Configure environment variable loading
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    # Database
    POSTGRES_SERVER: str = "db" # Service name in docker-compose
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "password")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "knowledgeplan_dev")
    POSTGRES_PORT: int = int(os.getenv("POSTGRES_PORT", "5432"))

    # Construct SQLAlchemy Database URL asynchronously
    @computed_field # type: ignore[misc]
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> PostgresDsn:
        # Log authentication details
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"[Config] Building DB URI with: scheme=postgresql+asyncpg, user={self.POSTGRES_USER}, host={self.POSTGRES_SERVER}, port={self.POSTGRES_PORT}")
        logger.info(f"[Config] Docker environment: RUNNING_IN_DOCKER={os.getenv('RUNNING_IN_DOCKER', 'not set')}")
        logger.info(f"[Config] Checking environment: POSTGRES_HOST={os.getenv('POSTGRES_HOST', 'not set')}, POSTGRES_SERVER={self.POSTGRES_SERVER}")
        
        # Try with md5 auth instead of peer
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

    # OpenAI Configuration
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: Optional[str] = "gpt-3.5-turbo"
    
    # Azure OpenAI Configuration
    OPENAI_IS_AZURE: bool = False
    AZURE_OPENAI_ENDPOINT: Optional[str] = None
    AZURE_OPENAI_DEPLOYMENT: Optional[str] = None
    AZURE_OPENAI_API_VERSION: str = "2023-05-15"



# Log environment variables for debugging
logger.info("Environment variables for debugging:")
openai_key = os.environ.get("OPENAI_API_KEY")
logger.info(f"OPENAI_API_KEY from os.environ: {'Set (value hidden)' if openai_key else 'Not Set'}")
logger.info(f"DISABLE_OPENAI from os.environ: {os.environ.get('DISABLE_OPENAI', 'Not Set')}")

settings = Settings()
logger.info(f"OPENAI_API_KEY from settings: {'Set (value hidden)' if settings.OPENAI_API_KEY else 'Not Set'}")
logger.info(f"DISABLE_OPENAI from settings: {settings.DISABLE_OPENAI}") 