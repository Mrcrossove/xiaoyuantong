import json
import re
from pathlib import Path

import xlrd


ROOT_DIR = Path(__file__).resolve().parents[1]
SOURCE_FILE = ROOT_DIR / "高校清单" / "普通高校完整清单.xls"
SCHOOLS_FILE = ROOT_DIR / "utils" / "schools.js"
GROUPS_FILE = ROOT_DIR / "utils" / "school-groups.js"


def js_module_export(value):
    return "module.exports = " + json.dumps(value, ensure_ascii=False, separators=(",", ":")) + ";\n"


def parse_school_data():
    book = xlrd.open_workbook(str(SOURCE_FILE))
    sheet = book.sheet_by_index(0)
    groups = []
    current_group = None
    school_names = []
    seen = set()

    for row_index in range(sheet.nrows):
        first_cell = str(sheet.cell_value(row_index, 0)).strip()
        school_name = str(sheet.cell_value(row_index, 1)).strip()

        group_match = re.match(r"^(.+?)（\d+所）$", first_cell)
        if group_match:
            current_group = {
                "province": group_match.group(1),
                "schools": []
            }
            groups.append(current_group)
            continue

        if not school_name or school_name == "学校名称":
            continue

        first_value = sheet.cell_value(row_index, 0)
        if not isinstance(first_value, float) or not first_value.is_integer():
            continue

        if school_name in seen:
            continue

        seen.add(school_name)
        school_names.append(school_name)
        if current_group:
            current_group["schools"].append(school_name)

    return school_names, groups


def main():
    school_names, groups = parse_school_data()
    SCHOOLS_FILE.write_text(
        'const groups = require("./school-groups");\n\n'
        "module.exports = groups.reduce((result, group) => result.concat(group.schools), []);\n",
        encoding="utf-8"
    )
    GROUPS_FILE.write_text(js_module_export(groups), encoding="utf-8")
    print(f"Generated {len(school_names)} schools in {len(groups)} province groups.")


if __name__ == "__main__":
    main()
