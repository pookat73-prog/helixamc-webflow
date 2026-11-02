/* Build-time source for existing modal/card scripts; no extra browser request.
   Widths are restricted to successful Webflow asset variants verified via API. */
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const widths = require('../seocho/doctors/photo-widths.json');

function createPhotoSources(widths) {
  return function photoSources(url) {
    if (typeof url !== 'string') return {src: url || '', srcset: ''};
    if (/-p-\d+\.(webp|jpe?g|png)$/i.test(url)) return {src: url, srcset: ''};
    var match = url.match(/^https:\/\/(?:cdn\.prod\.website-files\.com|s3\.amazonaws\.com\/webflow-prod-assets)\/[a-f0-9]{24}\/([a-f0-9]{24})_[^?#]+\.(webp|jpe?g|png)$/i);
    var sizes = match && widths[match[1]];
    if (!sizes || !sizes.length) return {src: url, srcset: ''};
    var sources = sizes.map(function (width) {
      return {width: width, url: url.replace(/\.(webp|jpe?g|png)$/i, '-p-' + width + '.$1')};
    });
    return {src: sources[0].url, srcset: sources.map(function (s) { return s.url + ' ' + s.width + 'w'; }).join(', ')};
  };
}

const start = '  /* HELIX_PHOTO_SOURCES_START */';
const end = '  /* HELIX_PHOTO_SOURCES_END */';
const block = start + '\n  var photoSources = (' + createPhotoSources.toString() + ')(' + JSON.stringify(widths) + ');\n' + end;
module.exports = {photoSources: createPhotoSources(widths), createPhotoSources, block};

if (require.main === module) {
  for (const file of ['seocho/doctors/modal.js', 'seocho/doctors/card-render.js']) {
    const full = path.join(root, file);
    const source = fs.readFileSync(full, 'utf8');
    const expression = /  \/\* HELIX_PHOTO_SOURCES_START \*\/[\s\S]*?  \/\* HELIX_PHOTO_SOURCES_END \*\//;
    const next = source.replace(expression, () => block);
    if (!expression.test(source)) throw new Error('Missing generated photo block: ' + file);
    if (process.argv.includes('--write')) fs.writeFileSync(full, next);
    else if (next !== source) throw new Error('Run node scripts/doctor-photo-sources.cjs --write: ' + file);
  }
  console.log('Doctor photo variant helpers are in sync');
}
