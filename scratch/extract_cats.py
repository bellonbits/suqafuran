import json

def extract_categories():
    try:
        with open('/Users/mac/suqafuran/categories_response.txt', 'r') as f:
            lines = f.readlines()
            # The JSON starts after the headers (line 10 in the previous view)
            # Find the line that starts with '['
            json_str = ""
            for line in lines:
                if line.strip().startswith('['):
                    json_str = line.strip()
                    break
            
            if not json_str:
                print("Could not find JSON in file")
                return

            data = json.loads(json_str)
            
            output = ["SUQAFURAN FULL CATEGORY HIERARCHY FOR TRANSLATION", "===================================================\n"]
            
            for cat in data:
                output.append(f"[{cat.get('name_en', 'Unknown')}]")
                subcategories = cat.get('subcategories', [])
                for sub in subcategories:
                    output.append(f"  > {sub.get('name_en', 'Unknown')}")
                    subsubs = sub.get('subsubcategories', [])
                    for subsub in subsubs:
                        output.append(f"    - {subsub.get('name_en', 'Unknown')}")
                output.append("") # Spacer
                
            with open('/Users/mac/suqafuran/subcategories_for_translation.txt', 'w') as out_f:
                out_f.write("\n".join(output))
            print("Successfully created subcategories_for_translation.txt")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    extract_categories()
