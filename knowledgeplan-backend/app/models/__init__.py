# Import all models here to make them easily accessible
# e.g., from .user import User
# from .tenant import Tenant
# This also helps Alembic detect the models

from app.db.base_class import Base # Base class for models

# Import your models below this line:
from .tenant import Tenant
from .user import User
from .team import Team 