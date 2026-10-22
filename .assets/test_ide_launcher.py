#!/usr/bin/env python3
"""
Test for Ticket 02: Daemon IDE Launcher Endpoint & Xcode Bridge
"""

import sys
import json
import subprocess
import time
import urllib.request
import urllib.error
from pathlib import Path

CHIRON_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(CHIRON_ROOT / ".assets"))

from chiron_sync import (
    build_open_command,
    execute_open_ide,
    CHIRON_CONFIG_FILE,
    CHIRON_ROOT
)

TEST_FILE = "/Users/samir/Documents/Workspace/SAMIR/Mobile/Nexus/samir-mobile-nexus/ios/IDSamirLoan/Application/SamirMainModule/Classes/IDModule/IDSamirMainModule.swift"


def test_unit_build_open_command():
    print("--- [TEST 1: Unit] Command Generation for Each IDE ---")
    
    # Xcode
    cmd_xcode = build_open_command("xcode", TEST_FILE, line=54)
    assert isinstance(cmd_xcode, list)
    assert "xed" in cmd_xcode[0] or "open" in cmd_xcode[0]
    assert "-line" in cmd_xcode and "54" in cmd_xcode

    # Antigravity IDE (must target Antigravity IDE app / CLI, NOT Antigravity Agent)
    cmd_ag = build_open_command("antigravity", TEST_FILE, line=70)
    assert isinstance(cmd_ag, list)
    assert "antigravity-ide" in cmd_ag[0] or "com.google.antigravity-ide" in cmd_ag

    # Cursor
    cmd_cursor = build_open_command("cursor", TEST_FILE, line=20)
    assert cmd_cursor[0] == "/usr/bin/open"
    assert f"cursor://file/{TEST_FILE}:20" in cmd_cursor

    # VS Code
    cmd_vscode = build_open_command("vscode", TEST_FILE, line=10)
    assert cmd_vscode[0] == "/usr/bin/open"
    assert f"vscode://file/{TEST_FILE}:10" in cmd_vscode

    print("   -> build_open_command() PASSED for all IDEs!")


def test_unit_execute_open_ide_security_and_dryrun():
    print("--- [TEST 2: Unit] Execution Security & Dry-Run ---")
    # Dry run for valid file
    res = execute_open_ide("xcode", TEST_FILE, line=54, dry_run=True)
    assert res["status"] == "ok"
    assert res["dry_run"] is True
    assert res["file_path"] == TEST_FILE
    assert res["line"] == 54

    # Security: File outside registered repositories
    try:
        execute_open_ide("vscode", "/etc/passwd", line=1, dry_run=True)
        assert False, "Should have rejected /etc/passwd"
    except (PermissionError, ValueError) as e:
        print(f"   -> Correctly rejected outside file: {e}")

    # Invalid IDE
    try:
        execute_open_ide("unknown_ide", TEST_FILE, line=1, dry_run=True)
        assert False, "Should have rejected unknown_ide"
    except ValueError as e:
        print(f"   -> Correctly rejected invalid IDE: {e}")

    print("   -> Execution validation PASSED!")


def test_http_api_open_endpoint():
    print("--- [TEST 3: Integration] HTTP POST /api/open ---")
    test_port = 8822
    proc = subprocess.Popen(
        [sys.executable, str(CHIRON_ROOT / ".assets" / "chiron_sync.py"), "--port", str(test_port)],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    time.sleep(1.2)

    try:
        url = f"http://127.0.0.1:{test_port}/api/open"

        # 1. Successful dry-run request with absolute file_path
        payload = {
            "ide": "xcode",
            "file_path": TEST_FILE,
            "line": 54,
            "dry_run": True
        }
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req) as res:
            assert res.status == 200
            assert res.headers.get("Access-Control-Allow-Origin") == "*"
            data = json.loads(res.read().decode("utf-8"))
            assert data["status"] == "ok"
            assert data["dry_run"] is True
            assert data["ide"] == "xcode"
            print("   -> POST /api/open with absolute path PASSED!")

        # 2. Successful dry-run request with relative path + gitlab_project
        payload_rel = {
            "ide": "antigravity",
            "project": "samir_it/samir-mobile",
            "branch": "learn/iOS-Arch",
            "file": "ios/IDSamirLoan/Application/SamirMainModule/Classes/IDModule/IDSamirMainModule.swift",
            "line": 77,
            "dry_run": True
        }
        req_rel = urllib.request.Request(
            url,
            data=json.dumps(payload_rel).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req_rel) as res:
            assert res.status == 200
            data = json.loads(res.read().decode("utf-8"))
            assert data["status"] == "ok"
            assert data["line"] == 77
            print("   -> POST /api/open with gitlab project & relative file PASSED!")

        # 3. Path outside repository rejected with 403 or 400
        payload_bad = {
            "ide": "cursor",
            "file_path": "/etc/hosts",
            "line": 1,
            "dry_run": True
        }
        req_bad = urllib.request.Request(
            url,
            data=json.dumps(payload_bad).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        try:
            urllib.request.urlopen(req_bad)
            assert False, "Should have returned 403/400"
        except urllib.error.HTTPError as e:
            assert e.code in (400, 403)
            print(f"   -> POST /api/open correctly rejected unauthorized path with HTTP {e.code}!")

    finally:
        proc.terminate()
        proc.wait()


if __name__ == "__main__":
    test_unit_build_open_command()
    test_unit_execute_open_ide_security_and_dryrun()
    test_http_api_open_endpoint()
    print("\n🎉 ALL TESTS IN TICKET 02 PASSED!")
