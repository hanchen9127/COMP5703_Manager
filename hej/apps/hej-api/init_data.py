"""
Database Initialization Script
初始化测试数据：users, organizations, organization_users, role_assignments

使用方法:
  python init_data.py           # 增量初始化（跳过已存在的数据）
  python init_data.py --reset   # 强制重置数据库

或在应用启动前调用此脚本初始化测试数据
"""

from datetime import UTC, datetime
from sqlalchemy.orm import Session
import sys

from app.models.admin import (
    User, Organization, OrganizationUser, RoleAssignment,
    AccountStatus, OrganizationUserStatus, RoleKey, RoleScope,
    OrganizationPolicy, DisputeEscalationGate
)
from app.models.db_models import (
    ProjectDB, TaskDB, DataPointerDB, TaskItemDB
)
from app.repositories.db_store import DBStore
from app.services.auth_service import AuthService
from app.core.security import hash_password


def init_step_1_users_and_organizations(db: Session):
    """
    Step 1: 创建基础用户和组织
    Creates:
    - 3 test users (alice, bob, charlie)
    - 2 organizations (Acme Corp, TechStart)
    """
    store = DBStore(db)
    
    print("=" * 80)
    print("STEP 1: Creating Users and Organizations")
    print("=" * 80)
    
    # ===== Create Users =====
    print("\n[Creating Users...]")
    
    users_data = [
        {
            "email": "alice@example.com",
            "password": "SecurePass1Alice",
            "name": "Alice Chen"
        },
        {
            "email": "bob@example.com",
            "password": "SecurePass2Bob",
            "name": "Bob Johnson"
        },
        {
            "email": "charlie@example.com",
            "password": "SecurePass3Charlie",
            "name": "Charlie Davis"
        },
    ]
    
    user_map = {}
    for user_data in users_data:
        # First try to get existing user
        existing_user = store.users.get_by_email(user_data["email"])
        if existing_user:
            # User exists, reuse it
            user_map[user_data["email"]] = existing_user.id
            print(f"  ✓ User already exists: {user_data['email']} (ID: {existing_user.id})")
        else:
            # Create new user
            try:
                user_id = max([u.id for u in store.users.list_all()] or [0]) + 1
                password_hash = hash_password(user_data["password"])
                new_user = User(
                    id=user_id,
                    email=user_data["email"],
                    password_hash=password_hash,
                    name=user_data["name"],
                    account_status=AccountStatus.ACTIVE,
                    two_factor_enabled=False,
                    created_at=datetime.now(UTC),
                    updated_at=datetime.now(UTC)
                )
                store.users[user_id] = new_user
                user_map[user_data["email"]] = user_id
                print(f"  ✓ Created user: {user_data['email']} (ID: {user_id})")
            except Exception as e:
                print(f"  ✗ Failed to create user {user_data['email']}: {str(e)}")
    
    # ===== Create Organizations =====
    print("\n[Creating Organizations...]")
    
    orgs_data = [
        {
            "name": "Acme Corporation",
            "slug": "acme-corp",
            "description": "Leading innovation and technology company"
        },
        {
            "name": "TechStart Inc",
            "slug": "techstart-inc",
            "description": "Emerging technology startup"
        },
    ]
    
    org_map = {}
    alice_id = user_map.get("alice@example.com")
    
    for org_data in orgs_data:
        # First check if org already exists by name or slug
        existing_org = None
        for o in store.organizations.list_all():
            if o.name == org_data["name"] or (hasattr(o, 'slug') and o.slug == org_data["slug"]):
                existing_org = o
                break
        
        if existing_org:
            # Org exists, reuse it
            org_map[org_data["slug"]] = existing_org.id
            print(f"  ✓ Organization already exists: {org_data['name']} (ID: {existing_org.id})")
        else:
            # Create new organization
            existing_ids = []
            for o in store.organizations.list_all():
                try:
                    if isinstance(o.id, str):
                        # Try to extract number from string like "org_123"
                        if o.id.startswith("org_"):
                            continue  # Skip old format IDs
                    else:
                        existing_ids.append(int(o.id))
                except (ValueError, AttributeError):
                    pass
            
            org_id = max(existing_ids or [0]) + 1
            org = Organization(
                id=org_id,
                name=org_data["name"],
                slug=org_data["slug"],
                description=org_data["description"],
                status="active",
                created_at=datetime.now(UTC),
                updated_at=datetime.now(UTC)
            )
            store.organizations[org_id] = org
            org_map[org_data["slug"]] = org_id
            
            # Create default policy (use alice_id if available, else None)
            policy_id = max([p.id for p in store.organization_policies.list_all()] or [0]) + 1
            policy = OrganizationPolicy(
                id=policy_id,
                organization_id=org_id,
                membership_approval_required=False,
                review_dual_sign_off=False,
                review_auto_escalate_disagreement=False,
                dispute_escalation_gate=DisputeEscalationGate.NONE,
                dispute_escalation_threshold=100,
                export_provenance_required=True,
                export_retention_days=365,
                annotation_mode="human_first",
                updated_by=alice_id or 1  # Use alice_id if available, else fallback to 1
            )
            store.organization_policies[org_id] = policy
            
            print(f"  ✓ Created organization: {org_data['name']} (ID: {org_id})")
    
    print("\n[Step 1 Summary]")
    print(f"  Total users created: {len(user_map)}")
    print(f"  Total organizations created: {len(org_map)}")
    
    return user_map, org_map


def init_step_2_relationships(db: Session, user_map, org_map):
    """
    Step 2: 补充关系数据
    - alice: admin in acme-corp, admin in techstart-inc
    - bob: member in acme-corp (invited by alice)
    - charlie: member in techstart-inc (invited by alice)
    
    Creates:
    - organization_users (memberships)
    - role_assignments (roles)
    """
    store = DBStore(db)
    
    print("\n" + "=" * 80)
    print("STEP 2: Creating Relationships (organization_users, role_assignments)")
    print("=" * 80)
    
    alice_id = user_map.get("alice@example.com")
    bob_id = user_map.get("bob@example.com")
    charlie_id = user_map.get("charlie@example.com")
    
    acme_org_id = org_map.get("acme-corp")
    techstart_org_id = org_map.get("techstart-inc")
    
    if not all([alice_id, bob_id, charlie_id, acme_org_id, techstart_org_id]):
        print("❌ Error: Missing required IDs. Cannot create relationships.")
        return
    
    # ===== Create organization_users =====
    print("\n[Creating Organization Memberships...]")
    
    memberships = [
        # Alice is founder of both orgs
        {
            "user_id": alice_id,
            "org_id": acme_org_id,
            "status": OrganizationUserStatus.ACTIVE,
            "invited_by": alice_id,
            "note": "Founder"
        },
        {
            "user_id": alice_id,
            "org_id": techstart_org_id,
            "status": OrganizationUserStatus.ACTIVE,
            "invited_by": alice_id,
            "note": "Founder"
        },
        # Bob is member of Acme
        {
            "user_id": bob_id,
            "org_id": acme_org_id,
            "status": OrganizationUserStatus.ACTIVE,
            "invited_by": alice_id,
            "note": "Invited by Alice"
        },
        # Charlie is member of TechStart
        {
            "user_id": charlie_id,
            "org_id": techstart_org_id,
            "status": OrganizationUserStatus.ACTIVE,
            "invited_by": alice_id,
            "note": "Invited by Alice"
        },
    ]
    
    for membership in memberships:
        # Check if this membership already exists
        existing_membership = None
        for ou in store.organization_users.list_all():
            if ou.user_id == membership["user_id"] and ou.organization_id == membership["org_id"]:
                existing_membership = ou
                break
        
        if existing_membership:
            user_email = next((e for e, uid in user_map.items() if uid == membership["user_id"]), "unknown")
            org_name = next((name for name, oid in org_map.items() if oid == membership["org_id"]), "unknown")
            print(f"  ✓ Membership already exists: {user_email} in {org_name}")
        else:
            ou_id = max([ou.id for ou in store.organization_users.list_all()] or [0]) + 1
            org_user = OrganizationUser(
                id=ou_id,
                user_id=membership["user_id"],
                organization_id=membership["org_id"],
                status=membership["status"],
                invited_at=datetime.now(UTC),
                invited_by=membership["invited_by"],
                accepted_at=datetime.now(UTC),
                created_at=datetime.now(UTC),
                updated_at=datetime.now(UTC)
            )
            store.organization_users[ou_id] = org_user
            user_email = next((e for e, uid in user_map.items() if uid == membership["user_id"]), "unknown")
            org_name = next((name for name, oid in org_map.items() if oid == membership["org_id"]), "unknown")
            print(f"  ✓ Added {user_email} to {org_name} ({membership['note']})")
    
    # ===== Create role_assignments =====
    print("\n[Creating Role Assignments...]")
    
    role_assignments = [
        # Alice: admin in both orgs
        {
            "user_id": alice_id,
            "org_id": acme_org_id,
            "role_key": RoleKey.ADMIN,
            "role_name": "Administrator",
            "granted_by": alice_id,
            "note": "Organization Admin"
        },
        {
            "user_id": alice_id,
            "org_id": techstart_org_id,
            "role_key": RoleKey.ADMIN,
            "role_name": "Administrator",
            "granted_by": alice_id,
            "note": "Organization Admin"
        },
        # Bob: reviewer in Acme
        {
            "user_id": bob_id,
            "org_id": acme_org_id,
            "role_key": RoleKey.REVIEWER,
            "role_name": "Reviewer",
            "granted_by": alice_id,
            "note": "Project Reviewer"
        },
        # Charlie: annotator in TechStart
        {
            "user_id": charlie_id,
            "org_id": techstart_org_id,
            "role_key": RoleKey.ANNOTATOR,
            "role_name": "Annotator",
            "granted_by": alice_id,
            "note": "Data Annotator"
        },
    ]
    
    for assignment in role_assignments:
        # Check if this role assignment already exists
        existing_role = None
        for r in store.role_assignments.list_all():
            if (r.user_id == assignment["user_id"] and 
                r.organization_id == assignment["org_id"] and
                r.project_id is None and
                r.role_key == assignment["role_key"]):
                existing_role = r
                break
        
        if existing_role:
            user_email = next((e for e, uid in user_map.items() if uid == assignment["user_id"]), "unknown")
            org_name = next((name for name, oid in org_map.items() if oid == assignment["org_id"]), "unknown")
            print(f"  ✓ Role assignment already exists: {user_email} as {assignment['role_name']} in {org_name}")
        else:
            role_id = max([r.id for r in store.role_assignments.list_all()] or [0]) + 1
            role = RoleAssignment(
                id=role_id,
                user_id=assignment["user_id"],
                organization_id=assignment["org_id"],
                project_id=None,
                role_key=assignment["role_key"],
                role_name=assignment["role_name"],
                scope=RoleScope.ORGANIZATION,
                granted_at=datetime.now(UTC),
                granted_by=assignment["granted_by"],
                created_at=datetime.now(UTC),
                updated_at=datetime.now(UTC)
            )
            store.role_assignments[role_id] = role
            user_email = next((e for e, uid in user_map.items() if uid == assignment["user_id"]), "unknown")
            org_name = next((name for name, oid in org_map.items() if oid == assignment["org_id"]), "unknown")
            print(f"  ✓ Assigned {assignment['role_name']} to {user_email} in {org_name}")
    
    print("\n[Step 2 Summary]")
    print(f"  Total memberships created: {len(memberships)}")
    print(f"  Total role assignments created: {len(role_assignments)}")


def init_step_3_projects_and_tasks(db: Session, org_map):
    """
    Step 3: 创建项目和任务
    Creates:
    - 2 projects (Image Annotation, Text Classification)
    - 3 tasks per project
    - 10+ task items per task
    - 2+ data pointers per task
    """
    store = DBStore(db)
    
    print("\n" + "=" * 80)
    print("STEP 3: Creating Projects, Tasks, and Data")
    print("=" * 80)
    
    acme_org_id = org_map.get("acme-corp")
    techstart_org_id = org_map.get("techstart-inc")
    
    if not acme_org_id:
        print("❌ Error: Missing organization ID. Cannot create projects.")
        return
    
    # ===== Create Projects =====
    print("\n[Creating Projects...]")
    
    projects_data = [
        {
            "org_id": acme_org_id,
            "name": "Image Annotation Project",
            "description": "Annotate and classify object detection images",
            "governance_model": "standard",
            "annotation_mode": "human_first",
            "task_type": "image"
        },
        {
            "org_id": acme_org_id,
            "name": "Text Classification Project",
            "description": "Classify customer feedback into sentiment categories",
            "governance_model": "dual_signoff",
            "annotation_mode": "ai_assisted",
            "task_type": "text"
        },
    ]
    
    project_map = {}
    for i, proj_data in enumerate(projects_data, 1):
        project_id = f"proj_{proj_data['org_id']}_{i}"
        
        # Check if project already exists
        existing_project = db.query(ProjectDB).filter(ProjectDB.id == project_id).first()
        if existing_project:
            print(f"  ✓ Project already exists: {proj_data['name']} (ID: {project_id})")
            project_map[proj_data["name"]] = project_id
            continue
        
        project = ProjectDB(
            id=project_id,
            organization_id=str(proj_data["org_id"]),
            name=proj_data["name"],
            description=proj_data["description"],
            governance_model=proj_data["governance_model"],
            status="active",
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC)
        )
        db.add(project)
        db.flush()  # Ensure project is persisted before creating tasks
        project_map[proj_data["name"]] = project_id
        print(f"  ✓ Created project: {proj_data['name']} (ID: {project_id})")
    
    # ===== Create Tasks =====
    print("\n[Creating Tasks...]")
    
    task_counter = 0
    for project_name, project_id in project_map.items():
        for task_num in range(1, 3):  # 2 tasks per project
            task_counter += 1
            task_id = f"task_{project_id}_{task_num}"
            
            # Check if task already exists
            existing_task = db.query(TaskDB).filter(TaskDB.id == task_id).first()
            if existing_task:
                print(f"  ✓ Task already exists: {task_id}")
                continue
            
            if "Image" in project_name:
                title = f"Image Object Detection #{task_num}"
                question = "Identify and classify all objects in the image. Label bounding boxes and object categories."
                schema = "image_detection_schema_v1"
            else:
                title = f"Text Sentiment Classification #{task_num}"
                question = "Classify the customer feedback sentiment: positive, negative, or neutral. Provide explanation."
                schema = "sentiment_classification_schema_v1"
            
            task = TaskDB(
                id=task_id,
                project_id=project_id,
                title=title,
                description=f"Task {task_num} under {project_name}",
                judgment_question=question,
                task_type="image" if "Image" in project_name else "text",
                annotation_mode="human_first" if "Image" in project_name else "ai_assisted",
                label_schema_ref=schema,
                review_policy_ref="review_dual_signoff_v1",
                dispute_policy_ref="dispute_escalation_policy_v1",
                export_policy_ref="export_authoritative_with_provenance_v1",
                status="ready",
                created_at=datetime.now(UTC),
                updated_at=datetime.now(UTC)
            )
            db.add(task)
            db.flush()
            
            # ===== Create Data Pointers =====
            for dp_num in range(1, 3):  # 2 data pointers per task
                dp_id = f"dp_{task_id}_{dp_num}"
                if "Image" in project_name:
                    location = f"s3://data-bucket/images/task{task_num}/image_{dp_num}.jpg"
                else:
                    location = f"postgres://feedback_db/reviews/task{task_num}_feedback_{dp_num}"
                
                data_pointer = DataPointerDB(
                    id=dp_id,
                    task_id=task_id,
                    location_ref=location,
                    access_policy_ref="access_policy_v1",
                    source_version_ref="v1.0",
                    created_at=datetime.now(UTC)
                )
                db.add(data_pointer)
                db.flush()
                
                # ===== Create Task Items =====
                for item_num in range(1, 6):  # 5 task items per data pointer
                    item_id = f"item_{dp_id}_{item_num}"
                    if "Image" in project_name:
                        ext_ref = f"image_{dp_num}_object_{item_num}"
                        payload = {"width": 640, "height": 480, "object_count": item_num}
                    else:
                        ext_ref = f"review_{dp_num}_comment_{item_num}"
                        payload = {"review_id": f"rev_{item_num}", "char_count": 100 + item_num * 10}
                    
                    task_item = TaskItemDB(
                        id=item_id,
                        task_id=task_id,
                        data_pointer_id=dp_id,
                        external_item_ref=ext_ref,
                        status="pending",
                        payload_preview=payload,
                        created_at=datetime.now(UTC),
                        updated_at=datetime.now(UTC)
                    )
                    db.add(task_item)
            
            print(f"  ✓ Created task: {title} (ID: {task_id})")
    
    # ===== Bridge-friendly image demo task =====
    # Metadata-only demo image items.
    # If you need real image rendering, use upload-images or add demo image assets.
    # Add one stable image task so the demo can exercise the image annotation
    # contract without depending on uploaded files or external assets.
    bridge_project_id = project_map.get("Image Annotation Project")
    if bridge_project_id:
        bridge_task_id = "task_proj_1_1_image_1"
        existing_bridge_task = db.query(TaskDB).filter(TaskDB.id == bridge_task_id).first()
        if existing_bridge_task:
            print(f"  ✓ Bridge-friendly image task already exists: {bridge_task_id}")
        else:
            bridge_task = TaskDB(
                id=bridge_task_id,
                project_id=bridge_project_id,
                title="Image Annotation Bridge Demo",
                description="Bridge-friendly image annotation demo task",
                judgment_question="Identify and label objects in the image.",
                task_type="image",
                annotation_mode="human_first",
                label_schema_ref="image_detection_schema_v1",
                review_policy_ref="review_dual_signoff_v1",
                dispute_policy_ref="dispute_escalation_policy_v1",
                export_policy_ref="export_authoritative_with_provenance_v1",
                status="ready",
                created_at=datetime.now(UTC),
                updated_at=datetime.now(UTC)
            )
            db.add(bridge_task)
            db.flush()

            bridge_items = [
                {
                    "item_id": "item_task_proj_1_1_image_1_1",
                    "dp_id": "dp_task_proj_1_1_image_1_1",
                    "external_ref": "bridge_demo_image_001.jpg",
                    "filename": "bridge_demo_image_001.jpg",
                    "payload": {
                        "type": "image",
                        "url": "/api/v1/uploads/images/bridge_demo_image_001.jpg",
                        "filename": "bridge_demo_image_001.jpg",
                        "mime_type": "image/jpeg",
                        "size": 0,
                        "uploaded_at": datetime.now(UTC).isoformat(),
                    },
                    "location": "/api/v1/uploads/images/bridge_demo_image_001.jpg",
                },
                {
                    "item_id": "item_task_proj_1_1_image_1_2",
                    "dp_id": "dp_task_proj_1_1_image_1_2",
                    "external_ref": "bridge_demo_image_002.png",
                    "filename": "bridge_demo_image_002.png",
                    "payload": {
                        "type": "image",
                        "url": "/api/v1/uploads/images/bridge_demo_image_002.png",
                        "filename": "bridge_demo_image_002.png",
                        "mime_type": "image/png",
                        "size": 0,
                        "uploaded_at": datetime.now(UTC).isoformat(),
                    },
                    "location": "/api/v1/uploads/images/bridge_demo_image_002.png",
                },
            ]

            for bridge_item in bridge_items:
                existing_dp = db.query(DataPointerDB).filter(DataPointerDB.id == bridge_item["dp_id"]).first()
                if not existing_dp:
                    data_pointer = DataPointerDB(
                        id=bridge_item["dp_id"],
                        task_id=bridge_task_id,
                        location_ref=bridge_item["location"],
                        access_policy_ref="access_policy_v1",
                        source_version_ref="v1.0",
                        created_at=datetime.now(UTC)
                    )
                    db.add(data_pointer)
                    db.flush()
                else:
                    data_pointer = existing_dp

                existing_item = db.query(TaskItemDB).filter(TaskItemDB.id == bridge_item["item_id"]).first()
                if not existing_item:
                    task_item = TaskItemDB(
                        id=bridge_item["item_id"],
                        task_id=bridge_task_id,
                        data_pointer_id=bridge_item["dp_id"],
                        external_item_ref=bridge_item["external_ref"],
                        status="pending",
                        payload_preview=bridge_item["payload"],
                        created_at=datetime.now(UTC),
                        updated_at=datetime.now(UTC)
                    )
                    db.add(task_item)

            print(f"  ✓ Created bridge-friendly image task: {bridge_task_id}")
            print("  ✓ Created bridge-friendly image task items: item_task_proj_1_1_image_1_1, item_task_proj_1_1_image_1_2")

    print("\n[Step 3 Summary]")
    print(f"  Total projects created: {len(project_map)}")
    print(f"  Total tasks created: {task_counter}")


def init_step_4_annotations(db: Session, user_map):
    """
    Step 4: 创建标注数据
    Creates:
    - 2+ annotations per task item
    - Different annotation types (text, bbox, classification)
    """
    print("\n" + "=" * 80)
    print("STEP 4: Creating Annotations")
    print("=" * 80)
    
    from app.models.db_models import AnnotationDB, TaskItemDB
    
    # Get all task items
    task_items = db.query(TaskItemDB).all()
    
    if not task_items:
        print("  ⚠️  No task items found. Skipping annotation creation.")
        return
    
    alice_id = user_map.get("alice@example.com")
    bob_id = user_map.get("bob@example.com")
    creator_ids = [alice_id, bob_id] if bob_id else [alice_id]
    
    annotation_count = 0
    for idx, task_item in enumerate(task_items[:10]):  # Create annotations for first 10 items
        # Create 2 annotations per task item
        for ann_num in range(1, 3):
            annotation_id = f"ann_{task_item.id}_{ann_num}"
            
            # Check if annotation already exists
            existing_ann = db.query(AnnotationDB).filter(AnnotationDB.id == annotation_id).first()
            if existing_ann:
                continue
            
            # Vary annotation data based on type
            if "image" in task_item.external_item_ref.lower():
                annotation_type = "bbox"
                # Multiple bbox annotations with color labels
                annotation_data = {
                    "bboxes": {
                        "1": {
                            "x": 100,
                            "y": 150,
                            "width": 200,
                            "height": 200,
                            "label": "person"
                        },
                        "2": {
                            "x": 350,
                            "y": 280,
                            "width": 150,
                            "height": 180,
                            "label": "car"
                        },
                        "3": {
                            "x": 500,
                            "y": 100,
                            "width": 200,
                            "height": 250,
                            "label": "building"
                        }
                    },
                    "labels": {
                        "person": {"color": "#FF6B6B"},
                        "car": {"color": "#4ECDC4"},
                        "building": {"color": "#FFA07A"}
                    }
                }
                confidence = 90
            else:
                annotation_type = "classification"
                sentiments = ["positive", "negative", "neutral"]
                annotation_data = {
                    "type": "sentiment",
                    "sentiment": sentiments[ann_num % 3],
                    "explanation": f"This feedback is {sentiments[ann_num % 3]} - annotation #{ann_num}",
                }
                confidence = 80 + ann_num * 3
            
            creator_id = creator_ids[ann_num % len(creator_ids)]
            # Different creator/approver for variety
            approver_id = creator_ids[(ann_num + 1) % len(creator_ids)]
            
            annotation = AnnotationDB(
                id=annotation_id,
                task_item_id=task_item.id,
                annotation_type=annotation_type,
                annotation_data=annotation_data,
                confidence=confidence,
                version=1,  # NEW: Initial version
                is_latest=True,  # NEW: Mark as latest
                created_by=creator_id,  # Who created it
                confirmed_by=approver_id,  # NEW: Who confirmed it
                created_at=datetime.now(UTC),
                confirmed_at=datetime.now(UTC),  # NEW: When confirmed
                updated_at=datetime.now(UTC)
            )
            db.add(annotation)
            annotation_count += 1
    
    db.flush()
    print(f"  ✓ Created {annotation_count} annotations")
    print("\n[Step 4 Summary]")
    print(f"  Total annotations created: {annotation_count}")


def init_step_5_drafts(db: Session, user_map):
    """
    Step 5: 创建草稿数据
    Creates:
    - 1+ drafts per task item
    - Different draft statuses (pending, approved)
    """
    print("\n" + "=" * 80)
    print("STEP 5: Creating Drafts")
    print("=" * 80)
    
    from app.models.db_models import DraftDB, TaskItemDB
    
    # Get all task items
    task_items = db.query(TaskItemDB).all()
    
    if not task_items:
        print("  ⚠️  No task items found. Skipping draft creation.")
        return
    
    alice_id = user_map.get("alice@example.com")
    bob_id = user_map.get("bob@example.com")
    creator_ids = [alice_id, bob_id] if bob_id else [alice_id]
    
    draft_count = 0
    statuses = ["pending", "approved"]
    
    for idx, task_item in enumerate(task_items[:10]):  # Create drafts for first 10 items
        # Create 1-2 drafts per task item
        for draft_num in range(1, 2):
            draft_id = f"draft_{task_item.id}_{draft_num}"
            
            # Check if draft already exists
            existing_draft = db.query(DraftDB).filter(DraftDB.id == draft_id).first()
            if existing_draft:
                continue
            
            # Determine annotation type and draft data based on task item type
            if "image" in task_item.external_item_ref.lower():
                annotation_type = "bbox"
                # Multiple bbox annotations with color labels
                draft_data = {
                    "bboxes": {
                        "1": {
                            "x": 110,
                            "y": 160,
                            "width": 210,
                            "height": 210,
                            "label": "person"
                        },
                        "2": {
                            "x": 360,
                            "y": 290,
                            "width": 160,
                            "height": 190,
                            "label": "vehicle"
                        }
                    },
                    "labels": {
                        "person": {"color": "#FF6B6B"},
                        "vehicle": {"color": "#4ECDC4"}
                    }
                }
            else:
                annotation_type = "classification"
                draft_data = {
                    "type": "sentiment_refinement",
                    "refined_sentiment": "positive" if draft_num % 2 == 0 else "negative",
                    "notes": f"Refined sentiment classification #{draft_num}",
                    "confidence_adjustment": 90 + draft_num * 2
                }
            
            status = statuses[draft_num % len(statuses)]
            creator_id = creator_ids[draft_num % len(creator_ids)]
            
            draft = DraftDB(
                id=draft_id,
                task_item_id=task_item.id,
                annotation_type=annotation_type,  # NEW: Add annotation type
                status=status,
                draft_data=draft_data,
                created_by=creator_id,
                created_at=datetime.now(UTC),
                updated_at=datetime.now(UTC)
            )
            db.add(draft)
            draft_count += 1
    
    db.flush()
    print(f"  ✓ Created {draft_count} drafts")
    print("\n[Step 5 Summary]")
    print(f"  Total drafts created: {draft_count}")


def init_step_6_predictions(db: Session, user_map):
    """
    Step 6: 创建预测数据
    Creates:
    - 1-2 predictions per task item
    - Different prediction types with model versions
    """
    print("\n" + "=" * 80)
    print("STEP 6: Creating Predictions")
    print("=" * 80)
    
    from app.models.db_models import PredictionDB, TaskItemDB
    
    # Get all task items
    task_items = db.query(TaskItemDB).all()
    
    if not task_items:
        print("  ⚠️  No task items found. Skipping prediction creation.")
        return
    
    alice_id = user_map.get("alice@example.com")
    bob_id = user_map.get("bob@example.com")
    creator_ids = [alice_id, bob_id] if bob_id else [alice_id]
    
    prediction_count = 0
    model_versions = ["v1.0", "v2.0", "v3.0"]
    
    for idx, task_item in enumerate(task_items[:10]):  # Create predictions for first 10 items
        # Create 1-2 predictions per task item
        for pred_num in range(1, 3):
            prediction_id = f"pred_{task_item.id}_{pred_num}"
            
            # Check if prediction already exists
            existing_pred = db.query(PredictionDB).filter(PredictionDB.id == prediction_id).first()
            if existing_pred:
                continue
            
            # Vary prediction data based on task item type
            if "image" in task_item.external_item_ref.lower():
                prediction_type = "object_detection"
                prediction_data = {
                    "detected_objects": [
                        {
                            "class": "person",
                            "confidence": 0.95,
                            "bbox": {"x": 100, "y": 120, "w": 200, "h": 300}
                        },
                        {
                            "class": "dog",
                            "confidence": 0.87,
                            "bbox": {"x": 50, "y": 200, "w": 150, "h": 150}
                        }
                    ]
                }
                confidence = 92
            else:
                prediction_type = "sentiment_analysis"
                sentiments = ["positive", "negative", "neutral", "mixed"]
                prediction_data = {
                    "sentiment": sentiments[pred_num % len(sentiments)],
                    "scores": {
                        "positive": 0.6 + pred_num * 0.1,
                        "negative": 0.2,
                        "neutral": 0.2
                    },
                    "entities": ["feedback", "product"]
                }
                confidence = 85 + pred_num * 3
            
            model_version = model_versions[pred_num % len(model_versions)]
            creator_id = creator_ids[pred_num % len(creator_ids)]
            
            prediction = PredictionDB(
                id=prediction_id,
                task_item_id=task_item.id,
                prediction_type=prediction_type,
                prediction_data=prediction_data,
                confidence=confidence,
                model_version=model_version,
                created_by=creator_id,
                created_at=datetime.now(UTC),
                updated_at=datetime.now(UTC)
            )
            db.add(prediction)
            prediction_count += 1
    
    db.flush()
    print(f"  ✓ Created {prediction_count} predictions")
    print("\n[Step 6 Summary]")
    print(f"  Total predictions created: {prediction_count}")


def main():
    """Main initialization routine"""
    # Check for --reset flag
    reset_mode = "--reset" in sys.argv
    
    print("\n")
    print("╔" + "=" * 78 + "╗")
    print("║" + " Database Initialization Script ".center(78) + "║")
    print("║" + " HEJ Admin System - Test Data Setup ".center(78) + "║")
    if reset_mode:
        print("║" + " [RESET MODE - All data will be cleared] ".center(78) + "║")
    print("╚" + "=" * 78 + "╝")
    
    try:
        # Initialize database tables
        from app.core.database import init_db, SessionLocal, engine
        from sqlalchemy import inspect
        
        # Check if reset mode
        if reset_mode:
            print("\n⚠️  RESET MODE: Dropping all tables and recreating...")
            # Get all table names and drop them
            from sqlalchemy import text
            inspector = inspect(engine)
            table_names = inspector.get_table_names()
            
            if table_names:
                with engine.begin() as connection:
                    for table_name in table_names:
                        connection.execute(text(f"DROP TABLE IF EXISTS {table_name}"))
                print(f"  ✓ Dropped {len(table_names)} tables")
        
        init_db()
        
        # Get database session
        db = SessionLocal()
        
        try:
            # Step 1
            user_map, org_map = init_step_1_users_and_organizations(db)
            
            # Step 2
            from app.repositories.db_store import DBStore
            store = DBStore(db)
            init_step_2_relationships(db, user_map, org_map)
            
            # Step 3
            init_step_3_projects_and_tasks(db, org_map)
            
            # Step 4
            init_step_4_annotations(db, user_map)
            
            # Step 5
            init_step_5_drafts(db, user_map)
            
            # Step 6
            init_step_6_predictions(db, user_map)
            
            # Commit all changes
            db.commit()
            
            # Summary
            print("\n" + "=" * 80)
            print("✅ Initialization Complete!")
            print("=" * 80)
            
            print("\n[Test Credentials]")
            print("  Alice (Admin)     : alice@example.com / SecurePass1Alice")
            print("  Bob (Reviewer)    : bob@example.com / SecurePass2Bob")
            print("  Charlie (Annotator): charlie@example.com / SecurePass3Charlie")
            
            print("\n[Quick Stats]")
            # Note: store.users, etc. are repositories, not collections
            # Statistics are printed in each step instead
        finally:
            db.close()
        
    except Exception as e:
        print(f"\n❌ Initialization failed: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
