# -*- coding: utf-8 -*-
"""给每页 slide XML 注入自动换页计时，实现一键全程自动播放。"""
import zipfile, shutil, os

BASE = os.path.dirname(os.path.abspath(__file__))
PPTX = os.path.join(BASE, '卷帙介绍.pptx')
TMP = os.path.join(BASE, '卷帙介绍.tmp.pptx')

# 每页自动换页时间（毫秒），覆盖该页所有动画播完
ADVANCE = [8000, 8500, 7500, 7500, 8000, 8500, 8000, 8000, 8500, 8500, 9000]

def patch(xml: str, ms: int) -> str:
    trans = f'<p:transition spd="slow" advTm="{ms}" advClick="1"/>'
    if '<p:transition' in xml:
        import re
        return re.sub(r'<p:transition[^>]*/>', trans, xml, count=1)
    if '<p:timing' in xml:
        return xml.replace('<p:timing', trans + '<p:timing', 1)
    return xml.replace('</p:sld>', trans + '</p:sld>', 1)

# 逐条目复制，遇到 slideN.xml 就替换内容
with zipfile.ZipFile(PPTX, 'r') as zin, zipfile.ZipFile(TMP, 'w', zipfile.ZIP_DEFLATED) as zout:
    for item in zin.infolist():
        data = zin.read(item.filename)
        name = item.filename
        if name.startswith('ppt/slides/slide') and name.endswith('.xml'):
            import re
            m = re.fullmatch(r'ppt/slides/slide(\d+)\.xml', name)
            if m:
                n = int(m.group(1))
                if 1 <= n <= 11:
                    xml = data.decode('utf-8')
                    data = patch(xml, ADVANCE[n - 1]).encode('utf-8')
                    print(f'slide{n}.xml -> advTm={ADVANCE[n - 1]}ms')
        zout.writestr(item, data)

# 原子替换
shutil.move(TMP, PPTX)
print('updated:', PPTX, os.path.getsize(PPTX), 'bytes')
