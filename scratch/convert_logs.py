import os

def convert_to_utf8(src, dst):
    if not os.path.exists(src):
        print(f"Source {src} does not exist.")
        return
    try:
        with open(src, 'r', encoding='utf-16le') as f:
            content = f.read()
        with open(dst, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Successfully converted {src} to {dst}")
    except Exception as e:
        print(f"Error converting {src}: {e}")

convert_to_utf8('/Users/mac/suqafuran/backend/error.log', '/Users/mac/suqafuran/scratch/error_utf8.log')
convert_to_utf8('/Users/mac/suqafuran/backend/uvicorn_error.log', '/Users/mac/suqafuran/scratch/uvicorn_error_utf8.log')
convert_to_utf8('/Users/mac/suqafuran/backend/migration_error.txt', '/Users/mac/suqafuran/scratch/migration_error_utf8.log')
