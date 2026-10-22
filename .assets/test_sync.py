#!/usr/bin/env python3
"""
Integration test for Chiron Background Sync Daemon
"""

import time
import subprocess
import urllib.request
import json
import os
import sys
from pathlib import Path

CHIRON_ROOT = Path(__file__).resolve().parent.parent
TEST_PORT = 8799
SERVER_URL = f"http://127.0.0.1:{TEST_PORT}"

def run_tests():
    print("1. Starting test daemon process...")
    proc = subprocess.Popen(
        [sys.executable, str(CHIRON_ROOT / ".assets" / "chiron_sync.py"), "--port", str(TEST_PORT)],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    time.sleep(1.2)

    try:
        # Test 1: Health
        print("2. Testing /api/health...")
        req = urllib.request.Request(f"{SERVER_URL}/api/health")
        with urllib.request.urlopen(req) as res:
            assert res.status == 200
            data = json.loads(res.read().decode())
            assert data["status"] == "ok"
            assert data["app"] == "chiron-sync"
            print("   -> Health check PASSED!")

        # Test 2: Save Annotations
        print("3. Testing POST /api/annotations (Saving note and AI question)...")
        test_file = "courses/samir-mobile/app-startup-sequence/lessons/0001-startup-sequence-and-initial-routing.html"
        test_sidecar = CHIRON_ROOT / "courses/samir-mobile/app-startup-sequence/lessons/0001-startup-sequence-and-initial-routing.notes.json"

        sample_annotations = [
            {
                "id": "anno-test-01",
                "type": "note",
                "content": "Catatan pengingat: Lifecycle method ini dipanggil pertama kali saat cold start.",
                "created_at": "2026-10-22T10:00:00Z",
                "status": "active",
                "anchor": {
                    "exact": "IDSamirMainModule.application(_:didFinishLaunchingWithOptions:)",
                    "prefix": "Inisialisasi yang dijalankan di dalam ",
                    "suffix": ".",
                    "selector": "#sec-obj ol li:first-child"
                }
            },
            {
                "id": "anno-test-02",
                "type": "ai_question",
                "content": "Bagaimana cara menangani error jika FlutterEngineManager.shared.prewarm() gagal?",
                "created_at": "2026-10-22T10:05:00Z",
                "status": "active",
                "anchor": {
                    "exact": "precondition(hasRun)",
                    "prefix": "mengapa ",
                    "suffix": " akan crash jika prewarm dilewati.",
                    "selector": "#sec-obj ol li:nth-child(2)"
                }
            }
        ]

        save_payload = json.dumps({
            "file": test_file,
            "annotations": sample_annotations
        }).encode("utf-8")

        save_req = urllib.request.Request(
            f"{SERVER_URL}/api/annotations",
            data=save_payload,
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(save_req) as res:
            assert res.status == 200
            save_res = json.loads(res.read().decode())
            assert save_res["success"] is True
            assert save_res["saved_count"] == 2
            assert save_res["notes_count"] == 1
            assert save_res["ai_questions_count"] == 1
            print("   -> POST /api/annotations PASSED!")

        # Test 3: Verify file was written to disk
        print("4. Verifying sidecar .notes.json file on disk...")
        assert test_sidecar.is_file(), f"Expected file {test_sidecar} does not exist"
        with open(test_sidecar, "r", encoding="utf-8") as f:
            disk_data = json.load(f)
            assert len(disk_data["annotations"]) == 2
            assert disk_data["annotations"][0]["id"] == "anno-test-01"
            assert disk_data["annotations"][1]["type"] == "ai_question"
            print(f"   -> File exists on disk ({test_sidecar.name}) with valid schema!")

        # Test 4: Read via GET /api/annotations
        print("5. Testing GET /api/annotations?file=...")
        read_req = urllib.request.Request(f"{SERVER_URL}/api/annotations?file={test_file}")
        with urllib.request.urlopen(read_req) as res:
            assert res.status == 200
            read_data = json.loads(res.read().decode())
            assert len(read_data["annotations"]) == 2
            assert read_data["notes_count"] == 1
            print("   -> GET /api/annotations PASSED!")

        # Test 5: Verify AI Question Queue endpoint
        print("6. Testing GET /api/queue...")
        queue_req = urllib.request.Request(f"{SERVER_URL}/api/queue")
        with urllib.request.urlopen(queue_req) as res:
            assert res.status == 200
            queue_data = json.loads(res.read().decode())
            assert queue_data["count"] >= 1
            print(f"   -> GET /api/queue PASSED! Found {queue_data['count']} pending AI questions in queue.")

        print("\n🎉 ALL TESTS PASSED SUCCESSFULLY!")

    finally:
        print("7. Cleaning up test daemon process...")
        proc.terminate()
        proc.wait()

if __name__ == "__main__":
    run_tests()
