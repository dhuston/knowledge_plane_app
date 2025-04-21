# Import all models here to make them easily accessible
# e.g., from .user import User
# from .tenant import Tenant
# This also helps Alembic detect the models

from app.db.base_class import Base # Base class for models

# Import your models below this line:
from .user import User
from .tenant import Tenant
from .team import Team
from .department import Department
from .project import Project
from .goal import Goal
from .knowledge_asset import KnowledgeAsset
# from .token_blacklist import TokenBlacklist # Removed missing import

__all__ = [
    "User",
    "Tenant",
    "Team",
    "Department",
    "Project",
    "Goal",
    "KnowledgeAsset",
    # "TokenBlacklist", # Removed from __all__
]

# Import KnowledgeAsset model here later 