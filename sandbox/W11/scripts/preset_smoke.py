"""Smoke-test every project-policy preset through the route functions, on a seeded throwaway database.

For each preset: create a project from it as Kevin, one classification task with two items, then
  item 1 - the happy path: Charlie answers, reviewers accept until the item stops waiting for review,
           an expert confirms if the posture holds it at the gate; expect canonicalized.
  item 2 - the disagreement path: Dana answers; with two approvals Bob accepts and Fiona rejects (a split),
           with one approval Bob escalates; then see what the posture does with it, and let an expert decide.
Run: DATABASE_URL=sqlite:///<seeded db> uv run python preset_smoke.py   (cwd: hej/apps/hej-api)
"""
import sys
import traceback

sys.path.insert(0, r"D:\COMP5703_Capstone\hej\apps\hej-api")

from fastapi import HTTPException  # noqa: E402

from app.api.routes.organizations import create_project  # noqa: E402
from app.api.routes.projects import create_task  # noqa: E402
from app.api.routes.tasks import activate_task, register_dataset  # noqa: E402
from app.api.routes.drafts import create_draft, submit_draft  # noqa: E402
from app.api.routes.review_actions import (  # noqa: E402
    submit_task_item_review_action,
    open_pending_annotation_dispute,
    decide_annotation_dispute,
)
from app.api.routes.reconciliations import decide_item_reconciliation  # noqa: E402
from app.core.database import SessionLocal  # noqa: E402
from app.core.project_policy_templates import list_project_policy_templates  # noqa: E402
from app.models.db_models import (  # noqa: E402
    AnnotationDisputeDB,
    ItemReconciliationDB,
    OrganizationDB,
    ReviewDisagreementDB,
    TaskItemDB,
    UserDB,
)
from app.schemas.drafts import DraftCreate, DraftSubmit  # noqa: E402
from app.schemas.project_policies import ProjectPolicyInput  # noqa: E402
from app.schemas.projects import ProjectCreate  # noqa: E402
from app.schemas.review_actions import (  # noqa: E402
    AnnotationDisputeDecisionRequest,
    AnnotationDisputeOpenRequest,
    ItemReconciliationDecisionRequest,
    TaskItemReviewActionRequest,
)
from app.schemas.tasks import DatasetItemInput, DatasetRegistrationRequest, TaskCreate  # noqa: E402
from seed_test_projects import caller, location_ref  # noqa: E402

WHY = "Preset smoke test."
LABELS = {"politics": "Government and policy.", "sport": "Matches and players."}
REVIEWERS = ["Bob", "Fiona", "George", "Ivan"]


def main() -> None:
    db = SessionLocal()
    users = {u.email.split("@")[0].capitalize(): u.id for u in db.query(UserDB).all()}
    acme = db.query(OrganizationDB).filter_by(slug="acme-corp").one().id
    who = lambda name: caller(db, users[name])  # noqa: E731
    results = []

    for t in list_project_policy_templates():
        row = {"preset": t.id, "title": t.title, "superseded": bool(t.superseded_by)}
        try:
            snap = t.policy_snapshot()
            project = create_project(
                org_id=acme,
                payload=ProjectCreate(
                    name=f"Smoke: {t.id}",
                    governance_model=t.governance_model.value,
                    policy=ProjectPolicyInput(**snap),
                ),
                current_user=who("Kevin"),
                db=db,
            )
            row["create"] = "ok"
        except HTTPException as e:
            row["create"] = f"refused {e.status_code}: {str(e.detail)[:90]}"
            results.append(row)
            db.rollback()
            continue

        try:
            task = create_task(
                project.id,
                TaskCreate(
                    title="Smoke task",
                    task_instruction="Pick the topic.",
                    task_class="annotation",
                    task_type="text",
                    annotation_type="classification",
                    annotation_mode="human_first",
                    required_annotators=1,
                    text_span_label_options=list(LABELS),
                    label_definitions=dict(LABELS),
                ),
                current_user=who("Kevin"),
                db=db,
            )
            refs = [f"smoke-{t.id}-1", f"smoke-{t.id}-2"]
            reg = register_dataset(
                task.id,
                DatasetRegistrationRequest(items=[
                    DatasetItemInput(external_item_ref=r, location_ref=location_ref("a1-01-untouched"), payload_preview={"text": "Parliament passes the housing bill"})
                    for r in refs
                ]),
                current_user=who("Kevin"),
                db=db,
            )
            items = [i.id for i in reg.created_task_items]
            activate_task(project.id, task.id, current_user=who("Kevin"), db=db)

            def answer(name, item_id, label):
                d = create_draft(item_id, DraftCreate(draft_data={"label": label}), current_user=who(name), db=db)
                return submit_draft(d.id, DraftSubmit(), current_user=who(name), db=db)["annotation_id"]

            def review(name, item_id, ann, action):
                body = {"action": action, "annotation_id": ann, "justification": WHY}
                if action in {"reject", "adjust", "revise"}:
                    body["feedback"] = "Check the label."
                return submit_task_item_review_action(task.id, item_id, TaskItemReviewActionRequest(**body), current_user=who(name), db=db)

            def status(item_id):
                db.expire_all()
                return db.get(TaskItemDB, item_id).status

            def open_case(item_id):
                db.expire_all()
                return db.query(ItemReconciliationDB).filter_by(task_item_id=item_id, status="open").one_or_none()

            def open_dispute(item_id):
                db.expire_all()
                q = db.query(AnnotationDisputeDB)
                col = "task_item_id" if hasattr(AnnotationDisputeDB, "task_item_id") else "item_id"
                return q.filter(getattr(AnnotationDisputeDB, col) == item_id).filter(AnnotationDisputeDB.status != "resolved").one_or_none()

            # Item 1: the happy path.
            steps = []
            ann = answer("Charlie", items[0], "politics")
            for name in REVIEWERS:
                res = review(name, items[0], ann, "accept")
                steps.append(f"{name} accept->{res.next_ui_status}")
                if res.next_ui_status not in ("pending_second_review", "review", "submitted"):
                    break
            case = open_case(items[0])
            if case is not None:
                steps.append(f"held for expert ({case.trigger_type})")
                r = decide_item_reconciliation(task.id, case.id, ItemReconciliationDecisionRequest(decision="choose_one", justification=WHY, selected_annotation_id=ann), current_user=who("Hannah"), db=db)
                steps.append(f"Hannah confirms->{r.next_item_status}")
            row["happy"] = f"{status(items[0])}  [{'; '.join(steps)}]"

            # Item 2: the disagreement path.
            steps = []
            ann2 = answer("Dana", items[1], "sport")
            if t.review_required_approvals >= 2:
                review("Bob", items[1], ann2, "accept")
                res = review("Fiona", items[1], ann2, "reject")
                steps.append(f"Bob accept, Fiona reject->{res.next_ui_status}")
            else:
                res = review("Bob", items[1], ann2, "escalate")
                steps.append(f"Bob escalate->{res.next_ui_status}")
            db.expire_all()
            held = db.query(ReviewDisagreementDB).filter_by(annotation_id=ann2).one_or_none()
            if held is not None:
                steps.append(f"split flagged ({held.disagreement_handling})")
            dispute = open_dispute(items[1])
            if dispute is None and held is not None:
                opened = open_pending_annotation_dispute(task.id, held.id, AnnotationDisputeOpenRequest(justification=WHY), current_user=who("George"), db=db)
                steps.append("George routes it to a dispute")
                dispute = db.get(AnnotationDisputeDB, opened.dispute_id)
            elif dispute is not None:
                steps.append("dispute opened by itself")
            if dispute is not None:
                decide_annotation_dispute(task.id, dispute.id, payload=AnnotationDisputeDecisionRequest(decision="accept", justification=WHY), current_user=who("Hannah"), db=db)
                steps.append("Hannah accepts")
                case = open_case(items[1])
                if case is not None:
                    r = decide_item_reconciliation(task.id, case.id, ItemReconciliationDecisionRequest(decision="choose_one", justification=WHY, selected_annotation_id=ann2), current_user=who("Hannah"), db=db)
                    steps.append(f"then a choice case ({case.trigger_type})->{r.next_item_status}")
            row["split"] = f"{status(items[1])}  [{'; '.join(steps)}]"
            db.commit()
        except HTTPException as e:
            row["error"] = f"refused {e.status_code}: {str(e.detail)[:160]}"
            db.rollback()
        except Exception as e:  # report and move on to the next preset
            row["error"] = f"{type(e).__name__}: {e}"[:200]
            traceback.print_exc(limit=3)
            db.rollback()
        results.append(row)

    for row in results:
        print("\n" + row["preset"] + (" (superseded)" if row["superseded"] else "") + " — " + row["title"])
        for k in ("create", "happy", "split", "error"):
            if k in row:
                print(f"  {k:6}: {row[k]}")


if __name__ == "__main__":
    main()
