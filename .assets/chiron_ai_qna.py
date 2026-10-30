#!/usr/bin/env python3
"""
==============================================================================
Chiron AI QnA Manager & Auto-Cleanup CLI
==============================================================================
Used by AI Agents and developers to:
1. List pending AI questions in a specific lesson or across the entire Chiron curriculum.
2. Resolve and safely prune answered AI questions from .notes.json sidecar files.
3. Guarantee that user personal notes ('note') are 100% preserved.
"""

import sys
import os
import json
import argparse
from pathlib import Path
from datetime import datetime, timezone

CHIRON_ROOT = Path(__file__).resolve().parent.parent


def find_all_sidecars():
    """Finds all .notes.json files in courses/."""
    return list(CHIRON_ROOT.glob("courses/**/*.notes.json"))


def get_sidecar_for_lesson(lesson_path_or_str: str) -> Path:
    raw = str(lesson_path_or_str).strip()
    if raw.startswith("file://"):
        raw = raw[7:]
    p = Path(raw)
    if p.is_absolute():
        if p.name.endswith(".html"):
            return p.with_name(p.stem + ".notes.json")
        elif not p.name.endswith(".notes.json"):
            return p.with_name(p.name + ".notes.json")
        return p

    clean = raw.lstrip("/")
    if clean.endswith(".html"):
        clean = clean[:-5] + ".notes.json"
    elif not clean.endswith(".notes.json"):
        clean = clean + ".notes.json"

    return (CHIRON_ROOT / clean).resolve()


def list_questions(lesson_filter=None, as_json=False):
    targets = [get_sidecar_for_lesson(lesson_filter)] if lesson_filter else find_all_sidecars()
    all_questions = []

    for path in targets:
        if not path.is_file():
            continue
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
            rel_path = str(path.relative_to(CHIRON_ROOT))
            lesson_name = data.get("lesson", rel_path.replace(".notes.json", ".html"))
            for anno in data.get("annotations", []):
                if anno.get("type") == "ai_question" and anno.get("status") == "active":
                    all_questions.append({
                        "id": anno.get("id"),
                        "lesson": lesson_name,
                        "sidecar_path": str(path),
                        "created_at": anno.get("created_at"),
                        "exact_quote": anno.get("anchor", {}).get("exact", ""),
                        "question": anno.get("content", "")
                    })
        except Exception as e:
            sys.stderr.write(f"Warning: Failed to read {path}: {e}\n")

    if as_json:
        print(json.dumps(all_questions, indent=2, ensure_ascii=False))
        return

    print("=" * 72)
    print(f"📋 Chiron AI Question Queue ({len(all_questions)} pending)")
    print("=" * 72)

    if not all_questions:
        print("🎉 Tidak ada antrean pertanyaan AI aktif!")
        return

    for idx, item in enumerate(all_questions, 1):
        print(f"\n[{idx}] ID: {item['id']}")
        print(f"    Modul: {item['lesson']}")
        print(f"    Kutipan Teks: \"{item['exact_quote']}\"")
        print(f"    Pertanyaan:   {item['question']}")
        print(f"    Dibuat:       {item['created_at']}")
    print("\n" + "=" * 72)


def resolve_question(anno_id: str, lesson_target=None):
    """Prunes a specific AI question from its sidecar file and records resolution."""
    targets = [get_sidecar_for_lesson(lesson_target)] if lesson_target else find_all_sidecars()
    found = False

    for path in targets:
        if not path.is_file():
            continue
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)

            original_count = len(data.get("annotations", []))
            remaining = []
            resolved_item = None

            for anno in data.get("annotations", []):
                if anno.get("id") == anno_id and anno.get("type") == "ai_question":
                    resolved_item = anno
                else:
                    remaining.append(anno)

            if resolved_item:
                found = True
                # Archive to resolved_history if present, or just remove from active annotations
                if "resolved_history" not in data:
                    data["resolved_history"] = []
                resolved_item["resolved_at"] = datetime.now(timezone.utc).isoformat()
                resolved_item["status"] = "resolved"
                data["resolved_history"].append(resolved_item)

                data["annotations"] = remaining
                data["updated_at"] = datetime.now(timezone.utc).isoformat()
                data["total_annotations"] = len(remaining)
                data["notes_count"] = sum(1 for a in remaining if a.get("type") == "note")
                data["ai_questions_count"] = sum(1 for a in remaining if a.get("type") == "ai_question")

                temp_path = path.with_suffix(".tmp")
                with open(temp_path, "w", encoding="utf-8") as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
                os.replace(temp_path, path)

                print(f"✅ Pertanyaan '{anno_id}' berhasil diselesaikan dan dibersihkan dari:")
                print(f"   {path.relative_to(CHIRON_ROOT)}")
                print(f"   Sisa catatan: {data['notes_count']}, Sisa antrean AI: {data['ai_questions_count']}")
                break
        except Exception as e:
            sys.stderr.write(f"Error updating {path}: {e}\n")

    if not found:
        print(f"❌ Pertanyaan AI dengan ID '{anno_id}' tidak ditemukan.")


def resolve_all_in_lesson(lesson_target: str):
    """Resolves all active AI questions in a specific lesson, preserving notes."""
    path = get_sidecar_for_lesson(lesson_target)
    if not path.is_file():
        print(f"❌ Berkas sidecar tidak ditemukan: {path}")
        return

    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    notes_only = []
    resolved = []
    now_iso = datetime.now(timezone.utc).isoformat()

    for anno in data.get("annotations", []):
        if anno.get("type") == "ai_question" and anno.get("status") == "active":
            anno["status"] = "resolved"
            anno["resolved_at"] = now_iso
            resolved.append(anno)
        else:
            notes_only.append(anno)

    if "resolved_history" not in data:
        data["resolved_history"] = []
    data["resolved_history"].extend(resolved)

    data["annotations"] = notes_only
    data["updated_at"] = now_iso
    data["total_annotations"] = len(notes_only)
    data["notes_count"] = len(notes_only)
    data["ai_questions_count"] = 0

    temp_path = path.with_suffix(".tmp")
    with open(temp_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    os.replace(temp_path, path)

    print(f"🎉 Sukses! {len(resolved)} pertanyaan AI telah dibersihkan dari:")
    print(f"   {path.relative_to(CHIRON_ROOT)}")
    print(f"   Semua {len(notes_only)} catatan pribadi (notes) tetap dipertahankan 100%.")


def main():
    parser = argparse.ArgumentParser(description="Chiron AI QnA Manager")
    parser.add_argument("--list", action="store_true", help="List all pending AI questions")
    parser.add_argument("--json", action="store_true", help="Output list as JSON")
    parser.add_argument("--lesson", type=str, default=None, help="Filter to specific lesson file")
    parser.add_argument("--resolve", type=str, default=None, help="Resolve a specific question by ID")
    parser.add_argument("--resolve-all", action="store_true", help="Resolve all questions in the specified lesson")

    args = parser.parse_args()

    if args.resolve:
        resolve_question(args.resolve, args.lesson)
    elif args.resolve_all:
        if not args.lesson:
            sys.exit("Error: --resolve-all requires --lesson <path>")
        resolve_all_in_lesson(args.lesson)
    else:
        list_questions(args.lesson, as_json=args.json)


if __name__ == "__main__":
    main()
