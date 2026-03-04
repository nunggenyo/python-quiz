import json
from pathlib import Path


def load_json_with_fallback(file_path):
    """Try multiple encodings to load JSON safely."""
    encodings = ["utf-8", "utf-8-sig", "cp1252", "latin1"]

    for enc in encodings:
        try:
            with open(file_path, "r", encoding=enc) as f:
                return json.load(f)
        except UnicodeDecodeError:
            continue

    raise UnicodeDecodeError(
        "encoding", b"", 0, 0,
        f"Unable to decode file: {file_path.name}"
    )


def check_answers_in_options(folder_path: Path, file_name: str = None):

    if file_name:
        files = [folder_path / file_name]
    else:
        files = list(folder_path.glob("*.json"))

    for file_path in files:
        if not file_path.exists():
            print(f"[SKIP] File not found: {file_path}")
            continue

        try:
            data = load_json_with_fallback(file_path)

            if not isinstance(data, list):
                print(f"[SKIP] {file_path.name} is not a list of questions.")
                continue

            has_issue = False

            for idx, question in enumerate(data):
                answer = question.get("answer")
                options = question.get("options", [])

                if answer in options:
                    if not has_issue:
                        print(f"\n[AFFECTED FILE] {file_path.name}")
                        print("=" * 50)
                        has_issue = True

                    print(f"Question index : {idx}")
                    print(f"Answer         : {answer}")
                    print(f"Options        : {options}")
                    print("-" * 50)

            if not has_issue:
                print(f"[OK] {file_path.name} - No issues found.")

        except Exception as e:
            print(f"[ERROR] Failed to process {file_path.name}: {e}")


# =============================
folder_path = Path("add/day1/")
file_name = None
# =============================

check_answers_in_options(folder_path, file_name)
