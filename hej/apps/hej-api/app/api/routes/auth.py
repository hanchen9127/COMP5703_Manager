"""
Authentication Routes - API endpoints for /auth

Includes:
1. POST /auth/register - User registration
2. POST /auth/login - User login
3. POST /auth/refresh - Refresh token
"""

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.schemas.auth import (
    UserRegisterRequest, UserRegisterResponse,
    UserLoginRequest, UserLoginResponse,
    TokenRefreshRequest, TokenRefreshResponse
)
from app.services.auth_service import AuthService
from app.core.database import get_db


router = APIRouter(tags=["authentication"])


@router.post("/register", response_model=UserRegisterResponse)
async def register(request: UserRegisterRequest, db: Session = Depends(get_db)):
    """User registration
    
    Request body:
    - email: Email address (globally unique)
    - password: Password (at least 8 characters, must contain uppercase and lowercase)
    - name: Display name (optional)
    
    Returns:
    - user_id: ID of the new user
    - email: Email address
    - message: Success message
    """
    try:
        result = AuthService.register(
            email=request.email,
            password=request.password,
            name=request.name,
            db=db
        )
        return UserRegisterResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Registration failed: {str(e)}"
        )


@router.post("/login", response_model=UserLoginResponse)
async def login(request: UserLoginRequest, db: Session = Depends(get_db)):
    """User login
    
    Request body:
    - email: Email address
    - password: Password
    
    Returns:
    - access_token: JWT token (for subsequent requests)
    - token_type: "bearer"
    - user: User information
    - organizations: All organizations the user belongs to with their permissions
    - message: Success message
    
    Using access_token:
    Add to the header in subsequent API requests:
    Authorization: Bearer <access_token>
    """
    try:
        result = AuthService.login(
            email=request.email,
            password=request.password,
            db=db
        )
        return UserLoginResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"Login error: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Login failed: {str(e)}"
        )


@router.post("/refresh", response_model=TokenRefreshResponse)
async def refresh_token(request: TokenRefreshRequest):
    """Refresh access token
    
    When the access_token expires, use refresh_token to obtain a new access_token
    
    Request body:
    - refresh_token: The refresh_token obtained from previous login
    
    Returns:
    - access_token: New JWT token
    - token_type: "bearer"
    """
    # TODO: Implement refresh token logic
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Refresh token functionality not yet implemented"
    )
