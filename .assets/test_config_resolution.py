#!/usr/bin/env python3
"""
Test for Ticket 01: Local Repository Mapping Configuration & Daemon Path Resolution
"""

import sys
import json
import socket
import subprocess
import time
import urllib.request
from pathlib import Path

CHIRON_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(CHIRON_ROOT / ".assets"))

from chiron_sync import (
    load_chiron_config,
    resolve_local_file_path,
    CHIRON_CONFIG_FILE,
    CHIRON_ROOT
)


def is_port_available(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(("127.0.0.1", port)) != 0


def test_unit_config_and_path_resolution():
    print("--- [TEST 1: Unit] Loading chiron_config.json ---")
    config = load_chiron_config()
    assert isinstance(config, dict), "Config must be a dictionary"
    assert "repositories" in config, "Config must contain 'repositories'"
    assert "samir-mobile" in config["repositories"], "Config must define 'samir-mobile'"

    repo_info = config["repositories"]["samir-mobile"]
    assert "local_path" in repo_info, "Repo must specify 'local_path'"
    assert Path(repo_info["local_path"]).is_dir(), f"Local path {repo_info['local_path']} must exist"

    print("--- [TEST 2: Unit] Path Resolution for Existing File ---")
    res = resolve_local_file_path(
        gitlab_project="samir_it/samir-mobile",
        branch="learn/iOS-Arch",
        rel_file_path="ios/IDSamirLoan/Application/SamirMainModule/Classes/IDModule/IDSamirMainModule.swift"
    )
    assert res is not None, "Resolution must not be None"
    assert res["file_exists"] is True, f"File should exist: {res['local_file_path']}"
    assert Path(res["local_file_path"]).is_file(), "Resolved path must point to an actual file"

    print("--- [TEST 3: Unit] Security Guard against Path Traversal ---")
    try:
        traversal_res = resolve_local_file_path(
            gitlab_project="samir_it/samir-mobile",
            branch="learn/iOS-Arch",
            rel_file_path="../../etc/passwd"
        )
        assert traversal_res is None or traversal_res["file_exists"] is False, "Path traversal should not succeed"
    except ValueError:
        print("   -> Correctly caught Path Traversal via ValueError")

    print("=== All Unit Tests Passed! ===")


def test_http_api_config():
    print("--- [TEST 4: Integration] HTTP GET /api/config ---")
    test_port = 8811
    proc = subprocess.Popen(
        [sys.executable, str(CHIRON_ROOT / ".assets" / "chiron_sync.py"), "--port", str(test_port)],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    time.sleep(1.2)

    try:
        url = f"http://127.0.0.1:{test_port}/api/config"
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req) as res:
            assert res.status == 200, f"Expected 200, got {res.status}"
            assert res.headers.get("Access-Control-Allow-Origin") == "*", "CORS header missing"
            data = json.loads(res.read().decode("utf-8"))
            assert data.get("status") == "ok", "Expected status 'ok'"
            assert "config" in data, "Response must include 'config'"
            assert "repositories" in data["config"], "Config in response must include 'repositories'"
            print("   -> HTTP GET /api/config PASSED with valid JSON & CORS!")
    finally:
        proc.terminate()
        proc.wait()


if __name__ == "__main__":
    test_unit_config_and_path_resolution()
    test_http_api_config()
    print("\n🎉 ALL TESTS IN TICKET 01 PASSED!")
