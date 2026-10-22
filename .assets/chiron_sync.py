#!/usr/bin/env python3
"""
==============================================================================
Chiron Background Sync Daemon — Local-First Notes & AI Question Synchronizer
==============================================================================

Provides:
1. Static HTTP serving of all Chiron courses, lessons, and shared assets.
2. REST API for reading and silent auto-saving of sidecar annotation JSON files.
3. CORS support to allow seamless requests from local and remote browser sessions.
4. Auto-discovery of pending AI question queues across all courses.
"""

import sys
import os
import json
import socket
import argparse
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

# Canonical workspace root for Chiron
CHIRON_ROOT = Path(__file__).resolve().parent.parent
CHIRON_CONFIG_FILE = CHIRON_ROOT / "chiron_config.json"

DEFAULT_PORT = 8765
MAX_PORT_ATTEMPTS = 10


def load_chiron_config() -> dict:
    """Loads chiron_config.json from Chiron workspace root or returns fallback default."""
    if CHIRON_CONFIG_FILE.is_file():
        try:
            with open(CHIRON_CONFIG_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            sys.stderr.write(f"[ChironSync] Error loading {CHIRON_CONFIG_FILE}: {e}\n")
    return {
        "version": "1.0",
        "repositories": {},
        "ides": {}
    }


def resolve_local_file_path(gitlab_project: str, branch: str, rel_file_path: str) -> dict:
    """
    Resolves a relative file path from GitLab to an absolute filesystem path
    based on chiron_config.json repository mappings.
    Returns:
        {
            "repo_key": str,
            "repo_root": str,
            "local_file_path": str,
            "file_exists": bool
        }
    Raises:
        ValueError if repo cannot be resolved or if path traversal is detected.
    """
    config = load_chiron_config()
    repos = config.get("repositories", {})

    target_repo_key = None
    target_repo_info = None

    # Find matching repo by gitlab_project or key
    clean_project = gitlab_project.strip().lower()
    for key, info in repos.items():
        if info.get("gitlab_project", "").strip().lower() == clean_project or key.lower() == clean_project:
            target_repo_key = key
            target_repo_info = info
            break

    if not target_repo_info:
        raise ValueError(f"No repository mapping found for gitlab project '{gitlab_project}'")

    # Check branch mappings first, fallback to local_path
    local_path_str = target_repo_info.get("local_path", "")
    branch_mappings = target_repo_info.get("branch_mappings", {})
    if branch and branch in branch_mappings:
        local_path_str = branch_mappings[branch]

    if not local_path_str:
        raise ValueError(f"No local path configured for repository '{target_repo_key}'")

    repo_root = Path(local_path_str).resolve()
    clean_rel = rel_file_path.strip().lstrip("/")
    full_path = (repo_root / clean_rel).resolve()

    # Guard against path traversal attack
    if not str(full_path).startswith(str(repo_root)):
        raise ValueError(f"Access outside repository root '{repo_root}' is forbidden: {clean_rel}")

    return {
        "repo_key": target_repo_key,
        "repo_root": str(repo_root),
        "local_file_path": str(full_path),
        "file_exists": full_path.is_file()
    }


SUPPORTED_IDES = {"xcode", "antigravity", "cursor", "vscode"}


def validate_file_in_allowed_repositories(file_path: str) -> Path:
    """
    Validates that file_path exists and is located inside one of the
    registered repository roots in chiron_config.json.
    Raises FileNotFoundError or PermissionError/ValueError.
    """
    full_path = Path(file_path).resolve()
    if not full_path.is_file():
        raise FileNotFoundError(f"Target file does not exist: {file_path}")

    config = load_chiron_config()
    repos = config.get("repositories", {})

    allowed_roots = []
    for info in repos.values():
        if info.get("local_path"):
            allowed_roots.append(Path(info["local_path"]).resolve())
        for branch_path in info.get("branch_mappings", {}).values():
            allowed_roots.append(Path(branch_path).resolve())

    # Also allow files inside Chiron itself
    allowed_roots.append(CHIRON_ROOT)

    for root in allowed_roots:
        if str(full_path).startswith(str(root)):
            return full_path

    raise PermissionError(f"Access to file outside registered repository workspaces is forbidden: {file_path}")


def build_open_command(ide: str, file_path: str, line: int = 1) -> list:
    """
    Constructs the exact CLI argument list to open file_path at the given line in the specified IDE.
    Uses shell=False argument list format to prevent command injection.
    """
    clean_ide = ide.strip().lower()
    if clean_ide not in SUPPORTED_IDES:
        raise ValueError(f"Unsupported IDE '{ide}'. Must be one of: {sorted(SUPPORTED_IDES)}")

    clean_line = max(1, int(line))
    target_path = str(Path(file_path).resolve())

    if clean_ide == "xcode":
        # Native macOS Xcode CLI: xed -line <L> <file>
        if os.path.isfile("/usr/bin/xed"):
            return ["/usr/bin/xed", "-line", str(clean_line), target_path]
        return ["/usr/bin/open", "-a", "Xcode", target_path]

    elif clean_ide == "antigravity":
        return ["/usr/bin/open", f"antigravity://file/{target_path}:{clean_line}"]

    elif clean_ide == "cursor":
        return ["/usr/bin/open", f"cursor://file/{target_path}:{clean_line}"]

    elif clean_ide == "vscode":
        return ["/usr/bin/open", f"vscode://file/{target_path}:{clean_line}"]

    raise ValueError(f"Unknown IDE '{ide}'")


def execute_open_ide(ide: str, file_path: str, line: int = 1, dry_run: bool = False) -> dict:
    """
    Validates security constraints and executes the open command for the given IDE.
    """
    validated_path = validate_file_in_allowed_repositories(file_path)
    cmd = build_open_command(ide, str(validated_path), line)

    if dry_run:
        return {
            "status": "ok",
            "dry_run": True,
            "ide": ide.strip().lower(),
            "file_path": str(validated_path),
            "line": int(line),
            "command": cmd
        }

    try:
        subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        return {
            "status": "ok",
            "dry_run": False,
            "ide": ide.strip().lower(),
            "file_path": str(validated_path),
            "line": int(line),
            "command": cmd
        }
    except subprocess.CalledProcessError as e:
        raise RuntimeError(f"Command execution failed with exit code {e.returncode}: {e.stderr or e.stdout}")


def get_sidecar_path(lesson_rel_path: str) -> Path:
    """Computes the canonical .notes.json sidecar file path from an HTML lesson path."""
    clean_path = lesson_rel_path.strip().lstrip("/")
    if clean_path.endswith(".html"):
        sidecar_rel = clean_path[:-5] + ".notes.json"
    else:
        sidecar_rel = clean_path + ".notes.json"

    full_path = (CHIRON_ROOT / sidecar_rel).resolve()
    # Guard against path traversal attacks
    if not str(full_path).startswith(str(CHIRON_ROOT)):
        raise ValueError("Access outside Chiron root is forbidden")
    return full_path


class ChironSyncHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(CHIRON_ROOT), **kwargs)

    def log_message(self, format, *args):
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        sys.stdout.write(f"[{now}] [ChironSync] {self.address_string()} - {format % args}\n")
        sys.stdout.flush()

    def end_headers(self):
        # Enable CORS for cross-origin browser fetch (from file:// or remote iPad IP)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path == "/api/health":
            self._send_json(200, {
                "status": "ok",
                "app": "chiron-sync",
                "version": "1.0.0",
                "workspace": str(CHIRON_ROOT),
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
            return

        elif path == "/api/config":
            self._send_json(200, {
                "status": "ok",
                "config": load_chiron_config(),
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
            return

        elif path == "/api/resolve":
            query = parse_qs(parsed.query)
            project = query.get("project", [""])[0]
            branch = query.get("branch", [""])[0]
            rel_file = query.get("file", [""])[0]

            if not project or not rel_file:
                self._send_json(400, {"error": "Missing 'project' or 'file' query parameter"})
                return

            try:
                res = resolve_local_file_path(project, branch, rel_file)
                self._send_json(200, {
                    "status": "ok",
                    **res
                })
            except Exception as e:
                self._send_json(400, {"status": "error", "error": str(e)})
            return

        elif path == "/api/annotations":
            query = parse_qs(parsed.query)
            file_param = query.get("file", [""])[0]
            if not file_param:
                self._send_json(400, {"error": "Missing 'file' parameter"})
                return

            try:
                sidecar_path = get_sidecar_path(file_param)
                if sidecar_path.is_file():
                    with open(sidecar_path, "r", encoding="utf-8") as f:
                        data = json.load(f)
                    self._send_json(200, data)
                else:
                    # Return empty scaffold
                    self._send_json(200, {
                        "version": "1.0",
                        "lesson": file_param,
                        "annotations": [],
                        "updated_at": None,
                        "file_exists": False
                    })
            except Exception as e:
                self._send_json(400, {"error": str(e)})
            return

        elif path == "/api/queue":
            # Scan all .notes.json files for pending AI questions
            queue = []
            for sidecar_file in CHIRON_ROOT.glob("courses/**/*.notes.json"):
                try:
                    with open(sidecar_file, "r", encoding="utf-8") as f:
                        data = json.load(f)
                    rel_lesson = str(sidecar_file.relative_to(CHIRON_ROOT))
                    for anno in data.get("annotations", []):
                        if anno.get("type") == "ai_question" and anno.get("status") == "active":
                            queue.append({
                                "lesson_file": rel_lesson,
                                "annotation": anno
                            })
                except Exception:
                    continue

            self._send_json(200, {
                "count": len(queue),
                "items": queue,
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
            return

        # Default static file handling
        return super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path == "/api/annotations":
            content_length = int(self.headers.get("Content-Length", 0))
            if content_length <= 0:
                self._send_json(400, {"error": "Empty payload"})
                return

            body = self.rfile.read(content_length)
            try:
                payload = json.loads(body.decode("utf-8"))
            except Exception as e:
                self._send_json(400, {"error": f"Invalid JSON payload: {e}"})
                return

            file_param = payload.get("file", "")
            annotations = payload.get("annotations", [])

            if not file_param:
                self._send_json(400, {"error": "Missing 'file' field in payload"})
                return

            try:
                sidecar_path = get_sidecar_path(file_param)
                sidecar_path.parent.mkdir(parents=True, exist_ok=True)

                record = {
                    "version": "1.0",
                    "lesson": file_param,
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                    "total_annotations": len(annotations),
                    "notes_count": sum(1 for a in annotations if a.get("type") == "note"),
                    "ai_questions_count": sum(1 for a in annotations if a.get("type") == "ai_question"),
                    "annotations": annotations
                }

                # Atomic write: write to temp file then rename
                temp_path = sidecar_path.with_suffix(".tmp")
                with open(temp_path, "w", encoding="utf-8") as f:
                    json.dump(record, f, indent=2, ensure_ascii=False)
                os.replace(temp_path, sidecar_path)

                self._send_json(200, {
                    "success": True,
                    "saved_count": len(annotations),
                    "notes_count": record["notes_count"],
                    "ai_questions_count": record["ai_questions_count"],
                    "path": str(sidecar_path.relative_to(CHIRON_ROOT)),
                    "updated_at": record["updated_at"]
                })
            except Exception as e:
                self._send_json(500, {"error": f"Failed to save annotations: {e}"})
            return

        elif path == "/api/open":
            content_length = int(self.headers.get("Content-Length", 0))
            if content_length <= 0:
                self._send_json(400, {"error": "Empty payload"})
                return

            body = self.rfile.read(content_length)
            try:
                payload = json.loads(body.decode("utf-8"))
            except Exception as e:
                self._send_json(400, {"error": f"Invalid JSON payload: {e}"})
                return

            ide = payload.get("ide", "")
            line = payload.get("line", 1)
            dry_run = bool(payload.get("dry_run", False))

            if not ide:
                self._send_json(400, {"error": "Missing 'ide' parameter"})
                return

            target_file = payload.get("file_path", "")
            if not target_file:
                project = payload.get("project", "")
                branch = payload.get("branch", "")
                rel_file = payload.get("file", "")
                if project and rel_file:
                    try:
                        resolved = resolve_local_file_path(project, branch, rel_file)
                        target_file = resolved["local_file_path"]
                    except Exception as e:
                        self._send_json(400, {"error": f"Path resolution failed: {e}"})
                        return
                else:
                    self._send_json(400, {"error": "Must provide either 'file_path' or ('project' and 'file')"})
                    return

            try:
                res = execute_open_ide(ide, target_file, line=line, dry_run=dry_run)
                self._send_json(200, res)
            except FileNotFoundError as e:
                self._send_json(404, {"error": str(e)})
            except PermissionError as e:
                self._send_json(403, {"error": str(e)})
            except ValueError as e:
                self._send_json(400, {"error": str(e)})
            except Exception as e:
                self._send_json(500, {"error": f"Execution error: {e}"})
            return

        self._send_json(404, {"error": "Endpoint not found"})

    def _send_json(self, status_code: int, data: dict):
        body = json.dumps(data, indent=2, ensure_ascii=False).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def is_port_available(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(("127.0.0.1", port)) != 0


def find_available_port(start_port: int) -> int:
    for port in range(start_port, start_port + MAX_PORT_ATTEMPTS):
        if is_port_available(port):
            return port
    raise RuntimeError(f"No available port found in range {start_port}-{start_port + MAX_PORT_ATTEMPTS}")


def main():
    parser = argparse.ArgumentParser(description="Chiron Background Sync Daemon")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT, help="Port to listen on (default: 8765)")
    parser.add_argument("--host", type=str, default="0.0.0.0", help="Host address (default: 0.0.0.0 for LAN access)")
    args = parser.parse_args()

    port = args.port
    if not is_port_available(port):
        port = find_available_port(port)

    server = ThreadingHTTPServer((args.host, port), ChironSyncHandler)
    print("=" * 72)
    print("🏹 Chiron Sync Daemon is Running!")
    print(f"📁 Root: {CHIRON_ROOT}")
    print(f"🌐 Local URL:  http://localhost:{port}/")
    print(f"📡 API Health: http://localhost:{port}/api/health")
    print(f"🔄 Auto-sync:  Active (Sidecar JSON format)")
    print("=" * 72)
    sys.stdout.flush()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down Chiron Sync Daemon.")
        server.server_close()


if __name__ == "__main__":
    main()
