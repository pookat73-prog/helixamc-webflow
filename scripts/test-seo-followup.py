#!/usr/bin/env python3
"""Check SEO field domains/ranges, preservation and real home-loader failures.

Usage: python scripts/test-seo-followup.py OUT_DIR SCHEMAORG_JSONLD BEFORE_DIR
The vocabulary is the official Schema.org release, not validator.schema.org.
No live page is loaded; Chromium requests are blocked.
"""
import copy
import json
import pathlib
import re
import sys
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT, VOCAB, BEFORE = map(pathlib.Path, sys.argv[1:4])
OUT.mkdir(parents=True, exist_ok=True)
BRANCH = 'https://helix-amc.com/seocho#branch'
FIELDS = {'medicalSpecialty', 'department', 'availableService', 'procedureType',
          'knowsAbout', 'hasOfferCatalog', 'serviceType', 'itemOffered'}


def graph(path):
    return json.loads(re.search(r'<script type="application/ld\+json">(.*?)</script>',
                               path.read_text(), re.S)[1])['@graph']


def many(value):
    return value if isinstance(value, list) else [value]


def ids(value):
    return [x['@id'].replace('schema:', '') for x in many(value)]


vocab = {n['@id'].replace('schema:', ''): n for n in json.loads(VOCAB.read_text())['@graph']}


def ancestors(kind):
    parents = ids(vocab.get(kind, {}).get('rdfs:subClassOf', []))
    return {kind}.union(*(ancestors(p) for p in parents))


def audit(node, path='$'):
    issues = []
    if isinstance(node, list):
        for i, item in enumerate(node):
            issues += audit(item, path + '[' + str(i) + ']')
    elif isinstance(node, dict):
        kinds = set().union(*(ancestors(k) for k in many(node.get('@type', []))))
        for key, value in node.items():
            if key in FIELDS:
                term = vocab[key]
                domains = set(ids(term['schema:domainIncludes']))
                ranges = set(ids(term['schema:rangeIncludes']))
                if not domains.intersection(kinds):
                    issues.append(path + '.' + key + ': invalid domain')
                for item in many(value):
                    if isinstance(item, str):
                        valid = 'Text' in ranges or ('URL' in ranges and item.startswith('https://'))
                        # An enumeration URL must name a member of the expected enum.
                        if item.startswith('https://schema.org/'):
                            member = vocab.get(item.rsplit('/', 1)[-1], {})
                            valid = bool(set(ids(member.get('@type', []))).intersection(ranges))
                    else:
                        types = item.get('@type', []) if isinstance(item, dict) else []
                        valid = any(ranges.intersection(ancestors(t)) for t in many(types))
                    if not valid:
                        issues.append(path + '.' + key + ': invalid range')
            issues += audit(value, path + '.' + key)
    return issues


before_issues = []
after_issues = []
for filename in sorted((ROOT / 'seo-snippets').glob('*.html')):
    old = graph(BEFORE / 'seo-snippets' / filename.name)
    new = graph(filename)
    before_issues += audit(old)
    after_issues += audit(new)
    assert len(old) == len(new), filename.name
    for original, updated in zip(old, new):
        expected = copy.deepcopy(original)
        if 'medicalSpecialty' in expected:
            expected['knowsAbout'] = expected.pop('medicalSpecialty')
        for dept in expected.get('department', []):
            dept['@type'] = 'MedicalOrganization'
        if 'availableService' in expected:
            expected['hasOfferCatalog'] = {
                '@type': 'OfferCatalog', 'name': '진료과목',
                'itemListElement': [{
                    '@type': 'Offer', 'itemOffered': {
                        '@type': 'Service', 'name': service['name'],
                        'serviceType': service['procedureType']}}
                    for service in expected.pop('availableService')]}
        if filename.name == 'services.html' and expected.get('@type') == 'ItemList':
            for item in expected['itemListElement']:
                item['item']['@type'] = 'Service'
        assert expected == updated, (filename.name, original.get('@id'))
assert before_issues and not after_issues, after_issues

static_old = json.loads((ROOT / 'docs/seo-t08-review/seocho-schema.candidate.json').read_text())
static_new = json.loads((ROOT / 'docs/seo-followup/seocho-schema.json').read_text())
for key in ('@id', '@type', 'name', 'alternateName', 'address', 'telephone',
            'openingHoursSpecification', 'hasCredential', 'employee'):
    assert static_old[key] == static_new[key], key
assert len(static_new['employee']) == 26 and len(static_new['hasCredential']) == 3
assert not audit(static_new)
new_doctors = [n for n in graph(ROOT / 'seo-snippets/seocho.html') if '#doctor-' in n.get('@id', '')]
assert len(new_doctors) == 26

home_static = json.loads((ROOT / 'docs/seo-t08-review/home-schema.candidate.json').read_text())
loader = (ROOT / 'home/seo-loader.html').read_text()
snippet = (ROOT / 'seo-snippets/home.html').read_text()
cases = {
    'success': snippet, 'network': None, 'http': '', 'empty': '',
    'malformed': '<script type="application/ld+json">bad JSON</script>',
    'null': '<script type="application/ld+json">null</script>',
    'array': '<script type="application/ld+json">[]</script>',
    'graph-object': '<script type="application/ld+json">{"@graph":{}}</script>',
    'graph-null-node': '<script type="application/ld+json">{"@graph":[null]}</script>',
    'primitive': '<script type="application/ld+json">42</script>',
    'partial-invalid': snippet + '<script type="application/ld+json">bad JSON</script>',
}
results = []
with sync_playwright() as runtime:
    browser = runtime.chromium.launch(executable_path='/usr/bin/chromium', headless=True,
                                      args=['--no-sandbox', '--disable-dev-shm-usage'])
    for width in (390, 1440):
        for mode, response in cases.items():
            fetch = 'Promise.reject(new Error("offline"))' if response is None else (
                'Promise.resolve({ok:' + ('false' if mode == 'http' else 'true') +
                ',text:function(){return Promise.resolve(' + json.dumps(response).replace('</', '<\\/') + ');}})')
            fixture = '<script type="application/ld+json">' + json.dumps(home_static) + '</script>'
            fixture += '<script>window.fetch=function(){return ' + fetch + ';};</script>' + loader
            page = browser.new_page(viewport={'width': width, 'height': 900})
            page.route('**/*', lambda route: route.abort())
            page.set_content(fixture)
            page.wait_for_timeout(100)
            blocks = [json.loads(v) for v in page.locator('script[type="application/ld+json"]').all_text_contents()]
            assert blocks[0] == home_static
            assert len(blocks) == (2 if mode == 'success' else 1), (width, mode)
            if mode == 'success':
                assert blocks[1]['@graph'] == graph(ROOT / 'seo-snippets/home.html')
            results.append({'width': width, 'case': mode, 'pass': True})
            page.close()
    browser.close()
summary = {'schemaorg_version': '30.1', 'scope': sorted(FIELDS),
           'targeted_issues_before': len(before_issues), 'targeted_issues_after': len(after_issues),
           'loader_cases': results, 'doctor_nodes': len(new_doctors),
           'preserved': 'All generated graph nodes and values except declared field representations'}
(OUT / 'results.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2) + '\n')
print(json.dumps(summary, ensure_ascii=False, indent=2))
