import re

# We can read the user prompt from transcript or extract the vertical data from the conversation
# Let's see if we can extract File 4 and File 6 from the raw transcript or write a parser
import json

with open('/.aistudio/artifacts/brain/69804998-896f-41ed-aaee-9886787001f9/.system_generated/logs/transcript.jsonl', 'r', encoding='utf-8') as f:
    lines = f.readlines()

last_user_msg = ""
for line in reversed(lines):
    data = json.loads(line)
    if data.get('role') == 'user':
        last_user_msg = data.get('content', '')
        break

print("Found last user msg length:", len(last_user_msg))

# Find the CSV blocks in the user message
csv_blocks = []
parts = last_user_msg.split('\n\n')
# Let's find sections starting with "STT"
lines_all = last_user_msg.split('\n')
current_csv = []
for l in lines_all:
    if l.startswith('"STT"') or l.startswith('﻿"STT"'):
        if current_csv:
            csv_blocks.append('\n'.join(current_csv))
            current_csv = []
    if l.startswith('"') or l.startswith('﻿"'):
        current_csv.append(l)

if current_csv:
    csv_blocks.append('\n'.join(current_csv))

print(f"Extracted {len(csv_blocks)} CSV blocks from user prompt:")
for i, b in enumerate(csv_blocks):
    first_line = b.split('\n')[0]
    total_l = len(b.split('\n'))
    print(f"Block {i+1}: {total_l} lines - Header: {first_line[:80]}")
    
    if i == 0:
        with open('data_csv/classes.csv', 'w', encoding='utf-8') as out:
            out.write(b)
    elif i == 1:
        with open('data_csv/teachers.csv', 'w', encoding='utf-8') as out:
            out.write(b)
    elif i == 2:
        with open('data_csv/subjects.csv', 'w', encoding='utf-8') as out:
            out.write(b)
    elif i == 3:
        with open('data_csv/timetable_vertical_file4.csv', 'w', encoding='utf-8') as out:
            out.write(b)
    elif i == 4:
        with open('data_csv/timetable_matrix.csv', 'w', encoding='utf-8') as out:
            out.write(b)
    elif i == 5:
        with open('data_csv/timetable_vertical_file6.csv', 'w', encoding='utf-8') as out:
            out.write(b)
