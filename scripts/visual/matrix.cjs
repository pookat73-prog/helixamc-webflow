exports.pages = [
  { id: 'home', path: '/' },
  { id: 'about', path: '/discover-helix' },
  { id: 'services', path: '/services' },
  { id: 'faq', path: '/faq' },
  { id: 'internal', path: '/internal-medicine' },
];
exports.viewports = [
  { name: 'pc', width: 1440, height: 900 },
  { name: 'tablet', width: 820, height: 1180 },
  { name: 'mobile', width: 390, height: 844 },
];
// Selection is conservative for shared files and explicit for page owners.
exports.select = files => {
  const ids = new Set();
  for (const file of files) {
    if (/^(docs\/|\.gitignore$)/.test(file) || /\.(md|txt)$/i.test(file)) continue;
    if (/^home\/(section[1-9]|equipment\/|bootstrap)/.test(file)) ids.add('home');
    else if (/^about\//.test(file)) ids.add('about');
    else if (/^faq\//.test(file)) ids.add('faq');
    else if (/^internal-medicine\//.test(file)) ids.add('internal');
    else if (/^services\//.test(file)) ids.add('services');
    else return exports.pages.map(p => p.id); // global, home/global, harness, unknown consumers
  }
  return [...ids];
};
