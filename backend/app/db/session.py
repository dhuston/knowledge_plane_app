import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

# Import settings only needed if running inside Docker
# from app.core.config import settings

# --- Determine Database URL based on environment ---
def get_db_url():
    running_in_docker = os.getenv("RUNNING_IN_DOCKER", "false").lower() == "true"
    
    if running_in_docker:
        # Inside container: Use settings from config.py
        from app.core.config import settings 
        print("[Session] Running in container, using settings URL")
        # Add debug info about PostgreSQL authentication
        import pwd
        try:
            current_user = pwd.getpwuid(os.getuid()).pw_name
            print(f"[Session] DEBUG: Current process running as OS user: {current_user}")
            print(f"[Session] DEBUG: UID={os.getuid()}, GID={os.getgid()}")
            print(f"[Session] DEBUG: DB User in settings: {settings.POSTGRES_USER}")
        except Exception as e:
            print(f"[Session] DEBUG: Error getting user info: {e}")
        return str(settings.SQLALCHEMY_DATABASE_URI)
    else:
        # Local execution (e.g., scripts): Construct local URL
        print("[Session] Running locally, constructing local URL")
        user = os.getenv("POSTGRES_USER", "postgres")
        password = os.getenv("POSTGRES_PASSWORD", "password")
        host = os.getenv("POSTGRES_HOST_LOCAL", "localhost")
        port = os.getenv("POSTGRES_PORT_LOCAL", "5433")
        db = os.getenv("POSTGRES_DB", "knowledgeplan_dev")
        return f"postgresql+asyncpg://{user}:{password}@{host}:{port}/{db}"

DATABASE_URL = get_db_url()
print(f"[Session] Using Database URL: {DATABASE_URL}") # Log the selected URL
# --------------------------------------------------

# Create the SQLAlchemy async engine
engine = create_async_engine(
    DATABASE_URL,
    pool_pre_ping=True, # Good practice to check connections before use
    # echo=True, # Uncomment for debugging SQL statements
)

# Create a configured "Session" class
# Use expire_on_commit=False for async sessions to allow access to objects after commit
SessionLocal = sessionmaker(
    bind=engine, 
    class_=AsyncSession, 
    expire_on_commit=False
)

# Dependency to get DB session in FastAPI endpoints
async def get_db_session() -> AsyncSession:
    async with SessionLocal() as session:
        yield session 