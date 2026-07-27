import os
import re

versions_dir = '/Users/mac/suqafuran/backend/alembic/versions'
files = [f for f in os.listdir(versions_dir) if f.endswith('.py')]

# Map of revision -> details
nodes = {}

# Revisions that are down_revisions
children = set()

for file in files:
    path = os.path.join(versions_dir, file)
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    rev_match = re.search(r"^revision\s*=\s*['\"]([^'\"]+)['\"]", content, re.MULTILINE)
    down_rev_match = re.search(r"^down_revision\s*=\s*([^\n]+)", content, re.MULTILINE)
    
    rev = rev_match.group(1) if rev_match else None
    if not rev:
        continue
        
    down_rev_str = down_rev_match.group(1).strip() if down_rev_match else 'None'
    if down_rev_str == 'None':
        down_revs = []
    elif down_rev_str.startswith('('):
        down_revs = [r.strip("'\" ") for r in down_rev_str.strip('()').split(',') if r.strip()]
    else:
        down_revs = [down_rev_str.strip("'\"")]
        
    nodes[rev] = {
        'file': file,
        'down_revisions': down_revs
    }
    for dr in down_revs:
        children.add(dr)

print("Nodes in Graph:")
for rev, details in nodes.items():
    print(f"  {rev} -> {details['down_revisions']} (File: {details['file']})")

heads = [rev for rev in nodes if rev not in children]
print("\nHeads (nodes with no child/dependent migration):")
for h in heads:
    print(f"  {h} (File: {nodes[h]['file']})")
