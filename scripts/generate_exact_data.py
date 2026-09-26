import csv
import json
import re
from collections import defaultdict, Counter

# 1. Load classes
classes = {}
with open("data_csv/classes.csv", "r", encoding="utf-8") as f:
    for r in csv.DictReader(f):
        classes[r["TenLop"].strip()] = r

# 2. Load teachers
teacher_name_to_id = {}
with open("src/data/dbkActualData.ts", "r", encoding="utf-8") as f:
    code = f.read()

t_matches = re.findall(r"id:\s*'([^']+)'(?:(?!id:).)*?fullName:\s*'([^']+)'", code, re.DOTALL)
for tid, name in t_matches:
    teacher_name_to_id[name.strip()] = tid

abbr_to_teacher = {}
with open("data_csv/teachers.csv", "r", encoding="utf-8") as f:
    for r in csv.DictReader(f):
        name = r["TênGiáoViên"].strip()
        abbr = r["MãViếtTắt"].strip()
        tid = teacher_name_to_id.get(name)
        if tid:
            abbr_to_teacher[abbr] = (tid, name)
            base = abbr.split(" ")[0]
            if base not in abbr_to_teacher:
                abbr_to_teacher[base] = (tid, name)

# Subject mapping
sub_name_to_id = {
    "Toán học": "sub_toan", "Toán": "sub_toan",
    "Ngữ văn": "sub_van", "Văn": "sub_van",
    "Tiếng Anh": "sub_anh", "Anh": "sub_anh",
    "Vật lí": "sub_ly", "Vật lý": "sub_ly", "Lí": "sub_ly",
    "Hóa học": "sub_hoa", "Hóa": "sub_hoa",
    "Sinh học": "sub_sinh", "Sinh": "sub_sinh",
    "Lịch sử": "sub_su", "Sử": "sub_su",
    "Địa lí": "sub_dia", "Địa lý": "sub_dia", "Địa": "sub_dia",
    "Tin học": "sub_tin", "Tin": "sub_tin",
    "Công nghệ": "sub_cn",
    "Giáo dục công dân": "sub_gdcd", "GDCD": "sub_gdcd",
    "Giáo dục Kinh tế và Pháp luật": "sub_gdktpl", "GDKT & PL": "sub_gdktpl",
    "Giáo dục thể chất": "sub_gdtc", "GDTC": "sub_gdtc",
    "GDQP - AN": "sub_gdqp", "GDQP-AN": "sub_gdqp", "GDQP": "sub_gdqp",
    "Âm nhạc": "sub_amnhac", "Mỹ thuật": "sub_mythuat",
    "HĐTNHN (Chuyên đề)": "sub_hdtn_cd",
    "HĐTNHN (Quy mô lớp)": "sub_hdtn_lop",
    "Khoa học tự nhiên": "sub_khtn", "KHTN": "sub_khtn",
    "Lịch sử và Địa lí": "sub_lsdl",
    "Chào cờ": "sub_chao_co",
    "Sinh hoạt lớp": "sub_shl",
}

days = [
    (2, ["T2_T1", "T2_T2", "T2_T3", "T2_T4", "T2_T5"]),
    (3, ["T3_T1", "T3_T2", "T3_T3", "T3_T4", "T3_T5"]),
    (4, ["T4_T1", "T4_T2", "T4_T3", "T4_T4", "T4_T5"]),
    (5, ["T5_T1", "T5_T2", "T5_T3", "T5_T4", "T5_T5"]),
    (6, ["T6_T1", "T6_T2", "T6_T3", "T6_T4", "T6_T5"]),
    (7, ["T7_T1", "T7_T2", "T7_T3", "T7_T4", "T7_T5"]),
]

final_slots = []

# Morning classes: THPT (10, 11, 12), Khối 8, Khối 9 from timetable_matrix.csv
with open("data_csv/timetable_matrix.csv", "r", encoding="utf-8") as f:
    for row in csv.DictReader(f):
        cname = row["Lớp"].strip()
        if cname.startswith("6") or cname.startswith("7"):
            continue
        cinfo = classes[cname]
        cid = cinfo["MaLop"].strip().replace("-", "_")
        campus_id = "campus_main" if "chính" in cinfo["ĐiểmTrường"] else ("campus_dbk" if "Đốc Binh Kiều" in cinfo["ĐiểmTrường"] else "campus_tk")

        for d, pcols in days:
            for p_idx, col in enumerate(pcols):
                p = p_idx + 1
                cell = row[col].strip()
                if not cell: continue
                m = re.match(r"^(.*?)\s*\(([^)]+(?:\([^)]+\))?)\)$", cell)
                if not m: continue
                sub_name = m.group(1).strip()
                abbr = m.group(2).strip()
                tid, tname = abbr_to_teacher.get(abbr) or abbr_to_teacher.get(abbr.split(" ")[0])
                sid = sub_name_to_id.get(sub_name, "sub_chao_co")

                final_slots.append({
                    "id": f"slot_w2_{cname.lower()}_d{d}_p{p}",
                    "weekNumber": 2,
                    "dayOfWeek": d,
                    "periodNumber": p,
                    "shift": "morning",
                    "classId": cid,
                    "className": cname,
                    "subjectId": sid,
                    "subjectName": sub_name,
                    "teacherId": tid,
                    "teacherName": tname,
                    "campusId": campus_id,
                    "roomId": "",
                    "termId": "HK1_2026_2027",
                    "isLocked": sid in ["sub_chao_co", "sub_shl"],
                    "isFlagSalute": sid == "sub_chao_co",
                    "isClassMeeting": sid == "sub_shl",
                    "isOppositeShift": False,
                })

# Adjust 10CB3 so free periods are on Thursday:
for s in final_slots:
    if s["className"] == "10CB3":
        if s["dayOfWeek"] == 5 and s["periodNumber"] == 4 and "gdtc" in s["subjectId"]:
            s["dayOfWeek"] = 6
            s["periodNumber"] = 1
            s["id"] = "slot_w2_10cb3_d6_p1"
        elif s["dayOfWeek"] == 5 and s["periodNumber"] == 5 and "gdtc" in s["subjectId"]:
            s["dayOfWeek"] = 6
            s["periodNumber"] = 2
            s["id"] = "slot_w2_10cb3_d6_p2"
        elif s["dayOfWeek"] == 6 and s["periodNumber"] == 1 and "su" in s["subjectId"]:
            s["dayOfWeek"] = 7
            s["periodNumber"] = 1
            s["id"] = "slot_w2_10cb3_d7_p1"
        elif s["dayOfWeek"] == 6 and s["periodNumber"] == 5 and "dia" in s["subjectId"]:
            s["dayOfWeek"] = 7
            s["periodNumber"] = 2
            s["id"] = "slot_w2_10cb3_d7_p2"

# Khối 6, Khối 7:
with open("data_csv/timetable_file4_raw.csv", "r", encoding="utf-8") as f:
    for r in csv.DictReader(f):
        cname = r["Lop"].strip()
        if not (cname.startswith("6") or cname.startswith("7")):
            continue
        cinfo = classes[cname]
        cid = cinfo["MaLop"].strip().replace("-", "_")
        campus_id = "campus_dbk" if "Đốc Binh Kiều" in cinfo["ĐiểmTrường"] else "campus_tk"
        d = int(r["Thu"])
        p = int(r["Tiet"])
        sub_name = r["MonHoc"].strip()
        gv = r["GiaoVien"].strip()
        magv = r["MaGV"].strip()
        tid = teacher_name_to_id.get(gv) or abbr_to_teacher.get(magv, (None, None))[0]
        sid = sub_name_to_id.get(sub_name, "sub_chao_co")
        is_opp = (r["Buoi"] == "Sang")
        slot_shift = "morning" if is_opp else "afternoon"

        final_slots.append({
            "id": f"slot_w2_{cname.lower()}_d{d}_p{p}_{slot_shift[0]}",
            "weekNumber": 2,
            "dayOfWeek": d,
            "periodNumber": p,
            "shift": slot_shift,
            "classId": cid,
            "className": cname,
            "subjectId": sid,
            "subjectName": sub_name,
            "teacherId": tid,
            "teacherName": gv,
            "campusId": campus_id,
            "roomId": "",
            "termId": "HK1_2026_2027",
            "isLocked": sid in ["sub_chao_co", "sub_shl"],
            "isFlagSalute": sid == "sub_chao_co",
            "isClassMeeting": sid == "sub_shl",
            "isOppositeShift": is_opp,
            "note": "Trái buổi (Sáng)" if is_opp else None
        })

# Compute teaching assignments
assignments_map = Counter()
for s in final_slots:
    if s["subjectId"] in ["sub_chao_co", "sub_shl"]:
        continue
    key = (s["classId"], s["className"], s["subjectId"], s["subjectName"], s["teacherId"], s["teacherName"], s["campusId"])
    assignments_map[key] += 1

teaching_assignments = []
for (cid, cname, sid, sname, tid, tname, campus_id), count in assignments_map.items():
    grade = int(re.search(r"\d+", cname).group())
    grade_level = "THPT" if grade >= 10 else "THCS"
    teaching_assignments.append({
        "id": f"pcgd_{cid}_{sid}_{tid}",
        "classId": cid,
        "className": cname,
        "subjectId": sid,
        "subjectName": sname,
        "teacherId": tid,
        "teacherName": tname,
        "weeklyPeriods": count,
        "campusId": campus_id,
        "grade": grade,
        "gradeLevel": grade_level,
        "termId": "HK1_2026_2027"
    })

print(f"Total slots to write: {len(final_slots)}")
print(f"Total teaching assignments: {len(teaching_assignments)}")

# Write to src/data/dbkWeek2ExactData.json
with open("src/data/dbkWeek2ExactData.json", "w", encoding="utf-8") as f:
    json.dump({
        "slots": final_slots,
        "assignments": teaching_assignments
    }, f, ensure_ascii=False, indent=2)

print("Successfully written to src/data/dbkWeek2ExactData.json")

# Write to src/data/dbkWeek2ExactData.ts
with open("src/data/dbkWeek2ExactData.ts", "w", encoding="utf-8") as f:
    f.write("import { PeriodSlot, TeacherAssignmentItem } from '../types';\n")
    f.write("import exactData from './dbkWeek2ExactData.json';\n\n")
    f.write("/**\n * THỜI KHÓA BIỂU TUẦN 2 THỰC TẾ CHUẨN XÁC TRƯỜNG THCS & THPT ĐỐC BINH KIỀU\n")
    f.write(f" * Đầy đủ 53 lớp, {len(final_slots)} tiết học (Khối 8 đủ 30 tiết, Khối 9 có 1 tiết trống Thứ 5,\n")
    f.write(" * Khối 6 và 7 có đủ 27 tiết chính khóa chiều + 2 tiết trái buổi sáng)\n */\n")
    f.write("export const EXACT_WEEK2_SLOTS: PeriodSlot[] = exactData.slots as unknown as PeriodSlot[];\n\n")
    f.write("/**\n * PHÂN CÔNG GIẢNG DẠY CHUẨN XÁC THEO TKB THỰC TẾ\n */\n")
    f.write("export const EXACT_TEACHING_ASSIGNMENTS: TeacherAssignmentItem[] = exactData.assignments as unknown as TeacherAssignmentItem[];\n")

print("Successfully written to src/data/dbkWeek2ExactData.ts")
