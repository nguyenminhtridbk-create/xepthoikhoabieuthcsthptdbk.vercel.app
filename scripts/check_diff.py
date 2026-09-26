# Compare vertical vs matrix
import csv

matrix_keys = set()
with open('data_csv/timetable_matrix.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        cname = row['Lớp'].strip()
        for d in range(2, 8):
            for p in range(1, 6):
                col = f"T{d}_T{p}"
                val = row[col].strip()
                if val:
                    matrix_keys.add((cname, d, p))

print("Matrix populated slots count:", len(matrix_keys))
