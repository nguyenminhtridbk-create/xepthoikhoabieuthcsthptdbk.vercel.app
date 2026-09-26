import re
import json

files = [
    'scripts/table_thpt.txt',
    'scripts/table_k6.txt',
    'scripts/table_k7.txt',
    'scripts/table_k8.txt',
    'scripts/table_k9.txt'
]

pattern = re.compile(r'\|\s*\*\*?([0-9]{1,2}(?:A|CB)[0-9]{1,2})\*\*?\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*(?:Tiết\s*)?([1-5])\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|')

# Read dbkActualData.ts to get teachers, classes, subjects
with open('src/data/dbkActualData.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Parse teacher names and IDs
teacher_id_by_name = {}
# Find teachers like { id: 'gv_xxx', fullName: '...' }
t_matches = re.findall(r"id:\s*'([^']+)',\s*fullName:\s*'([^']+)'", content)
for tid, name in t_matches:
    teacher_id_by_name[name.strip()] = tid

# Subject mapping
sub_map = {
    'Toán học': 'sub_toan',
    'Ngữ văn': 'sub_van',
    'Tiếng Anh': 'sub_anh',
    'Vật lí': 'sub_ly',
    'Hóa học': 'sub_hoa',
    'Sinh học': 'sub_sinh',
    'Lịch sử': 'sub_su',
    'Địa lí': 'sub_dia',
    'Tin học': 'sub_tin',
    'Công nghệ': 'sub_cn',
    'Giáo dục công dân': 'sub_gdcd',
    'Giáo dục KT & PL': 'sub_gdktpl',
    'Giáo dục thể chất': 'sub_gdtc',
    'GDQP - AN': 'sub_gdqp',
    'Âm nhạc': 'sub_amnhac',
    'Mỹ thuật': 'sub_mythuat',
    'HĐTNHN (Chuyên đề)': 'sub_hdtn_cd',
    'HĐTNHN (Quy mô lớp)': 'sub_hdtn_lop',
    'Khoa học tự nhiên': 'sub_khtn',
    'Lịch sử và Địa lí': 'sub_lsdl',
    'Chào cờ': 'sub_chao_co',
    'Sinh hoạt lớp': 'sub_shl'
}

day_map = {
    'Thứ 2': 2,
    'Thứ 3': 3,
    'Thứ 4': 4,
    'Thứ 5': 5,
    'Thứ 6': 6,
    'Thứ 7': 7
}

missing_teachers = set()
all_slots = []

for fpath in files:
    with open(fpath, 'r', encoding='utf-8') as fh:
        for line in fh:
            m = pattern.search(line)
            if m:
                cls_name = m.group(1).strip()
                thu = m.group(2).strip()
                session = m.group(3).strip()
                period = int(m.group(4).strip())
                subject = m.group(5).strip()
                tname = m.group(6).strip()
                tcode = m.group(7).strip()
                
                tid = teacher_id_by_name.get(tname)
                if not tid:
                    missing_teachers.add((tname, tcode))
                
                all_slots.append({
                    'class_name': cls_name,
                    'day': thu,
                    'day_num': day_map.get(thu, 2),
                    'shift': 'morning' if 'Sáng' in session else 'afternoon',
                    'period': period,
                    'subject': subject,
                    'subject_id': sub_map.get(subject, 'sub_chao_co'),
                    'teacher_name': tname,
                    'teacher_code': tcode,
                    'teacher_id': tid
                })

print(f"Total parsed: {len(all_slots)}")
print(f"Missing teachers: {len(missing_teachers)}")
for t in sorted(list(missing_teachers)):
    print(t)
