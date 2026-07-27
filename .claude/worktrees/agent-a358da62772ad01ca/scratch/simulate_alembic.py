import os
import re

versions_dir = '/Users/mac/suqafuran/backend/alembic/versions'

# We'll simulate our changes:
# 1. Rename 'a1b2c3d4e5f6' in a1b2c3d4e5f6_add_otp_log_table.py to 'otp_log_001'
# 2. Add 'merge_heads_003' with down_revisions: ['sold_tracking_001', 'anti_scam_init_001']

files = [f for f in os.listdir(versions_dir) if f.endswith('.py')]
nodes = {}
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
        
    # Apply simulation changes
    if file == 'a1b2c3d4e5f6_add_otp_log_table.py':
        rev = 'otp_log_001'
        
    nodes[rev] = {
        'file': file,
        'down_revisions': down_revs
    }

# Add simulated merge_heads_003
nodes['merge_heads_003'] = {
    'file': 'merge_heads_003.py',
    'down_revisions': ['sold_tracking_001', 'anti_scam_init_001']
}

# Recalculate children
for rev, details in nodes.items():
    for dr in details['down_revisions']:
        children.add(dr)

print("Simulated Nodes in Graph:")
for rev, details in nodes.items():
    print(f"  {rev} -> {details['down_revisions']}")

heads = [rev for rev in nodes if rev not in children]
print("\nSimulated Heads:")
for h in heads:
    print(f"  {h}")
