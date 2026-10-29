"""Check the export wrapper, CSP and reproducible generated artifact."""
from pathlib import Path
import base64
import hashlib
import json
import re
import runpy

root = Path(__file__).resolve().parents[1]
page = root / 'preview/index.html'
before = page.read_bytes()
runpy.run_path(str(root / 'tools/build_preview.py'))['build']()
assert before == page.read_bytes(), 'Committed preview is stale'
html = page.read_text()
for tag in ('script', 'style'):
    blocks = re.findall(r'<' + tag + r'>(.*?)</' + tag + r'>', html, re.S)
    assert len(blocks) == 1
    digest = base64.b64encode(hashlib.sha256(blocks[0].encode()).digest()).decode()
    assert tag + "-src 'sha256-" + digest + "'" in html
for directive in ('default-src', 'connect-src', 'img-src', 'object-src', 'frame-src', 'worker-src', 'form-action', 'base-uri'):
    assert directive + " 'none'" in html
assert not re.search(r'<(?:script|link|img|iframe)\b[^>]*(?:src|href)\s*=', html, re.I)
fixture = json.loads((root / 'fixtures/source_mail_g1g2.json').read_text())
assert fixture['demonstration'] is True
assert all(card['key'].startswith('matter:synthetic:') for card in fixture['snapshot']['cards'])
assert '查看英文原文' in html and '长文结束：27 件。' in html
print('Preview wrapper: reproducible, synthetic fixture, CSP hashes valid, no external resource tags')
