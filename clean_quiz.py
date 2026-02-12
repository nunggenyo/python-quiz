import json
from pathlib import Path


def clean_quiz_structure(data):
    """
    Converts:
    - answer index → answer text
    - removes correct answer from options
    - removes outer 'questions' wrapper
    """
    if "questions" not in data:
        return None  # skip invalid format

    cleaned_questions = []

    for q in data["questions"]:
        correct_index = q["answer"]
        correct_answer_text = q["options"][correct_index]

        new_options = [
            option
            for i, option in enumerate(q["options"])
            if i != correct_index
        ]

        cleaned_questions.append({
            "question": q["question"],
            "options": new_options,
            "answer": correct_answer_text,
            "explanation": q.get("explanation", "")
        })

    return cleaned_questions


def process_folder(folder_path):
    folder = Path(folder_path)

    if not folder.exists():
        print("Folder does not exist.")
        return

    json_files = list(folder.glob("*.json"))

    if not json_files:
        print("No JSON files found.")
        return

    for file_path in json_files:
        try:
            with file_path.open("r", encoding="utf-8") as f:
                data = json.load(f)

            cleaned_data = clean_quiz_structure(data)

            if cleaned_data is None:
                print(f"Skipped (invalid format): {file_path.name}")
                continue

            # OVERWRITE original file
            with file_path.open("w", encoding="utf-8") as f:
                json.dump(cleaned_data, f, indent=2, ensure_ascii=False)

            print(f"Processed: {file_path.name}")

        except Exception as e:
            print(f"Error processing {file_path.name}: {e}")


if __name__ == "__main__":
#    folder_input = input("Enter folder path: ").strip()
    process_folder("public/day3")
