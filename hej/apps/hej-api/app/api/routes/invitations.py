"""
Invitations routes - Manage pending organization invitations.

Handles:
- List pending invitations for current user
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.core.database import get_db
from app.schemas.members import PendingInvitationListResponse
from app.models.db_models import OrganizationUserDB, OrganizationDB, UserDB

router = APIRouter()


@router.get(
    "",
    response_model=PendingInvitationListResponse,
    status_code=200,
    summary="Get Pending Invitations",
    description="Get all pending organization invitations for current user.",
)
async def list_pending_invitations(
    limit: int = Query(100, ge=1, le=200, description="Page size"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PendingInvitationListResponse:
    """
    Get pending invitations for current user.

    - **limit**: Invitations per page (default 100, max 200)
    - **offset**: Pagination offset (default 0)
    - **current_user**: Current logged-in user

    Returns list of organizations that have invited this user (but not yet accepted).
    """
    try:
        user_email = current_user.get("email")
        user_id = current_user.get("user_id")
        
        # Query for pending invitations where this user was invited
        pending_invitations = db.query(OrganizationUserDB, OrganizationDB, UserDB).filter(
            OrganizationUserDB.user_id == user_id,
            OrganizationUserDB.status == "invited"
        ).join(
            OrganizationDB, OrganizationUserDB.organization_id == OrganizationDB.id
        ).join(
            UserDB, OrganizationUserDB.invited_by == UserDB.id
        ).all()
        
        invitations_list = []
        for org_user, org, invited_by_user in pending_invitations:
            invitations_list.append({
                "id": org_user.id,
                "organization_id": org.id,
                "organization_name": org.name,
                "organization_slug": org.slug,
                "invited_email": user_email,
                "invited_at": org_user.invited_at,
                "expires_at": None,  # Optional field, not stored in DB
                "status": org_user.status,
            })
        
        # Apply pagination
        paginated_invitations = invitations_list[offset : offset + limit]
        
        return PendingInvitationListResponse(
            total_count=len(invitations_list),
            invitations=paginated_invitations
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to retrieve invitations: {str(e)}")
