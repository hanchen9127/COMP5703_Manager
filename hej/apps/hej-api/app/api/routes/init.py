"""
Initialization Routes - Internal endpoints for system setup and testing

This module provides endpoints for initializing the system with test data.
These endpoints should only be available in development/testing environments.

Routes:
- POST /init/reset - Clear all data
- POST /init/seed - Initialize with test data
- GET /init/status - Check initialization status
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

# Import initialization functions
from init_data import init_step_1_users_and_organizations, init_step_2_relationships, init_step_3_projects_and_tasks, init_step_4_annotations
from app.core.database import get_db, reset_db, init_db
from app.repositories.memory_store import store
from app.repositories.db_store import DBStore

router = APIRouter(prefix="/init", tags=["initialization"])


@router.post("/reset")
async def reset_database():
    """Clear all data from the database (development only)"""
    try:
        # Reset database and clear all tables
        reset_db()
        # Also clear in-memory store for backward compatibility
        store.users.clear()
        store.organizations.clear()
        store.organization_users.clear()
        store.role_assignments.clear()
        store.organization_policies.clear()
        store.audit_logs.clear()
        
        return {
            "message": "Database reset successfully",
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/seed")
async def seed_test_data(db: Session = Depends(get_db)):
    """Initialize database with test data"""
    try:
        # Reset database to ensure fresh schema (drops and recreates all tables)
        from app.core.database import reset_db, init_db
        reset_db()
        
        # Recreate schema after drop
        init_db()
        
        # Step 1: Create users and organizations
        user_map, org_map = init_step_1_users_and_organizations(db)
        
        # Step 2: Create relationships
        init_step_2_relationships(db, user_map, org_map)
        
        # Step 3: Create projects and tasks
        init_step_3_projects_and_tasks(db, org_map)
        
        # Step 4: Create annotations
        init_step_4_annotations(db, user_map)
        
        # Step 5: Create drafts
        from init_data import init_step_5_drafts
        init_step_5_drafts(db, user_map)
        
        # Step 6: Create predictions
        from init_data import init_step_6_predictions
        init_step_6_predictions(db, user_map)
        
        # Commit database to persist all changes
        db.commit()
        
        # Get counts from database using proper repository methods
        db_store = DBStore(db)
        user_count = len(db_store.users.list_all())
        org_count = len(db_store.organizations.list_all())
        member_count = len(db_store.organization_users.list_all())
        role_count = len(db_store.role_assignments.list_all())
        
        # Count projects and tasks directly from database
        try:
            from app.models.db_models import ProjectDB, TaskDB, TaskItemDB, AnnotationDB, DraftDB, PredictionDB
            project_count = db.query(ProjectDB).count()
            task_count = db.query(TaskDB).count()
            task_item_count = db.query(TaskItemDB).count()
            annotation_count = db.query(AnnotationDB).count()
            draft_count = db.query(DraftDB).count()
            prediction_count = db.query(PredictionDB).count()
        except Exception:
            project_count = 0
            task_count = 0
            task_item_count = 0
            annotation_count = 0
            draft_count = 0
            prediction_count = 0
        
        return {
            "message": "Test data initialized successfully",
            "status": "success",
            "data": {
                "users": user_count,
                "organizations": org_count,
                "memberships": member_count,
                "role_assignments": role_count,
                "projects": project_count,
                "tasks": task_count,
                "task_items": task_item_count,
                "annotations": annotation_count,
                "drafts": draft_count,
                "predictions": prediction_count,
                "test_credentials": {
                    "alice": "alice@example.com / SecurePass1Alice",
                    "bob": "bob@example.com / SecurePass2Bob",
                    "charlie": "charlie@example.com / SecurePass3Charlie"
                }
            }
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/status")
async def initialization_status(db: Session = Depends(get_db)):
    """Get current initialization status"""
    try:
        db_store = DBStore(db)
        user_count = len(db_store.users.list_all())
        org_count = len(db_store.organizations.list_all())
        member_count = len(db_store.organization_users.list_all())
        role_count = len(db_store.role_assignments.list_all())
        policy_count = len(db_store.organization_policies.list_all())
        
        return {
            "status": "initialized" if user_count > 0 else "empty",
            "stats": {
                "users": user_count,
                "organizations": org_count,
                "memberships": member_count,
                "role_assignments": role_count,
                "policies": policy_count
            }
        }
    except Exception as e:
        return {
            "status": "empty",
            "stats": {
                "users": 0,
                "organizations": 0,
                "memberships": 0,
                "role_assignments": 0,
                "policies": 0
            }
        }
