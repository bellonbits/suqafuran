import os

def read_last_lines(filepath, num_lines=100):
    if not os.path.exists(filepath):
        print(f"File {filepath} does not exist.")
        return
    print(f"=== {os.path.basename(filepath)} ===")
    try:
        # Try UTF-16 first
        with open(filepath, 'r', encoding='utf-16') as f:
            lines = f.readlines()
            for line in lines[-num_lines:]:
                print(line, end='')
    except Exception as e1:
        try:
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                lines = f.readlines()
                for line in lines[-num_lines:]:
                    print(line, end='')
        except Exception as e2:
            print(f"Failed to read: {e1} | {e2}")

read_last_lines('/Users/mac/suqafuran/backend/error.log')
read_last_lines('/Users/mac/suqafuran/backend/uvicorn_error.log')
