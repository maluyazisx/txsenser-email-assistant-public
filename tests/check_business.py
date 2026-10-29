"""Public fictional business demo: exact synthetic identities and safe static-only surface."""
from pathlib import Path
import re,json,hashlib
root=Path(__file__).resolve().parents[1]
html=(root/'preview/business.html').read_text()
js=(root/'source/business-case.js').read_text()
assert js.startswith('/* Entirely fictional public data;')
case=json.loads(js[js.index('window.FICTIONAL_MATTER = ')+len('window.FICTIONAL_MATTER = '):].rstrip(';\n'))
assert case['identity']=='TXSENSER_PUBLIC_FICTIONAL_BUSINESS_CASE_V1' and case['demonstration'] is True
assert case['matter_key']==case['source_mail']['matter_key']
assert case['source_mail']['coverage']=='partial'
assert case['source_mail']['selected_source_id']=='synthetic:mail:request'
rows=case['source_mail']['messages'];assert len(rows)==2
assert {r['source_id'] for r in rows}=={'synthetic:mail:request','synthetic:mail:history'}
for r in rows:
    assert re.fullmatch('[a-f0-9]{64}',r['source_revision'])
    for k in ['original','translation']:
        assert r[k]['source_id']==r['source_id'] and r[k]['source_revision']==r['source_revision']
        assert r[k]['status']=='complete'
assert {s['id'] for s in case['strategies']}=={'acknowledge','clarify'}
assert all('12' in s['english'] and '12' in s['chinese'] for s in case['strategies'])
assert hashlib.sha256((root/'source/source-mail.js').read_bytes()).hexdigest()=='4b95c15c1055891fe669fda0c5a267b7560597d01484315d401fcd33360e1099'
for forbidden in ['https://','http://','mailto:','localStorage','sessionStorage','indexedDB','XMLHttpRequest','WebSocket','fetch(','window.open(']:
    assert forbidden not in html+(root/'source/business-flow.js').read_text(),forbidden
for directive in ["default-src 'none'","script-src 'self'","style-src 'self'","connect-src 'none'","img-src 'none'","frame-src 'none'","worker-src 'none'","form-action 'none'"]:
    assert directive in html
assert '<script src="../source/source-mail.js"></script>' in html
assert '<script src="../source/business-case.js"></script>' in html
assert '<script src="../source/business-flow.js"></script>' in html
assert '原创虚构演示' in html and '请勿输入真实客户' in html
assert not re.search(r'<(?:iframe|form|img)\b',html,re.I)
print('BUSINESS_FLOW_SOURCE_PASS: synthetic bound history, 2 strategies, no external egress or send')
