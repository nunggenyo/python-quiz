import json
from pathlib import Path

# --- CONFIGURATION ---
folder_path = Path("public/day1/")  # Folder containing JSON files
file_name = None  # Set to "set3.json" to process a single file, or None for all files

# Function to process a single JSON file
def process_json_file(json_file: Path):
    try:
        data = json.loads(json_file.read_text(encoding="utf-8"))
        for item in data:
            answer = item.get("answer")
            if "options" in item and answer is not None:
                # Remove options that are exactly the same as the answer
                item["options"] = [opt for opt in item["options"] if opt != answer]

        # Save changes back to the same file
        json_file.write_text(json.dumps(data, indent=2, ensure_ascii=False))
        print(f"Updated: {json_file.name}")
    except Exception as e:
        print(f"Failed to process {json_file.name}: {e}")

# --- MAIN ---
if file_name:
    json_file = folder_path / file_name
    if json_file.exists():
        process_json_file(json_file)
    else:
        print(f"File not found: {json_file}")
else:
    for json_file in folder_path.glob("*.json"):
        process_json_file(json_file)

print("Processing completed.")
