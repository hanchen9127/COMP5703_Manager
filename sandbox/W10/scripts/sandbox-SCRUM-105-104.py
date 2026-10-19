"""Sandbox helper for the SCRUM-105 / SCRUM-104 manual walkthrough (PR #83 gate, PR #84 manifest).

Releases have no screen yet (H6, #82), so this script does the release side through the API, and checks a
release the way a client would: with SHA-256 and nothing from the platform. Everything else in the
walkthrough (answering, reviewing, escalating, deciding, reopening) is done in the browser.
Standard library only; the API must be running on :8000 from the PR #84 worktree.

    py sandbox-SCRUM-105-104.py items                      # task A3's items and their status
    py sandbox-SCRUM-105-104.py release [--as <who>]       # create a release of A3 (default: kevin)
    py sandbox-SCRUM-105-104.py releases                   # A3's releases, oldest first
    py sandbox-SCRUM-105-104.py check <release> [--tamper] # independent check of artefact against manifest
    py sandbox-SCRUM-105-104.py manifest <release> [<item>] # the manifest's summary, or one item's entry
    py sandbox-SCRUM-105-104.py trail <item>               # the item's provenance events (F1)
    py sandbox-SCRUM-105-104.py force <item> <status>      # try to set a status directly, as alice (admin)

<item> is the item name, e.g. a3-05-finalised (a unique prefix such as a3-05 is enough). <release> is a
`rel_…` id, or `v1`, `v2`, … for A3's release of that version. Logins come from the seed accounts table in
the repository's README (HEJ_REPO, default the PR #84 worktree), so no password is written here.
Use `py`, not `python`: on this machine `python` is the Microsoft Store stub.
"""

from __future__ import annotations

import hashlib
import json
import os
import re
import sys
import tempfile
import urllib.error
import urllib.request
from pathlib import Path

API = os.environ.get("HEJ_SANDBOX_API", "http://localhost:8000/api/v1")
REPO = Path(os.environ.get("HEJ_REPO", "D:/COMP5703_Capstone/hej-review-84"))
PROJECT = "Test: Single review"
TASK_PREFIX = "1 submission per item: judgement"  # seeded task A3
OUT = Path(tempfile.gettempdir()) / "hej-release-check"

_tokens: dict[str, str] = {}
_organizations: dict[str, list[dict]] = {}
_task_id: str | None = None


# -- HTTP ---------------------------------------------------------------------------------------------------

def call(method: str, path: str, who: str | None = None, body: dict | None = None):
    """(status, parsed JSON or raw bytes, headers). Never raises on an HTTP error status."""
    request = urllib.request.Request(API + path, method=method)
    if who is not None:
        request.add_header("Authorization", f"Bearer {token(who)}")
    data = None
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        request.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(request, data=data, timeout=60) as response:
            status, raw, headers = response.status, response.read(), response.headers
    except urllib.error.HTTPError as error:
        status, raw, headers = error.code, error.read(), error.headers
    except urllib.error.URLError as error:
        sys.exit(f"The API at {API} is unreachable ({error.reason}). Is it running?")
    content_type = headers.get("Content-Type", "")
    if "application/json" in content_type and not headers.get("Content-Disposition"):
        return status, json.loads(raw or b"null"), headers
    return status, raw, headers


def _accounts() -> dict[str, tuple[str, str]]:
    """first name (lower case) -> (email, password), read from the README's seed accounts table."""
    readme = (REPO / "README.md").read_text(encoding="utf-8")
    accounts = {}
    for match in re.finditer(r"^\|\s*([A-Z][\w']+)[^|]*\|\s*`([^`]+@[^`]+)`\s*\|\s*`([^`]+)`\s*\|", readme, re.M):
        accounts[match.group(1).lower()] = (match.group(2), match.group(3))
    if not accounts:
        sys.exit(f"No seed accounts found in {REPO / 'README.md'}; set HEJ_REPO to the checkout you run.")
    return accounts


def token(who: str) -> str:
    if who not in _tokens:
        accounts = _accounts()
        if who not in accounts:
            sys.exit(f"Unknown account '{who}'. Known: {', '.join(sorted(accounts))}")
        email, password = accounts[who]
        status, body, _ = call("POST", "/auth/login", body={"email": email, "password": password})
        if status != 200:
            sys.exit(f"Login as {who} failed: {status}. Was the database seeded (init_data.py --reset)?")
        _tokens[who] = body["access_token"]
        _organizations[who] = body["organizations"]
    return _tokens[who]


# -- Lookups ------------------------------------------------------------------------------------------------

def task_id() -> str:
    global _task_id
    if _task_id is None:
        token("kevin")
        for org in _organizations["kevin"]:
            status, projects, _ = call("GET", f"/organizations/{org['organization_id']}/projects", "kevin")
            project = next((p for p in projects if p["name"] == PROJECT), None) if status == 200 else None
            if project:
                status, tasks, _ = call("GET", f"/projects/{project['id']}/tasks", "kevin")
                task = next((t for t in tasks if t["title"].startswith(TASK_PREFIX)), None)
                if task:
                    _task_id = task["id"]
                    return _task_id
        sys.exit(f"Task A3 ('{TASK_PREFIX}…') not found in '{PROJECT}'. Was the database seeded?")
    return _task_id


def items() -> list[dict]:
    status, rows, _ = call("GET", f"/tasks/{task_id()}/task-items", "kevin")
    if status != 200:
        sys.exit(f"Reading the items failed: {status} {rows}")
    return sorted(rows, key=lambda row: row["external_item_ref"])


def item(name: str) -> dict:
    matches = [row for row in items() if row["external_item_ref"].startswith(name)]
    if len(matches) != 1:
        sys.exit(f"'{name}' matches {len(matches)} items; give more of the name.")
    return matches[0]


def ref_of(item_id: str) -> str:
    return next((row["external_item_ref"] for row in items() if row["id"] == item_id), item_id)


def release_id(name: str) -> str:
    if re.fullmatch(r"v\d+", name):
        status, rows, _ = call("GET", f"/tasks/{task_id()}/releases", "kevin")
        match = next((r for r in rows if r["version"] == int(name[1:])), None)
        if match is None:
            sys.exit(f"Task A3 has no release {name}.")
        return match["id"]
    return name


# -- Commands -----------------------------------------------------------------------------------------------

def cmd_items() -> None:
    for row in items():
        print(f"  {row['external_item_ref']:<26} {row['status']}")


def cmd_release(who: str) -> None:
    status, body, _ = call("POST", f"/tasks/{task_id()}/releases", who)
    if status == 201:
        print(f"201 Created: {body['id']}  version {body['version']}  lines {body['item_count']}")
        print(f"  artefact sha256  {body['artefact_sha256']}")
        print(f"  manifest sha256  {body['manifest_sha256']}")
        print(f"  gate warnings    {len(body['gate_warnings'])}")
        for warning in body["gate_warnings"]:
            for reason in warning["reasons"]:
                print(f"    {warning['external_item_ref']}: {reason['reason']} — {reason['detail']}")
        return
    print(f"{status} — refused")
    detail = body.get("detail") if isinstance(body, dict) else body
    if isinstance(detail, dict):
        print(f"  {detail.get('message')}")
        for finding in detail.get("items", []):
            print(f"  {finding['external_item_ref']}")
            for reason in finding["reasons"]:
                print(f"    {reason['reason']:<22} {reason['detail']}")
    else:
        print(f"  {detail}")
    status, rows, _ = call("GET", f"/tasks/{task_id()}/releases", "kevin")
    print(f"  releases of A3 now: {len(rows)}")


def cmd_releases() -> None:
    status, rows, _ = call("GET", f"/tasks/{task_id()}/releases", "kevin")
    if not rows:
        print("  (none)")
    for row in rows:
        print(f"  v{row['version']}  {row['id']}  {row['created_at']}  lines {row['item_count']}"
              f"  artefact {row['artefact_sha256'][:12]}…  manifest {str(row['manifest_sha256'])[:12]}…")


def _fetch(release: str) -> tuple[bytes, bytes, dict]:
    status, artefact, artefact_headers = call("GET", f"/releases/{release}/download", "kevin")
    if status != 200:
        sys.exit(f"Download failed: {status} {artefact}")
    status, manifest, manifest_headers = call("GET", f"/releases/{release}/manifest", "kevin")
    if status != 200:
        sys.exit(f"Manifest failed: {status} {manifest}")
    OUT.mkdir(exist_ok=True)
    (OUT / f"{release}.jsonl").write_bytes(artefact)
    (OUT / f"{release}.manifest.json").write_bytes(manifest)
    return artefact, manifest, {
        "artefact": artefact_headers.get("X-Artefact-SHA256"),
        "manifest": manifest_headers.get("X-Manifest-SHA256"),
    }


def cmd_check(name: str, tamper: bool) -> None:
    """The five steps in api_surfaces.md, with hashlib and json only: nothing from the platform."""
    release = release_id(name)
    artefact, manifest_bytes, headers = _fetch(release)
    manifest = json.loads(manifest_bytes)
    if tamper:
        position = artefact.index(b'"raw_annotation_data"') + 30
        artefact = artefact[:position] + bytes([artefact[position] ^ 1]) + artefact[position + 1:]
        print(f"Tampered: one bit flipped at byte {position} of the downloaded artefact.\n")
    print(f"Checking {release} (v{manifest['release']['version']}); files in {OUT}")
    results = []

    def step(label: str, ok: bool, detail: str = "") -> None:
        results.append(ok)
        print(f"  {'PASS' if ok else 'FAIL'}  {label}{(' — ' + detail) if detail else ''}")

    digest = hashlib.sha256(artefact).hexdigest()
    step("1. artefact SHA-256 = manifest artefact.sha256", digest == manifest["artefact"]["sha256"], digest[:16] + "…")
    lines = artefact.decode("utf-8", errors="replace").split("\n")
    if lines and lines[-1] == "":
        lines.pop()
    step("2. line count = manifest artefact.line_count", len(lines) == manifest["artefact"]["line_count"],
         f"{len(lines)} lines")
    claimed: set[int] = set()
    for entry in manifest["items"]:
        if entry["resolution"] == "ambiguous":
            step(f"3. {entry['external_item_ref']}: ambiguous, no line and no value",
                 entry["line_number"] is None and entry["annotation_id"] is None)
            continue
        number = entry["line_number"]
        line = lines[number - 1] if number and number <= len(lines) else ""
        same_hash = hashlib.sha256(line.encode("utf-8")).hexdigest() == entry["line_sha256"]
        try:
            body = json.loads(line)
            names_it = body.get("task_item_id") == entry["task_item_id"] and body.get("annotation_id") == entry["annotation_id"]
        except ValueError:
            names_it = False
        step(f"3. {entry['external_item_ref']}: line {number} hash and ids", same_hash and names_it)
        claimed.add(number)
    unclaimed = sorted(set(range(1, len(lines) + 1)) - claimed)
    step("4. every line claimed by one item", not unclaimed, f"unclaimed {unclaimed}" if unclaimed else "")
    manifest_digest = hashlib.sha256(manifest_bytes).hexdigest()
    step("5. manifest SHA-256 = X-Manifest-SHA256", manifest_digest == headers["manifest"], manifest_digest[:16] + "…")
    print(f"\n{'VERIFIED' if all(results) else 'NOT VERIFIED'}: {sum(results)} of {len(results)} checks passed.")


def cmd_manifest(name: str, which: str | None) -> None:
    release = release_id(name)
    _, manifest_bytes, _ = _fetch(release)
    manifest = json.loads(manifest_bytes)
    if which:
        entry = next((e for e in manifest["items"] if e["external_item_ref"].startswith(which)), None)
        if entry is None:
            sys.exit(f"No item '{which}' in {release}'s manifest.")
        print(json.dumps(entry, indent=2, ensure_ascii=False))
        return
    summary = {key: manifest[key] for key in ("manifest_format", "release", "task", "artefact", "item_count",
                                              "resolutions", "versions_covered", "gate_warnings")}
    print(json.dumps(summary, indent=2, ensure_ascii=False))
    for entry in manifest["items"]:
        print(f"  {entry['external_item_ref']:<26} {entry['resolution']:<14} line {entry['line_number']}"
              f"  answer {entry['annotation_id']}  events {len(entry['provenance']['event_ids'])}"
              f"  released {entry['provenance']['released_event_id']}")


def cmd_trail(name: str) -> None:
    row = item(name)
    status, body, _ = call("GET", f"/task-items/{row['id']}/provenance", "kevin")
    if status != 200:
        sys.exit(f"Provenance read failed: {status} {body}")
    print(f"{row['external_item_ref']} ({row['status']}): {len(body['events'])} events, oldest first")
    for event in body["events"]:
        print(f"  {event['id']:>6}  {event['occurred_at'][:19]}  {event['event_kind']:<20} "
              f"{event['actor_name']:<18} {event['record_type']} {event.get('record_id', '')}")


def cmd_force(name: str, target: str) -> None:
    row = item(name)
    status, body, _ = call("PATCH", f"/tasks/{task_id()}/task-items/{row['id']}", "alice", {"status": target})
    detail = body.get("detail") if isinstance(body, dict) and "detail" in body else body
    print(f"alice sets {row['external_item_ref']} to '{target}': {status} {detail if status != 200 else body['status']}")


def main() -> None:
    args = sys.argv[1:]
    who = "kevin"
    if "--as" in args:
        position = args.index("--as")
        who = args[position + 1]
        del args[position:position + 2]
    tamper = "--tamper" in args
    args = [a for a in args if a != "--tamper"]
    if not args:
        sys.exit(__doc__)
    command, rest = args[0], args[1:]
    if command == "items":
        cmd_items()
    elif command == "release":
        cmd_release(who)
    elif command == "releases":
        cmd_releases()
    elif command == "check" and rest:
        cmd_check(rest[0], tamper)
    elif command == "manifest" and rest:
        cmd_manifest(rest[0], rest[1] if len(rest) > 1 else None)
    elif command == "trail" and rest:
        cmd_trail(rest[0])
    elif command == "force" and len(rest) == 2:
        cmd_force(rest[0], rest[1])
    else:
        sys.exit(__doc__)


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
