from pathlib import Path
import json
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
MARKS = {
    '01-按岗位查看': [(174, 54, 372, 96), (182, 101, 399, 145), (1161, 390, 1229, 423)],
    '02-岗位适用标准': [(362, 224, 1586, 302), (1461, 156, 1587, 198)],
    '03-按标准查看': [(174, 54, 372, 96), (1200, 199, 1385, 537)],
    '04-共用新建编辑页': [(177, 133, 341, 394)],
    '05-默认关联岗位': [(380, 338, 1570, 481)],
    '06-暂不关联': [(597, 283, 687, 315)],
}

(ROOT / 'images').mkdir(exist_ok=True)
(ROOT / 'annotations').mkdir(exist_ok=True)
metadata = []
for name, boxes in MARKS.items():
    source = ROOT / 'raw' / (name + '.jpg')
    image = Image.open(source).convert('RGB')
    draw = ImageDraw.Draw(image)
    for box in boxes:
        draw.rectangle(box, outline='#ed1c0a', width=3)
    image.save(ROOT / 'images' / (name + '.png'))
    width, height = image.size
    rects = ''.join(f'<rect x="{x}" y="{y}" width="{r-x}" height="{b-y}" fill="none" stroke="#ed1c0a" stroke-width="3"/>' for x,y,r,b in boxes)
    (ROOT / 'annotations' / (name + '.svg')).write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}">{rects}</svg>')
    metadata.append({'name': name, 'size': [width, height], 'rectangles': boxes})
(ROOT / 'annotations.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2))

thumbs = []
for name in MARKS:
    image = Image.open(ROOT / 'images' / (name + '.png'))
    image.thumbnail((760, 401))
    thumbs.append(image)
sheet = Image.new('RGB', (1520, 1203), '#dddddd')
for index, thumbnail in enumerate(thumbs):
    sheet.paste(thumbnail, ((index % 2) * 760, (index // 2) * 401))
sheet.save(ROOT / 'contact-sheet.jpg', quality=90)
