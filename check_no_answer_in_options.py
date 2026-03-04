import os
import json

folder_path = r"add/day1/"
json_files = [f for f in os.listdir(folder_path) if f.endswith('.json')]

for filename in json_files:
    file_path = os.path.join(folder_path, filename)
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except UnicodeDecodeError:
        try:
            with open(file_path, 'r', encoding='cp1252') as f:
                data = json.load(f)
            print(f"[FIX via cp1252] {filename}")
        except Exception as e:
            print(f"[GAGAL] {filename}: {e}")
            continue
    except json.JSONDecodeError as e:
        print(f"[ERROR JSON] {filename}: {e}")
        continue
    
    has_issue = False
    for idx, q in enumerate(data):
        opts = q.get("options", [])
        ans = q.get("answer", "")
        if ans in opts:
            print(f"[ISSUE] {filename} soalan {idx+1}: '{ans}' ada dalam options")
            has_issue = True
    
    if not has_issue:
        print(f"[OK] {filename} bersih")