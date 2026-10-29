"""Build an offline, self-contained page from the existing synthetic reader."""
from pathlib import Path
import base64
import hashlib
import json

ROOT = Path(__file__).resolve().parents[1]


def csp_hash(value):
    return base64.b64encode(hashlib.sha256(value.encode()).digest()).decode()


def build():
    fixture = json.loads((ROOT / 'fixtures/source_mail_g1g2.json').read_text())
    if fixture.get('demonstration') is not True:
        raise ValueError('Only the supplied synthetic example can be embedded')
    script = (ROOT / 'source/source-mail.js').read_text()
    fixture_json = json.dumps(fixture, ensure_ascii=False).replace('<', '\\u003c')
    script += '\n(() => {\n  const fixture = ' + fixture_json + ';\n' + """
  const mount = document.getElementById('reader');
  function show(index) {
    const card = fixture.snapshot.cards[index];
    const value = window.SourceMailReader.normalize(card.source_mail, card.key, fixture.demonstration === true);
    mount.replaceChildren(window.SourceMailReader.render(value));
    document.querySelectorAll('[data-example]').forEach(button => {
      button.setAttribute('aria-pressed', String(Number(button.dataset.example) === index));
    });
  }
  document.querySelectorAll('[data-example]').forEach(button => {
    button.addEventListener('click', () => show(Number(button.dataset.example)));
  });
  show(0);
})();
"""
    css = """
:root{--line:#d7e4dd;font-family:system-ui,-apple-system,sans-serif;color:#183b2c;background:#f3f7f4}
*{box-sizing:border-box}body{margin:0}main{max-width:1000px;margin:auto;padding:30px 24px}
h1{font-size:28px;line-height:1.4;margin:8px 0}.eyebrow{font-size:13px;letter-spacing:.08em;color:#587364}
.intro{line-height:1.8;color:#52675b}.examples{display:flex;flex-wrap:wrap;gap:10px;margin:20px 0}
.examples button{font:inherit;border:1px solid #a0b8aa;border-radius:8px;padding:10px 14px;background:white;color:#244b37;cursor:pointer}
.examples button[aria-pressed=true]{background:#22563c;color:white;border-color:#22563c}
button:focus-visible,summary:focus-visible{outline:3px solid #e6a03b;outline-offset:3px}
.source-mail-original[hidden]{display:none}footer{font-size:13px;color:#52675b;line-height:1.8;padding:10px 0 20px}
@media(max-width:600px){main{padding:20px 14px}h1{font-size:23px}}
""" + (ROOT / 'source/source-mail.css').read_text()
    for content, closing in ((script, '</script'), (css, '</style')):
        if closing in content.lower():
            raise ValueError('Unexpected HTML closing tag in source')
    csp = ("default-src 'none'; script-src 'sha256-" + csp_hash(script) +
           "'; style-src 'sha256-" + csp_hash(css) +
           "'; connect-src 'none'; img-src 'none'; object-src 'none'; frame-src 'none'; "
           "worker-src 'none'; form-action 'none'; base-uri 'none'")
    html = f'''<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="{csp}">
<title>TxSenser Email · 源邮件阅读示例</title><style>{css}</style></head>
<body><main>
<div class="eyebrow">TXSENSER EMAIL</div><h1>源邮件阅读</h1>
<p class="intro">先读中文，再按需查看同一封邮件的英文原文和已提供的历史往来。</p>
<p class="intro">当前是虚构示例，不连接真实邮箱。中文译文已预先提供。</p>
<nav class="examples" aria-label="选择示例">
<button type="button" data-example="0" aria-pressed="true">有源邮件的事项</button>
<button type="button" data-example="1" aria-pressed="false">尚未提供源邮件的事项</button>
</nav><div id="reader"></div>
<footer>此页展示源邮件阅读这一项能力。不会读取、发送或保存真实业务数据。</footer>
</main><script>{script}</script></body></html>
'''
    output = ROOT / 'preview/index.html'
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(html, encoding='utf-8')
    print('Built preview/index.html (synthetic, offline)')


if __name__ == '__main__':
    build()
