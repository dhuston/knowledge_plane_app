from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Define application settings here
    # Example: API prefix, database URL, secrets, etc.
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "KnowledgePlane AI Backend"

    # Database
    # Example: POSTGRES_SERVER: str = "localhost"
    # POSTGRES_USER: str = "postgres"
    # POSTGRES_PASSWORD: str = "password"
    # POSTGRES_DB: str = "knowledgeplane"
    # DATABASE_URL: str | None = None # Constructed from parts

    # Security
    # Example: SECRET_KEY: str = "your_secret_key"
    # ALGORITHM: str = "HS256"
    # ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Google OAuth
    # Example: GOOGLE_CLIENT_ID: str | None = None
    # GOOGLE_CLIENT_SECRET: str | None = None

    # Use .env file for environment variables
    model_config = SettingsConfigDict(env_file=".env", extra='ignore')


settings = Settings() 