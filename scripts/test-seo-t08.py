"""Offline Chromium integration checks for the T08 branch preservation with the current SEO representation.

No live site, Webflow, CDN, or validator calls. Requires Chromium and Playwright.
Evidence is written outside the repository to the directory passed as argv[1].
"""
import json
import pathlib
import re
import sys
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[1]
CANDIDATES = ROOT / 'docs/seo-t08-review'
OUT = pathlib.Path(sys.argv[1]).resolve()
OUT.mkdir(parents=True, exist_ok=True)
BRANCH = 'https://helix-amc.com/seocho#branch'


def read(path):
    return path.read_text()


def graph(source):
    data = json.loads(re.search(
        r'<script type="application/ld\+json">(.*?)</script>', source, re.S
    ).group(1))
    return data['@graph']


def ld(data):
    return '<script type="application/ld+json">' + json.dumps(
        data, ensure_ascii=False
    ).replace('</', '<\\/') + '</script>'


generated_html = read(ROOT / 'seo-snippets/seocho.html')
generated = graph(generated_html)
generated_branch = next(n for n in generated if n.get('@id') == BRANCH)
doctors = [n for n in generated if '#doctor-' in n.get('@id', '')]
assert len(doctors) == len(generated_branch['employee']) == 26
summary = []
runtime = sync_playwright().start()
browser = runtime.chromium.launch(executable_path='/usr/bin/chromium', headless=True,
                                 args=['--no-sandbox', '--disable-dev-shm-usage'])

for page in ('home', 'seocho'):
    candidate_path = (ROOT / 'docs/seo-followup/seocho-schema.json' if page == 'seocho'
                      else CANDIDATES / 'home-schema.candidate.json')
    candidate = json.loads(read(candidate_path))
    original = json.loads(read(CANDIDATES / (page + '-schema.live-before.json')))[0]
    assert candidate['@type'] == ['VeterinaryCare', 'LocalBusiness']
    for key, value in original.items():
        if key not in ('@type', 'alternateName', 'address', 'openingHoursSpecification'):
            assert candidate[key] == value, key
    for key, value in original['address'].items():
        assert candidate['address'][key] == value
    for key, value in original['openingHoursSpecification'][0].items():
        assert candidate['openingHoursSpecification'][0][key] == value
    assert len(candidate['hasCredential']) == 3
    if page == 'home':
        before = dict(original)
        before['@type'] = candidate['@type']
        assert candidate == before
        # The home loader has no branch node; use its current public inline code.
        loader = read(ROOT / 'home/seo-loader.html')
        snippet = read(ROOT / 'seo-snippets/home.html')
        expected_other = graph(snippet)
    else:
        loader = read(CANDIDATES / 'seocho-loader.candidate.html')
        snippet = generated_html
        expected_other = [n for n in generated if n.get('@id') != BRANCH]
        assert candidate['employee'] == generated_branch['employee']
        for key in ('email', 'logo', 'image', 'sameAs', 'department',
                    'knowsAbout', 'hasOfferCatalog'):
            assert candidate[key] == generated_branch[key], key
        assert candidate['address']['postalCode'] == generated_branch['address']['postalCode']

    for mode in ('success', 'network-error', 'http-error', 'empty', 'malformed'):
        response = snippet if mode == 'success' else ('bad JSON' if mode == 'malformed' else '')
        if mode == 'malformed':
            response = '<script type="application/ld+json">bad JSON</script>'
        payload = json.dumps(response, ensure_ascii=False).replace('</', '<\\/')
        fetch = 'Promise.reject(new Error("offline"))' if mode == 'network-error' else (
            'Promise.resolve({ok:' + ('false' if mode == 'http-error' else 'true') +
            ',text:function(){return Promise.resolve(' + payload + ');}})')
        fixture = '<!doctype html><html><head><meta charset="utf-8">' + ld(candidate)
        fixture += '<script>window.fetch=function(){return ' + fetch + ';};</script>'
        fixture += loader + '''</head><body><pre id="result"></pre><script>
setTimeout(function(){
var blocks=[],invalid=0;
Array.from(document.querySelectorAll('script[type="application/ld+json"]')).forEach(function(s){
try{blocks.push(JSON.parse(s.textContent));}catch(e){invalid++;}
});
document.getElementById('result').textContent=JSON.stringify({blocks:blocks,invalid:invalid});
},100);</script></body></html>'''
        name = page + '-' + mode
        initial = OUT / (name + '-initial.html')
        initial.write_text(fixture)
        tab = browser.new_page()
        tab.route('**/*', lambda route: route.abort())
        tab.set_content(fixture, wait_until='domcontentloaded')
        tab.wait_for_function("document.querySelector('#result').textContent.length > 0")
        (OUT / (name + '-rendered.html')).write_text(tab.content())
        result = json.loads(tab.locator('#result').inner_text())
        blocks = result['blocks']
        assert result['invalid'] == 0
        tab.close()
        (OUT / (name + '-rendered-jsonld.json')).write_text(
            json.dumps(blocks, ensure_ascii=False, indent=2) + '\n')
        nodes = [n for b in blocks for n in b.get('@graph', [b])]
        branches = [n for n in nodes if n.get('@id') == BRANCH and len(n) > 1]
        assert branches == [candidate], name
        others = [n for n in nodes if n.get('@id') != BRANCH]
        assert others == (expected_other if mode == 'success' else []), name
        rendered_doctors = [n for n in nodes if '#doctor-' in n.get('@id', '')]
        if page == 'seocho':
            assert rendered_doctors == (doctors if mode == 'success' else [])
        summary.append({'case': name, 'branch_definitions': len(branches),
                        'doctor_nodes': len(rendered_doctors), 'static_facts_preserved': True,
                        'invalid_jsonld_blocks': result['invalid'], 'pass': True})

browser.close()
runtime.stop()
(OUT / 'results.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2) + '\n')
print(json.dumps(summary, ensure_ascii=False, indent=2))
