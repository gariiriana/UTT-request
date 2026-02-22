import os
import re

directory = r'c:\Users\Gari Iriana\Downloads\United Transworld\src\components\ui'
pattern = re.compile(r'(@[a-zA-Z0-9\-/]+)@\d+\.\d+\.\d+')

for root, dirs, files in os.walk(directory):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = pattern.sub(r'\1', content)
            
            if new_content != content:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f'Fixed imports in {path}')
