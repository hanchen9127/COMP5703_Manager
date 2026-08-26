"""
AuthService - Authentication service for user registration and login

Responsibilities:
1. User registration
2. User login
3. Password verification
4. Token management
"""

from datetime import datetime, UTC
from fastapi import HTTPException, status

from app.models.admin import User, AccountStatus
from app.repositories.memory_store import store
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    load_org_contexts,
    decode_token,
    SECRET_KEY
)


class AuthService:
    """Authentication service"""
    
    @staticmethod
    def register(email: str, password: str, name: str | None = None, db=None) -> dict:
        """Register a new user
        
        Args:
            email: Email address (globally unique)
            password: Password (at least 8 characters)
            name: Display name (optional)
            db: Optional SQLAlchemy Session for database persistence
        
        Returns:
            {"user_id": int, "email": str, "message": str}
        """
        # Step 1: Check if email is already registered
        for user in store.users.values():
            if user.email == email:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Email already registered"
                )
        
        # Also check database if available
        if db:
            from app.repositories.db_store import DBStore
            db_store = DBStore(db)
            if db_store.users.get_by_email(email):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Email already registered"
                )
        
        # Step 2: Validate password strength
        if len(password) < 8:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 8 characters"
            )
        
        if not any(c.isupper() for c in password) or not any(c.isdigit() for c in password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must contain uppercase letters and numbers"
            )
        
        # Step 3: Hash password
        password_hash = hash_password(password)
        
        # Step 4: Create User record
        user_id = max([u.id for u in store.users.values()] or [0]) + 1
        if db:
            from app.repositories.db_store import DBStore
            db_store = DBStore(db)
            existing_users = db_store.users.list_all()
            if existing_users:
                user_id = max([u.id for u in existing_users]) + 1
        
        new_user = User(
            id=user_id,
            email=email,
            password_hash=password_hash,
            name=name,
            account_status=AccountStatus.ACTIVE,
            two_factor_enabled=False
        )
        
        # Save to both memory and database
        store.users[user_id] = new_user
        if db:
            from app.repositories.db_store import DBStore
            db_store = DBStore(db)
            db_store.users.create(new_user)
        
        return {
            "user_id": user_id,
            "email": email,
            "message": "Registration successful"
        }
    
    @staticmethod
    def login(email: str, password: str, db=None) -> dict:
        """User login
        
        Args:
            email: Email address
            password: Password
            db: Optional SQLAlchemy Session for database lookup
        
        Returns:
            {
                "access_token": str,
                "token_type": "bearer",
                "user": {...},
                "organizations": [...],
                "message": str
            }
        """
        # Step 1: Find user - try database first, then in-memory store
        user = None
        if db:
            from app.repositories.db_store import DBStore
            db_store = DBStore(db)
            user = db_store.users.get_by_email(email)
        
        if not user:
            for u in store.users.values():
                if u.email == email:
                    user = u
                    break
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email or password incorrect"
            )
        
        # Step 2: Verify password
        if not verify_password(password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email or password incorrect"
            )
        
        # Step 3: Check account status
        if user.account_status != AccountStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Account status {user.account_status}, cannot login"
            )
        
        # Step 4: Load permission contexts
        org_contexts = load_org_contexts(user.id, db=db)
        
        # Step 5: Create JWT token
        access_token = create_access_token(user.id, user.email, org_contexts)
        refresh_token = create_refresh_token(user.id)
        
        # Step 6: Update last login time
        user.last_login_at = datetime.now(UTC)
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": {
                "user_id": user.id,  # Correct field name for UserRead schema
                "email": user.email,
                "name": user.name,
                "account_status": user.account_status,
                "two_factor_enabled": user.two_factor_enabled,
                "last_login_at": user.last_login_at
            },
            "organizations": org_contexts,
            "message": "Login successful"
        }
    
    @staticmethod
    def verify_token(token: str) -> dict:
        """Verify token
        
        Args:
            token: JWT token
        
        Returns:
            Token payload (decoded)
        """
        try:
            payload = decode_token(token)
            return payload
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=str(e)
            )
    
    @staticmethod
    def get_current_user(token: str, db=None) -> dict:
        """Get current user information from token
        
        Can query from database if db session is provided, otherwise uses in-memory store
        """
        print(f"[DEBUG] get_current_user called, db is: {db}")
        try:
            payload = AuthService.verify_token(token)
            print(f"[DEBUG] Token verified successfully. Payload: {payload}")
        except HTTPException as e:
            print(f"[DEBUG] HTTPException during verification: {e}")
            # Re-raise HTTPException as-is
            raise e
        except Exception as e:
            import traceback
            print(f"[DEBUG] Token verification error: {str(e)}")
            traceback.print_exc()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        user_id = int(payload.get("sub"))
        print(f"[DEBUG] Looking for user_id: {user_id}")
        
        # Try database first if provided, then fall back to in-memory store
        user = None
        if db:
            print(f"[DEBUG] Using database session for user lookup")
            from app.repositories.db_store import DBStore
            db_store = DBStore(db)
            user = db_store.users.get(user_id)
            print(f"[DEBUG] Database user lookup result: {user}")
        
        if not user:
            print(f"[DEBUG] User not found in db, trying in-memory store")
            user = store.users.get(user_id)
            print(f"[DEBUG] In-memory store user lookup result: {user}")
        
        if not user:
            print(f"[DEBUG] User not found anywhere!")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        print(f"[DEBUG] User found: {user.email}")
        return {
            "user_id": user.id,
            "email": user.email,
            "name": user.name,
            "account_status": user.account_status,
            "orgs": payload.get("orgs", [])
        }
