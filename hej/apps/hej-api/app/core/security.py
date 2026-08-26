"""
Security Module - Password encryption, JWT handling, and permission checking

Includes:
1. Password hashing and verification
2. JWT token creation and verification
3. Three-layer permission check functions
"""

from datetime import UTC, datetime, timedelta
from typing import Optional
import jwt
import bcrypt

from app.repositories.memory_store import store


# ============ Configuration (should come from settings, using defaults here) ============

SECRET_KEY = "your-secret-key-change-in-production"  # TODO: Load from settings
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 10080  # 7 days (increased from 60 minutes for better UX)
REFRESH_TOKEN_EXPIRE_DAYS = 30  # 30 days (increased from 7 days)


# ============ Password handling ============

def hash_password(password: str) -> str:
    """Hash password"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode(), salt).decode()


def verify_password(password: str, password_hash: str) -> bool:
    """Verify password"""
    return bcrypt.checkpw(password.encode(), password_hash.encode())


# ============ JWT Token ============

def create_access_token(user_id: int, email: str, org_contexts: list, expires_delta: Optional[timedelta] = None) -> str:
    """Create access token"""
    if expires_delta is None:
        expires_delta = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    expire = datetime.now(UTC) + expires_delta
    to_encode = {
        "sub": str(user_id),
        "email": email,
        "orgs": org_contexts,
        "exp": expire,
        "iat": datetime.now(UTC)
    }
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_refresh_token(user_id: int) -> str:
    """Create refresh token"""
    expire = datetime.now(UTC) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode = {
        "sub": str(user_id),
        "type": "refresh",
        "exp": expire
    }
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> dict:
    """Decode token, return payload"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise ValueError("Token expired")
    except jwt.InvalidTokenError:
        raise ValueError("Invalid token")


def create_invitation_token(user_id: int, org_id: int, expires_delta: Optional[timedelta] = None) -> str:
    """Create invitation token"""
    if expires_delta is None:
        expires_delta = timedelta(hours=24)  # Invitation valid for 24 hours
    
    expire = datetime.now(UTC) + expires_delta
    to_encode = {
        "user_id": user_id,
        "org_id": org_id,
        "type": "invitation",
        "exp": expire
    }
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_invitation_token(token: str) -> dict:
    """Decode invitation token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "invitation":
            raise ValueError("Not an invitation token")
        return payload
    except jwt.ExpiredSignatureError:
        raise ValueError("Invitation expired")
    except jwt.InvalidTokenError:
        raise ValueError("Invalid invitation token")


# ============ Permission checking (three-layer architecture) ============

def load_org_contexts(user_id: int, db=None) -> list:
    """Load user permission contexts in all organizations
    
    Used for returning list of organizations accessible to user on login
    Can query from database if db session is provided, otherwise uses in-memory store
    """
    contexts = []
    
    # Get organization_users list
    if db:
        from app.repositories.db_store import DBStore
        db_store = DBStore(db)
        org_users_list = db_store.organization_users.list_all()
        orgs_list = db_store.organizations.list_all()
        roles_list = db_store.role_assignments.list_all()
        policies_list = db_store.organization_policies.list_all()
    else:
        org_users_list = store.organization_users.values() if hasattr(store.organization_users, 'values') else store.organization_users.list_all()
        orgs_list = store.organizations.values() if hasattr(store.organizations, 'values') else store.organizations.list_all()
        roles_list = store.role_assignments.values() if hasattr(store.role_assignments, 'values') else store.role_assignments.list_all()
        policies_list = store.organization_policies.values() if hasattr(store.organization_policies, 'values') else store.organization_policies.list_all()
    
    # Query all user memberships in this organization
    for org_user in org_users_list:
        if org_user.user_id != user_id:
            continue
        if org_user.status not in ["active", "restricted"]:
            continue
        
        org_id = org_user.organization_id
        org = next((o for o in orgs_list if o.id == org_id), None)
        if not org:
            continue
        
        # Query all active roles for this user in this org
        roles = []
        is_admin = False
        for role in roles_list:
            if role.user_id == user_id and role.organization_id == org_id and role.revoked_at is None:
                roles.append(role.role_key)
                if role.role_key == "admin":
                    is_admin = True
        
        # Get organization policy
        policy = next((p for p in policies_list if p.id == org_id), None)
        policy_dict = {}
        if policy:
            policy_dict = {
                "membership_approval_required": policy.membership_approval_required,
                "review_dual_sign_off": policy.review_dual_sign_off,
                "dispute_escalation_gate": policy.dispute_escalation_gate,
                "export_provenance_required": policy.export_provenance_required
            }
        
        # Count organization members
        members_count = len([ou for ou in org_users_list if ou.organization_id == org_id])
        is_owner = "owner" in roles or is_admin
        
        contexts.append({
            "organization_id": org_id,
            "organization_name": org.name,
            "name": org.name,  # For frontend compatibility
            "organization_slug": org.slug,
            "slug": org.slug,  # For frontend compatibility
            "organization_status": org.status,
            "status": org.status,  # For frontend compatibility
            "membership_status": org_user.status,
            "roles": roles,
            "is_admin": is_admin,
            "is_owner": is_owner,
            "members_count": members_count,
            "policy": policy_dict
        })
    
    return contexts


def is_user_active(user_id: int) -> bool:
    """Layer 1: Check if user is globally active"""
    user = store.users.get(user_id)
    return user is not None and user.account_status == "active"


def is_org_member(user_id: int, org_id: int) -> bool:
    """Layer 2: Check if user is member of organization"""
    for org_user in store.organization_users.values():
        if org_user.user_id == user_id and org_user.organization_id == org_id:
            return org_user.status in ["active", "restricted"]
    return False


def has_role(user_id: int, org_id: int, required_roles: list) -> bool:
    """Layer 3: Check if user has specified role"""
    user_roles = []
    for role in store.role_assignments.values():
        if role.user_id == user_id and role.organization_id == org_id and role.revoked_at is None:
            user_roles.append(role.role_key)
    return any(role in user_roles for role in required_roles)


def can_access(user_id: int, org_id: int, required_roles: list) -> bool:
    """Complete permission check with three-layer validation
    
    Args:
        user_id: User ID
        org_id: Organization ID
        required_roles: List of required roles, [admin, reviewer, ...] need only one
    
    Returns:
        True if user has permission to access, False otherwise
    """
    # Layer 1: User is globally active
    if not is_user_active(user_id):
        return False
    
    # Layer 2: User is member of this organization
    if not is_org_member(user_id, org_id):
        return False
    
    # Layer 3: User has required roles
    if not has_role(user_id, org_id, required_roles):
        return False
    
    return True


def is_org_admin(user_id: int, org_id: int) -> bool:
    """Utility function: Check if user is org admin"""
    return can_access(user_id, org_id, ["admin"])


# ============ FastAPI Dependencies ============

from fastapi import HTTPException, status, Header, Depends
from typing import Annotated
from sqlalchemy.orm import Session
from app.core.database import get_db


async def get_current_user(
    authorization: Annotated[str | None, Header()] = None,
    db: Session = Depends(get_db)
) -> dict:
    """FastAPI Dependency: Get current logged-in user
    
    Extract token from Authorization: Bearer <token>, verify and return user info
    If db is provided, queries database; otherwise falls back to in-memory store
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization information"
        )
    
    token = authorization[7:]  # Remove "Bearer " prefix
    
    try:
        payload = decode_token(token)
        user_id = int(payload.get("sub"))
        email = payload.get("email")
        org_contexts = payload.get("orgs", [])
        
        # Verify user is still active - try database first, then in-memory store
        user = None
        if db:
            from app.repositories.db_store import DBStore
            db_store = DBStore(db)
            user = db_store.users.get(user_id)
        
        if not user:
            user = store.users.get(user_id)
        
        if not user or user.account_status != "active":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User inactive"
            )
        
        return {
            "user_id": user_id,
            "email": email,
            "org_contexts": org_contexts
        }
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
