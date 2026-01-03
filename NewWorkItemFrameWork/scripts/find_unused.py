import os
import re

SEARCH_DIR = './packages'
EXTENSIONS = {'.ts', '.tsx', '.js', '.jsx'}

def get_files():
    files = []
    if not os.path.exists(SEARCH_DIR):
        print(f"Error: {SEARCH_DIR} does not exist.")
        return []
    for root, _, filenames in os.walk(SEARCH_DIR):
        for f in filenames:
            if any(f.endswith(ext) for ext in EXTENSIONS):
                files.append(os.path.join(root, f))
    return files

def main():
    all_files = get_files()
    if not all_files:
        print("No files found.")
        return

    # Read all contents
    file_contents = {}
    for f in all_files:
        try:
            with open(f, 'r', encoding='utf-8', errors='ignore') as fd:
                file_contents[f] = fd.read()
        except Exception as e:
            print(f"Error reading {f}: {e}")

    print("--- POTENTIALLY UNUSED FILES ---")
    
    # Analysis
    for target_path in all_files:
        basename = os.path.splitext(os.path.basename(target_path))[0]
        
        # Skip index files for now as their usage pattern is different (directory import)
        if basename == 'index':
            continue
            
        is_used = False
        # Search in all OTHER files
        for source_path, content in file_contents.items():
            if source_path == target_path:
                continue
            
            # Regex search for whole word match
            if re.search(r'\b' + re.escape(basename) + r'\b', content):
                is_used = True
                break
        
        if not is_used:
            print(target_path)

if __name__ == '__main__':
    main()
