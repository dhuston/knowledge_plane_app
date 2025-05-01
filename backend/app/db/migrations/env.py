import asyncio
import os
import sys # Import sys
from logging.config import fileConfig

# --- Path setup ---
# Add the project root directory (THREE levels up from 'migrations') to sys.path
# This allows alembic to find the 'app' module
project_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..')) # Corrected path
if project_dir not in sys.path:
    print(f"[env.py] Adding project root to sys.path: {project_dir}") # Add log for verification
    sys.path.insert(0, project_dir)
# -----------------

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

# Import Base from your models module so Alembic detects changes
# Now this import should work because the path is set correctly
from app.db.base_class import Base
# Import your models to ensure they are registered with Base.metadata
from app.models import User, Tenant, Team # Ensure all models are imported

# Import settings to get DB URL
# from app.core.config import settings # settings is used inside get_db_url now

# This is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
# Only configure logging if the config file name is available
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Add your model's MetaData object here
# for 'autogenerate' support
target_metadata = Base.metadata

# Get the database URL from settings
# DATABASE_URL = str(settings.SQLALCHEMY_DATABASE_URI) # REMOVED - Handled by get_db_url() now

# Other values from the config, defined by the needs of env.py,
# can be acquired: my_important_option = config.get_main_option("my_important_option")
# ... etc.

# --- Adjust DB URL for local Alembic runs ---
def get_db_url():
    """Gets the correct database URL based on environment."""
    # Check for an environment variable to indicate running inside Docker
    # Alternatively, you could check for existence of /.dockerenv
    # For simplicity, we'll assume if not explicitly set, it's a local run.
    running_in_docker = os.getenv("RUNNING_IN_DOCKER", "false").lower() == "true"

    if running_in_docker:
        # Use settings from config.py for in-container connection
        from app.core.config import settings 
        print("Running migration inside container, using config URL:", settings.SQLALCHEMY_DATABASE_URI)
        return str(settings.SQLALCHEMY_DATABASE_URI) # Return as string
    else:
        # Construct URL for connecting from host to exposed Docker port
        # Use defaults or read from .env if needed for local alembic user/pass/db
        user = os.getenv("POSTGRES_USER", "postgres")
        password = os.getenv("POSTGRES_PASSWORD", "password")
        host = os.getenv("POSTGRES_HOST_LOCAL", "localhost") # Host name for local connection
        port = os.getenv("POSTGRES_PORT_LOCAL", "5433")    # Exposed host port
        db = os.getenv("POSTGRES_DB", "knowledgeplan_dev")
        local_url = f"postgresql+asyncpg://{user}:{password}@{host}:{port}/{db}"
        print("Running migration locally, using constructed URL:", local_url)
        return local_url

# Set the sqlalchemy.url from our function
config.set_main_option("sqlalchemy.url", get_db_url())
# --------------------------------------------

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
