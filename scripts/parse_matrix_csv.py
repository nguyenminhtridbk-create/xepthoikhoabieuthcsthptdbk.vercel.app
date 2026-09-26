import csv
import re
import unicodedata
import json

# Load classes
classes = []
class_by_name = {}
with open('data_csv/classes.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        cname = row['TenLop'].strip()
        cid = row['MaLop'].strip().replace('-', '_') # cls_10cb1
        campus_raw = row['ĐiểmTrường'].strip()
        if 'chính' in campus_raw:
            campus_id = 'campus_main'
        elif 'Đốc Binh Kiều' in campus_raw:
            campus_id = 'campus_dbk'
        else:
            campus_id = 'campus_tk'
        
        grade_str = row['Khối'].replace('Khối', '').strip()
        grade = int(grade_str)
        grade_level = row['CấpHọc'].strip()
        shift = 'morning' if 'Sáng' in row['BuổiHọc'] else 'afternoon'
        
        info = {
            'id': cid,
            'name': cname,
            'grade': grade,
            'gradeLevel': grade_level,
            'campusId': campus_id,
            'shift': shift
        }
        classes.append(info)
        class_by_name[cname] = info

print(f"Loaded {len(classes)} classes")

# Load teachers
teachers = []
teacher_by_abbr = {}
teacher_by_name = {}
with open('data_csv/teachers.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        tid = row['MãID'].strip().replace('-', '_')
        fullname = row['TênGiáoViên'].strip()
        abbr = row['MãViếtTắt'].strip()
        dept = row['TổChuyênMôn'].strip()
        campus_raw = row['ĐiểmTrường'].strip()
        if 'chính' in campus_raw:
            campus_id = 'campus_main'
        elif 'Đốc Binh Kiều' in campus_raw:
            campus_id = 'campus_dbk'
        else:
            campus_id = 'campus_tk'
        
        tinfo = {
            'id': tid,
            'fullName': fullname,
            'abbr': abbr,
            'dept': dept,
            'campusId': campus_id
        }
        teachers.append(tinfo)
        teacher_by_abbr[abbr] = tinfo
        # Also clean abbr like "Tùng.CV (10CB1)" -> match "Tùng.CV" or exact
        base_abbr = abbr.split(' ')[0]
        if base_abbr not in teacher_by_abbr:
            teacher_by_abbr[base_abbr] = tinfo
        teacher_by_name[fullname] = tinfo

print(f"Loaded {len(teachers)} teachers")

# Load subjects
subjects = []
sub_by_name = {}
with open('data_csv/subjects.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        sid = row['MãMôn'].strip().replace('-', '_')
        sname = row['TênMônHọc'].strip()
        sub_by_name[sname] = sid
        sub_by_name[row['TênViếtTắt'].strip()] = sid

print(f"Loaded {len(sub_by_name)} subject mappings")

# Parse timetable matrix
days = [
    (2, ['T2_T1', 'T2_T2', 'T2_T3', 'T2_T4', 'T2_T5']),
    (3, ['T3_T1', 'T3_T2', 'T3_T3', 'T3_T4', 'T3_T5']),
    (4, ['T4_T1', 'T4_T2', 'T4_T3', 'T4_T4', 'T4_T5']),
    (5, ['T5_T1', 'T5_T2', 'T5_T3', 'T5_T4', 'T5_T5']),
    (6, ['T6_T1', 'T6_T2', 'T6_T3', 'T6_T4', 'T6_T5']),
    (7, ['T7_T1', 'T7_T2', 'T7_T3', 'T7_T4', 'T7_T5']),
]

slots = []
unmatched_cells = []
all_parsed_teachers = set()

with open('data_csv/timetable_matrix.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        cname = row['Lớp'].strip()
        cinfo = class_by_name.get(cname)
        if not cinfo:
            print(f"Class not found: {cname}")
            continue
        
        for day_num, period_cols in days:
            for p_idx, col in enumerate(period_cols):
                period_num = p_idx + 1
                cell = row[col].strip()
                if not cell:
                    continue
                
                # Cell format: "MônHọc (GiáoViên)" e.g. "Chào cờ (Tùng.CV (10CB1))" or "Tiếng Anh (Thi.VTH)"
                # Regex: match everything before the outer parenthesis of teacher
                m = re.match(r'^(.*?)\s*\(([^)]+(?:\([^)]+\))?)\)$', cell)
                if not m:
                    print(f"Failed to parse cell: '{cell}' for class {cname} {col}")
                    unmatched_cells.append(cell)
                    continue
                
                sub_str = m.group(1).strip()
                t_str = m.group(2).strip()
                
                # Find teacher
                tinfo = teacher_by_abbr.get(t_str)
                if not tinfo:
                    # try base abbr
                    base_t = t_str.split(' ')[0]
                    tinfo = teacher_by_abbr.get(base_t)
                
                if not tinfo:
                    print(f"Teacher not found for string: '{t_str}' in cell '{cell}'")
                    unmatched_cells.append(cell)
                    continue
                
                all_parsed_teachers.add(tinfo['id'])
                
                # Map subject ID
                sid = sub_by_name.get(sub_str)
                if not sid:
                    if 'KHTN' in sub_str or 'Khoa học tự nhiên' in sub_str:
                        sid = 'sub_khtn_cs'
                    elif 'LS' in sub_str or 'Lịch sử và Địa lí' in sub_str:
                        sid = 'sub_lsdl_cs'
                    elif 'Chào cờ' in sub_str:
                        sid = 'sub_chao_co'
                    elif 'Sinh hoạt lớp' in sub_str:
                        sid = 'sub_shl'
                    elif 'HĐTNHN (Chuyên đề)' in sub_str:
                        sid = 'sub_hdtn_cd'
                    elif 'HĐTNHN (Quy mô lớp)' in sub_str:
                        sid = 'sub_hdtn_qml'
                    elif 'Toán' in sub_str:
                        sid = 'sub_toan'
                    elif 'Văn' in sub_str:
                        sid = 'sub_van'
                    elif 'Anh' in sub_str:
                        sid = 'sub_anh'
                    elif 'Lí' in sub_str or 'Vật lí' in sub_str:
                        sid = 'sub_li'
                    elif 'Hóa' in sub_str or 'Hóa học' in sub_str:
                        sid = 'sub_hoa'
                    elif 'Sinh' in sub_str or 'Sinh học' in sub_str:
                        sid = 'sub_sinh'
                    elif 'Sử' in sub_str or 'Lịch sử' in sub_str:
                        sid = 'sub_su'
                    elif 'Địa' in sub_str or 'Địa lí' in sub_str:
                        sid = 'sub_dia'
                    elif 'GDCD' in sub_str or 'Giáo dục công dân' in sub_str:
                        sid = 'sub_gdcd'
                    elif 'GDKT' in sub_str or 'KT & PL' in sub_str:
                        sid = 'sub_gdktpl'
                    elif 'Tin' in sub_str or 'Tin học' in sub_str:
                        sid = 'sub_tin'
                    elif 'Công nghệ' in sub_str:
                        sid = 'sub_cn'
                    elif 'thể chất' in sub_str or 'GDTC' in sub_str:
                        sid = 'sub_gdtc'
                    elif 'GDQP' in sub_str or 'QPAN' in sub_str:
                        sid = 'sub_gdqp'
                    elif 'Âm nhạc' in sub_str:
                        sid = 'sub_am_nhac'
                    elif 'Mỹ thuật' in sub_str:
                        sid = 'sub_my_thuat'
                    else:
                        print(f"Unknown subject: {sub_str}")
                        sid = 'sub_chao_co'
                
                # Check room
                campus_id = cinfo['campusId']
                if campus_id == 'campus_main':
                    room_id = 'room_main_tin' if 'Tin' in sub_str else ('room_main_gym' if 'thể chất' in sub_str or 'GDQP' in sub_str else f"room_main_{cname.lower()}")
                elif campus_id == 'campus_dbk':
                    room_id = 'room_dbk_tin' if 'Tin' in sub_str else f"room_dbk_{cname.lower()}"
                else:
                    room_id = 'room_tk_tin' if 'Tin' in sub_str else f"room_tk_{cname.lower()}"
                
                is_flag = 'Chào cờ' in sub_str
                is_shl = 'Sinh hoạt lớp' in sub_str
                
                slots.append({
                    'id': f"slot_w2_{cname.lower()}_d{day_num}_p{period_num}",
                    'weekNumber': 2,
                    'dayOfWeek': day_num,
                    'periodNumber': period_num,
                    'shift': cinfo['shift'],
                    'classId': cinfo['id'],
                    'className': cname,
                    'subjectId': sid,
                    'subjectName': sub_str,
                    'teacherId': tinfo['id'],
                    'teacherName': tinfo['fullName'],
                    'teacherAbbr': tinfo['abbr'],
                    'campusId': campus_id,
                    'roomId': room_id,
                    'termId': 'HK1_2026_2027',
                    'isLocked': is_flag or is_shl,
                    'isFlagSalute': is_flag,
                    'isClassMeeting': is_shl,
                })

print(f"Successfully parsed {len(slots)} timetable slots from matrix!")
print(f"Unmatched cells: {len(unmatched_cells)}")
print(f"Unique teachers in schedule: {len(all_parsed_teachers)}")
