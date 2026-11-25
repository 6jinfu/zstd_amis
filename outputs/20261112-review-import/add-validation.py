from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import xml.etree.ElementTree as ET
import shutil

base = Path(__file__).parent
ns = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
ET.register_namespace('', ns)
target = base.parents[1] / 'app' / 'templates'
target.mkdir(exist_ok=True)
for name, col, asset in [('绩效数据导入模板.xlsx', 'D', 'review-performance.xlsx'), ('能力测评结果导入模板.xlsx', 'C', 'review-ability-score.xlsx')]:
    path = base / name
    with ZipFile(path) as z:
        entries = {item.filename: z.read(item.filename) for item in z.infolist()}
    root = ET.fromstring(entries['xl/worksheets/sheet1.xml'])
    old = root.find(f'{{{ns}}}dataValidations')
    if old is not None:
        root.remove(old)
    validations = ET.Element(f'{{{ns}}}dataValidations', count='1')
    rule = ET.SubElement(validations, f'{{{ns}}}dataValidation', type='custom', sqref=f'{col}9:{col}10008', allowBlank='1', showErrorMessage='1', showInputMessage='1', errorStyle='stop', errorTitle='得分格式错误', error='请输入 0–999 的数值，最多两位小数。', promptTitle='得分填写规则', prompt='允许 0 和 999，最多两位小数；空白不代表 0。')
    ET.SubElement(rule, f'{{{ns}}}formula1').text = f'AND(ISNUMBER({col}9),{col}9>=0,{col}9<=999,ROUND({col}9,2)={col}9)'
    # OOXML puts validation after conditional formatting and before print settings.
    next_tags = {'hyperlinks', 'printOptions', 'pageMargins', 'pageSetup', 'headerFooter', 'drawing', 'legacyDrawing', 'tableParts', 'extLst'}
    index = next((i for i, child in enumerate(root) if child.tag.split('}')[-1] in next_tags), len(root))
    root.insert(index, validations)
    entries['xl/worksheets/sheet1.xml'] = ET.tostring(root, encoding='utf-8', xml_declaration=True)
    with ZipFile(path, 'w', ZIP_DEFLATED) as z:
        for file, content in entries.items():
            z.writestr(file, content)
    shutil.copyfile(path, target / asset)
    print(name, '→', asset)
