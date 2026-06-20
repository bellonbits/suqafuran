import os
import re

versions_dir = '/Users/mac/suqafuran/backend/alembic/versions'
files = [f for f in os.listdir(versions_dir) if f.endswith('.py')]

print(f"Found {len(files)} migration files.")
migrations = []

for file in files:
    path = os.path.join(versions_dir, file)
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract revision
    rev_match = re.search(r"^revision\s*=\s*['\"]([^'\"]+)['\"]", content, re.MULTILINE)
    down_rev_match = re.search(r"^down_revision\s*=\s*([^\n]+)", content, re.MULTILINE)
    
    rev = rev_match.group(1) if rev_match else None
    
    down_rev_str = down_rev_match.group(1).strip() if down_rev_match else 'None'
    # Parse down_revision to tuple or string or None
    if down_rev_str == 'None':
        down_rev = None
    elif down_rev_str.startswith('('):
        down_rev = eval(down_rev_str)
    else:
        down_rev = down_rev_str.strip("'\"")
        
    migrations.append({
        'file': file,
        'revision': rev,
        'down_revision': down_rev
    })

print("\nAll Migrations:")
for m in sorted(migrations, key=lambda x: str(x['down_revision'])):
    print(f"Revision: {m['revision']} | Down: {m['down_revision']} | File: {m['file']}")
