import re
import os

files = [
    'scripts/table_thpt.txt',
    'scripts/table_k6.txt',
    'scripts/table_k7.txt',
    'scripts/table_k8.txt',
    'scripts/table_k9.txt'
]

all_entries = []
classes_found = set()
teachers_found = set()
subjects_found = set()

pattern = re.compile(r'\|\s*\*\*?([0-9]{1,2}(?:A|CB)[0-9]{1,2})\*\*?\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*(?:Tiết\s*)?([1-5])\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|')

for f in files:
    if not os.path.exists(f):
        print(f"File missing: {f}")
        continue
    with open(f, 'r', encoding='utf-8') as fh:
        for line in fh:
            m = pattern.search(line)
            if m:
                cls = m.group(1).strip()
                thu = m.group(2).strip()
                session = m.group(3).strip()
                period = int(m.group(4).strip())
                subject = m.group(5).strip()
                teacher_name = m.group(6).strip()
                teacher_code = m.group(7).strip()
                
                classes_found.add(cls)
                teachers_found.add(teacher_name)
                subjects_found.add(subject)
                all_entries.append({
                    'class': cls,
                    'day': thu,
                    'session': session,
                    'period': period,
                    'subject': subject,
                    'teacher_name': teacher_name,
                    'teacher_code': teacher_code
                })

print(f"Total slots parsed: {len(all_entries)}")
print(f"Total unique classes: {len(classes_found)}")
print(f"Classes: {sorted(list(classes_found))}")
print(f"Total unique teachers: {len(teachers_found)}")
print(f"Total unique subjects: {len(subjects_found)}")
print(f"Subjects: {sorted(list(subjects_found))}")
