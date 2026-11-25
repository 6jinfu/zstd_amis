from pathlib import Path
from PIL import Image, ImageDraw
root = Path('deliverables/frontend-review')
out = Path('deliverables/20261116-standard-ai-1127/annotated')
out.mkdir(exist_ok=True)
items = [
 ('2026-11-04-hide-standard-brief/review-hidden.png', '01-settings.png', [(401, 129, 1198, 534), (400, 550, 1198, 690)]),
 ('2026-11-04-description-structure/desktop.png', '02-preferences.png', [(303, 128, 1090, 706), (303, 730, 1090, 890)]),
 ('2026-10-29-ai-priority/rank.png', '03-rank.png', [(401, 258, 1198, 716)]),
 ('2026-10-29-ai-priority/compare.png', '04-score.png', [(400, 116, 1198, 706)]),
 ('2026-10-29-ai-priority/final-order.png', '05-preview.png', [(350, 460, 882, 680), (920, 56, 1277, 700)]),
 ('2026-10-27-standard-draft-editors/duties.png', '06-duty.png', [(758, 87, 1290, 747)]),
 ('2026-10-27-standard-draft-editors/experience.png', '07-experience.png', [(758, 87, 1290, 315)]),
 ('2026-10-26-standard-capability-editor/updated-editor.png', '08-ability.png', [(738, 83, 1267, 225)]),
 ('2026-10-27-standard-draft-editors/motivation.png', '09-motivation.png', [(758, 87, 1290, 181)]),
 ('2026-10-27-standard-draft-editors/potential.png', '10-potential.png', [(758, 87, 1290, 181)]),
]
for src, dest, rects in items:
    image = Image.open(root / src).convert('RGB')
    draw = ImageDraw.Draw(image)
    for rect in rects:
        draw.rectangle(rect, outline='#e02020', width=4)
    image.save(out / dest, optimize=True)
