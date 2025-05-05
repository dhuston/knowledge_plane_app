from datetime import datetime
import uuid
from typing import Any, Dict, List, Optional, Tuple, Union

from sqlalchemy import and_, or_
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification, NotificationRecipient, NotificationPreference
from app.models.user import User
from app.schemas.notification import NotificationCreate, NotificationUpdate


class CRUDNotification:
    """CRUD operations for notifications."""

    def get(self, db: Session, notification_id: uuid.UUID) -> Optional[Notification]:
        """Get a notification by ID."""
        return db.query(Notification).filter(Notification.id == notification_id).first()
        
    async def get_async(self, db: Any, notification_id: uuid.UUID) -> Optional[Notification]:
        """Get a notification by ID (async)."""
        from sqlalchemy import select
        # Check if db is AsyncSession
        if hasattr(db, 'execute'):
            # AsyncSession pattern in SQLAlchemy 2.0
            result = await db.execute(select(Notification).where(Notification.id == notification_id))
            return result.scalars().first()
        else:
            # Fallback to sync operation
            return self.get(db, notification_id)

    def get_multi(
        self, 
        db: Session, 
        *, 
        tenant_id: uuid.UUID, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[Notification]:
        """Get multiple notifications by tenant."""
        return db.query(Notification).filter(
            Notification.tenant_id == tenant_id
        ).offset(skip).limit(limit).all()

    def get_user_notifications(
        self,
        db: Session,
        *,
        user_id: uuid.UUID,
        tenant_id: uuid.UUID,
        skip: int = 0,
        limit: int = 100,
        include_read: bool = False,
        include_dismissed: bool = False,
        types: Optional[List[str]] = None
    ) -> List[Tuple[Notification, NotificationRecipient]]:
        """
        Get notifications for a specific user with filtering options.
        
        Returns a list of tuples with (notification, recipient) pairs.
        """
        query = db.query(Notification, NotificationRecipient).join(
            NotificationRecipient, Notification.id == NotificationRecipient.notification_id
        ).filter(
            Notification.tenant_id == tenant_id,
            NotificationRecipient.user_id == user_id
        )
        
        # Filter by notification status
        if not include_read:
            query = query.filter(NotificationRecipient.read_at == None)
        
        if not include_dismissed:
            query = query.filter(NotificationRecipient.dismissed_at == None)
        
        # Filter by notification types if specified
        if types:
            query = query.filter(Notification.type.in_(types))
            
        # Filter out expired notifications
        now = datetime.utcnow()
        query = query.filter(
            or_(
                Notification.expires_at == None,
                Notification.expires_at > now
            )
        )
        
        # Order by creation date, newest first
        query = query.order_by(Notification.created_at.desc())
        
        return query.offset(skip).limit(limit).all()
        
    async def get_user_notifications_async(
        self,
        db: Any,
        *,
        user_id: uuid.UUID,
        tenant_id: uuid.UUID,
        skip: int = 0,
        limit: int = 100,
        include_read: bool = False,
        include_dismissed: bool = False,
        types: Optional[List[str]] = None
    ) -> List[Tuple[Notification, NotificationRecipient]]:
        """
        Async version of get_user_notifications.
        
        For AsyncSession compatibility using SQLAlchemy 2.0 style queries.
        """
        from sqlalchemy import select, or_, and_, desc
        
        try:
            # Set up the query conditions
            conditions = [
                Notification.tenant_id == tenant_id,
                NotificationRecipient.user_id == user_id
            ]
            
            # Filter by notification status
            if not include_read:
                conditions.append(NotificationRecipient.read_at == None)
            
            if not include_dismissed:
                conditions.append(NotificationRecipient.dismissed_at == None)
            
            # Filter by notification types if specified
            if types:
                conditions.append(Notification.type.in_(types))
                
            # Filter out expired notifications
            now = datetime.utcnow()
            conditions.append(
                or_(
                    Notification.expires_at == None,
                    Notification.expires_at > now
                )
            )
            
            # Create the select statement
            stmt = select(Notification, NotificationRecipient).join(
                NotificationRecipient, 
                Notification.id == NotificationRecipient.notification_id
            ).where(
                and_(*conditions)
            ).order_by(
                desc(Notification.created_at)
            ).offset(skip).limit(limit)
            
            # Execute the statement
            result = await db.execute(stmt)
            
            # Return results
            return list(result.tuples().all())
        except Exception as e:
            # In case of error, log and return empty list
            print(f"Error in get_user_notifications_async: {e}")
            return []

    def create(
        self, 
        db: Session, 
        *, 
        obj_in: NotificationCreate,
        tenant_id: uuid.UUID
    ) -> Notification:
        """Create a new notification."""
        notification_id = uuid.uuid4()
        
        db_obj = Notification(
            id=notification_id,
            tenant_id=tenant_id,
            type=obj_in.type,
            severity=obj_in.severity,
            title=obj_in.title,
            message=obj_in.message,
            entity_type=obj_in.entity_type,
            entity_id=obj_in.entity_id,
            action_url=obj_in.action_url,
            expires_at=obj_in.expires_at
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def create_with_recipients(
        self,
        db: Session,
        *,
        obj_in: NotificationCreate,
        tenant_id: uuid.UUID,
        recipient_ids: List[uuid.UUID]
    ) -> Notification:
        """Create a notification and assign it to multiple recipients."""
        # First create the notification
        notification = self.create(db=db, obj_in=obj_in, tenant_id=tenant_id)
        
        # Then create the recipients
        recipients = []
        for user_id in recipient_ids:
            recipient = NotificationRecipient(
                notification_id=notification.id,
                user_id=user_id
            )
            recipients.append(recipient)
        
        if recipients:
            db.add_all(recipients)
            db.commit()
        
        return notification
        
    async def create_with_recipients_async(
        self,
        db: Any,
        *,
        obj_in: NotificationCreate,
        tenant_id: uuid.UUID,
        recipient_ids: List[uuid.UUID]
    ) -> Notification:
        """Create a notification and assign it to multiple recipients (async version)."""
        # Create notification with a unique ID
        notification_id = uuid.uuid4()
        
        db_obj = Notification(
            id=notification_id,
            tenant_id=tenant_id,
            type=obj_in.type,
            severity=obj_in.severity,
            title=obj_in.title,
            message=obj_in.message,
            entity_type=obj_in.entity_type,
            entity_id=obj_in.entity_id,
            action_url=obj_in.action_url,
            expires_at=obj_in.expires_at
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        
        # Then create the recipients
        recipients = []
        for user_id in recipient_ids:
            recipient = NotificationRecipient(
                notification_id=db_obj.id,
                user_id=user_id
            )
            recipients.append(recipient)
        
        if recipients:
            db.add_all(recipients)
            await db.commit()
        
        return db_obj

    def update(
        self,
        db: Session,
        *,
        db_obj: Notification,
        obj_in: Union[NotificationUpdate, Dict[str, Any]]
    ) -> Notification:
        """Update a notification."""
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True)
        
        for field in update_data:
            if hasattr(db_obj, field):
                setattr(db_obj, field, update_data[field])
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def delete(self, db: Session, *, id: uuid.UUID) -> Notification:
        """Delete a notification."""
        obj = db.query(Notification).get(id)
        db.delete(obj)
        db.commit()
        return obj
    
    def mark_as_read(
        self,
        db: Session,
        *,
        notification_id: uuid.UUID,
        user_id: uuid.UUID
    ) -> NotificationRecipient:
        """Mark a notification as read for a specific user."""
        recipient = db.query(NotificationRecipient).filter(
            NotificationRecipient.notification_id == notification_id,
            NotificationRecipient.user_id == user_id
        ).first()
        
        if recipient:
            recipient.read_at = datetime.utcnow()
            db.add(recipient)
            db.commit()
            db.refresh(recipient)
            
        return recipient
        
    async def mark_as_read_async(
        self,
        db: Any,
        *,
        notification_id: uuid.UUID,
        user_id: uuid.UUID
    ) -> NotificationRecipient:
        """Mark a notification as read for a specific user (async version)."""
        from sqlalchemy import select
        
        # Get the recipient
        stmt = select(NotificationRecipient).where(
            NotificationRecipient.notification_id == notification_id,
            NotificationRecipient.user_id == user_id
        )
        result = await db.execute(stmt)
        recipient = result.scalars().first()
        
        if recipient:
            recipient.read_at = datetime.utcnow()
            db.add(recipient)
            await db.commit()
            await db.refresh(recipient)
            
        return recipient
    
    def dismiss(
        self,
        db: Session,
        *,
        notification_id: uuid.UUID,
        user_id: uuid.UUID
    ) -> NotificationRecipient:
        """Dismiss a notification for a specific user."""
        recipient = db.query(NotificationRecipient).filter(
            NotificationRecipient.notification_id == notification_id,
            NotificationRecipient.user_id == user_id
        ).first()
        
        if recipient:
            recipient.dismissed_at = datetime.utcnow()
            db.add(recipient)
            db.commit()
            db.refresh(recipient)
            
        return recipient
        
    async def dismiss_async(
        self,
        db: Any,
        *,
        notification_id: uuid.UUID,
        user_id: uuid.UUID
    ) -> NotificationRecipient:
        """Dismiss a notification for a specific user (async version)."""
        from sqlalchemy import select
        
        # Get the recipient
        stmt = select(NotificationRecipient).where(
            NotificationRecipient.notification_id == notification_id,
            NotificationRecipient.user_id == user_id
        )
        result = await db.execute(stmt)
        recipient = result.scalars().first()
        
        if recipient:
            recipient.dismissed_at = datetime.utcnow()
            db.add(recipient)
            await db.commit()
            await db.refresh(recipient)
            
        return recipient
    
    def mark_all_as_read(
        self,
        db: Session,
        *,
        user_id: uuid.UUID,
        tenant_id: uuid.UUID
    ) -> int:
        """Mark all notifications as read for a user."""
        now = datetime.utcnow()
        
        # Get all unread notifications for this user within this tenant
        recipients = db.query(NotificationRecipient).join(
            Notification, Notification.id == NotificationRecipient.notification_id
        ).filter(
            Notification.tenant_id == tenant_id,
            NotificationRecipient.user_id == user_id,
            NotificationRecipient.read_at == None
        ).all()
        
        # Mark them all as read
        count = 0
        for recipient in recipients:
            recipient.read_at = now
            count += 1
        
        db.commit()
        return count
        
    async def mark_all_as_read_async(
        self,
        db: Any,
        *,
        user_id: uuid.UUID,
        tenant_id: uuid.UUID
    ) -> int:
        """Mark all notifications as read for a user (async version)."""
        from sqlalchemy import select, join, and_, update
        
        now = datetime.utcnow()
        
        try:
            # Get all unread notifications for this user within this tenant
            stmt = select(NotificationRecipient).join(
                Notification, Notification.id == NotificationRecipient.notification_id
            ).where(
                Notification.tenant_id == tenant_id,
                NotificationRecipient.user_id == user_id,
                NotificationRecipient.read_at == None
            )
            
            result = await db.execute(stmt)
            recipients = result.scalars().all()
            
            # Mark them all as read
            count = 0
            for recipient in recipients:
                recipient.read_at = now
                count += 1
            
            # Commit changes
            if count > 0:
                await db.commit()
                
            return count
        except Exception as e:
            print(f"Error in mark_all_as_read_async: {e}")
            # Return 0 to indicate no updates were made
            return 0
    
    def dismiss_all(
        self,
        db: Session,
        *,
        user_id: uuid.UUID,
        tenant_id: uuid.UUID
    ) -> int:
        """Dismiss all notifications for a user."""
        now = datetime.utcnow()
        
        # Get all undismissed notifications for this user within this tenant
        recipients = db.query(NotificationRecipient).join(
            Notification, Notification.id == NotificationRecipient.notification_id
        ).filter(
            Notification.tenant_id == tenant_id,
            NotificationRecipient.user_id == user_id,
            NotificationRecipient.dismissed_at == None
        ).all()
        
        # Dismiss them all
        count = 0
        for recipient in recipients:
            recipient.dismissed_at = now
            count += 1
        
        db.commit()
        return count
        
    async def dismiss_all_async(
        self,
        db: Any,
        *,
        user_id: uuid.UUID,
        tenant_id: uuid.UUID
    ) -> int:
        """Dismiss all notifications for a user (async version)."""
        from sqlalchemy import select, join, and_
        
        now = datetime.utcnow()
        
        try:
            # Get all undismissed notifications for this user within this tenant
            stmt = select(NotificationRecipient).join(
                Notification, Notification.id == NotificationRecipient.notification_id
            ).where(
                Notification.tenant_id == tenant_id,
                NotificationRecipient.user_id == user_id,
                NotificationRecipient.dismissed_at == None
            )
            
            result = await db.execute(stmt)
            recipients = result.scalars().all()
            
            # Dismiss them all
            count = 0
            for recipient in recipients:
                recipient.dismissed_at = now
                count += 1
            
            # Commit changes
            if count > 0:
                await db.commit()
                
            return count
        except Exception as e:
            print(f"Error in dismiss_all_async: {e}")
            # Return 0 to indicate no updates were made
            return 0
    
    def clean_expired_notifications(
        self,
        db: Session,
        *,
        tenant_id: Optional[uuid.UUID] = None
    ) -> int:
        """Remove expired notifications."""
        now = datetime.utcnow()
        
        # Build query to find expired notifications
        query = db.query(Notification).filter(
            Notification.expires_at != None,
            Notification.expires_at < now
        )
        
        # Add tenant filter if provided
        if tenant_id:
            query = query.filter(Notification.tenant_id == tenant_id)
        
        # Get the count and then delete
        count = query.count()
        query.delete(synchronize_session=False)
        
        db.commit()
        return count


class CRUDNotificationPreference:
    """CRUD operations for notification preferences."""
    
    def get(
        self, 
        db: Session, 
        *, 
        user_id: uuid.UUID, 
        notification_type: str
    ) -> Optional[NotificationPreference]:
        """Get a user's preference for a specific notification type."""
        return db.query(NotificationPreference).filter(
            NotificationPreference.user_id == user_id,
            NotificationPreference.notification_type == notification_type
        ).first()
        
    async def get_async(
        self, 
        db: Any, 
        *, 
        user_id: uuid.UUID, 
        notification_type: str
    ) -> Optional[NotificationPreference]:
        """Get a user's preference for a specific notification type (async)."""
        from sqlalchemy import select
        
        # Check if db is AsyncSession
        if hasattr(db, 'execute'):
            # AsyncSession pattern in SQLAlchemy 2.0
            stmt = select(NotificationPreference).where(
                NotificationPreference.user_id == user_id,
                NotificationPreference.notification_type == notification_type
            )
            result = await db.execute(stmt)
            return result.scalars().first()
        else:
            # Fallback to sync operation
            return self.get(db, user_id=user_id, notification_type=notification_type)
    
    def get_all_for_user(
        self,
        db: Session,
        *,
        user_id: uuid.UUID
    ) -> List[NotificationPreference]:
        """Get all notification preferences for a user."""
        return db.query(NotificationPreference).filter(
            NotificationPreference.user_id == user_id
        ).all()
        
    async def get_all_for_user_async(
        self,
        db: Any,
        *,
        user_id: uuid.UUID
    ) -> List[NotificationPreference]:
        """Get all notification preferences for a user (async)."""
        from sqlalchemy import select
        
        try:
            # AsyncSession pattern in SQLAlchemy 2.0
            stmt = select(NotificationPreference).where(
                NotificationPreference.user_id == user_id
            )
            result = await db.execute(stmt)
            return list(result.scalars().all())
        except Exception as e:
            print(f"Error in get_all_for_user_async: {e}")
            return []
    
    def create(
        self,
        db: Session,
        *,
        user_id: uuid.UUID,
        notification_type: str,
        enabled: bool = True,
        email_enabled: bool = False
    ) -> NotificationPreference:
        """Create a new notification preference."""
        db_obj = NotificationPreference(
            user_id=user_id,
            notification_type=notification_type,
            enabled=enabled,
            email_enabled=email_enabled
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def update(
        self,
        db: Session,
        *,
        db_obj: NotificationPreference,
        enabled: Optional[bool] = None,
        email_enabled: Optional[bool] = None
    ) -> NotificationPreference:
        """Update a notification preference."""
        if enabled is not None:
            db_obj.enabled = enabled
        if email_enabled is not None:
            db_obj.email_enabled = email_enabled
            
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
        
    async def update_async(
        self,
        db: Any,
        *,
        db_obj: NotificationPreference,
        enabled: Optional[bool] = None,
        email_enabled: Optional[bool] = None
    ) -> NotificationPreference:
        """Update a notification preference (async)."""
        try:
            if enabled is not None:
                db_obj.enabled = enabled
            if email_enabled is not None:
                db_obj.email_enabled = email_enabled
                
            db.add(db_obj)
            await db.commit()
            await db.refresh(db_obj)
            return db_obj
        except Exception as e:
            print(f"Error in update_async: {e}")
            return db_obj
    
    def get_or_create(
        self,
        db: Session,
        *,
        user_id: uuid.UUID,
        notification_type: str,
        default_enabled: bool = True,
        default_email_enabled: bool = False
    ) -> NotificationPreference:
        """Get a preference or create it if it doesn't exist."""
        preference = self.get(
            db=db, 
            user_id=user_id,
            notification_type=notification_type
        )
        
        if not preference:
            preference = self.create(
                db=db,
                user_id=user_id,
                notification_type=notification_type,
                enabled=default_enabled,
                email_enabled=default_email_enabled
            )
            
        return preference
        
    async def get_or_create_async(
        self,
        db: Any,
        *,
        user_id: uuid.UUID,
        notification_type: str,
        default_enabled: bool = True,
        default_email_enabled: bool = False
    ) -> NotificationPreference:
        """Get a preference or create it if it doesn't exist (async)."""
        try:
            preference = await self.get_async(
                db=db, 
                user_id=user_id,
                notification_type=notification_type
            )
            
            if not preference:
                # Create a new preference
                preference = NotificationPreference(
                    user_id=user_id,
                    notification_type=notification_type,
                    enabled=default_enabled,
                    email_enabled=default_email_enabled
                )
                db.add(preference)
                await db.commit()
                await db.refresh(preference)
                
            return preference
        except Exception as e:
            print(f"Error in get_or_create_async: {e}")
            # Create an object but don't persist it
            return NotificationPreference(
                user_id=user_id,
                notification_type=notification_type,
                enabled=default_enabled,
                email_enabled=default_email_enabled
            )
    
    def set_defaults_for_user(
        self,
        db: Session,
        *,
        user_id: uuid.UUID
    ) -> List[NotificationPreference]:
        """
        Set default notification preferences for a user.
        
        Creates preference entries for all notification types with default values.
        """
        # Define all notification types and their defaults
        notification_defaults = {
            "activity": (True, False),
            "insight": (True, True),
            "reminder": (True, True),
            "system": (True, False),
            "mention": (True, True),
            "relationship": (True, False)
        }
        
        result = []
        for notification_type, (enabled, email_enabled) in notification_defaults.items():
            # Check if preference already exists
            pref = self.get(db=db, user_id=user_id, notification_type=notification_type)
            
            # Create if it doesn't exist
            if not pref:
                pref = self.create(
                    db=db,
                    user_id=user_id,
                    notification_type=notification_type,
                    enabled=enabled,
                    email_enabled=email_enabled
                )
                
            result.append(pref)
            
        return result
        
    async def set_defaults_for_user_async(
        self,
        db: Any,
        *,
        user_id: uuid.UUID
    ) -> List[NotificationPreference]:
        """
        Set default notification preferences for a user (async version).
        
        Creates preference entries for all notification types with default values.
        """
        # Define all notification types and their defaults
        notification_defaults = {
            "activity": (True, False),
            "insight": (True, True),
            "reminder": (True, True),
            "system": (True, False),
            "mention": (True, True),
            "relationship": (True, False)
        }
        
        try:
            result = []
            for notification_type, (enabled, email_enabled) in notification_defaults.items():
                # Check if preference already exists
                pref = await self.get_async(db=db, user_id=user_id, notification_type=notification_type)
                
                # Create if it doesn't exist
                if not pref:
                    pref = NotificationPreference(
                        user_id=user_id,
                        notification_type=notification_type,
                        enabled=enabled,
                        email_enabled=email_enabled
                    )
                    db.add(pref)
                    await db.commit()
                    await db.refresh(pref)
                    
                result.append(pref)
                
            return result
        except Exception as e:
            print(f"Error in set_defaults_for_user_async: {e}")
            # Return empty list on error
            return []


notification = CRUDNotification()
notification_preference = CRUDNotificationPreference()