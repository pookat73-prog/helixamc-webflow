import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {readDoctors, profileBody, ROOT} from './build-doctor-pages.mjs';
const {photoSources, block} = createRequire(import.meta.url)('./doctor-photo-sources.cjs');
const {doctors} = readDoctors();
for (const file of ['modal.js','card-render.js']) {
  const source = readFileSync(ROOT + '/seocho/doctors/' + file,'utf8');
  assert(source.includes(block), 'Generated helper differs: ' + file);
  const context = {};
  vm.runInNewContext(block, context);
  for (const {doctor:d} of doctors) {
    assert.deepEqual(JSON.parse(JSON.stringify(context.photoSources(d.photo))), photoSources(d.photo));
  }
}
for (const item of doctors) {
  const p = photoSources(item.doctor.photo);
  assert(p.src.includes('-p-500.'), item.doctor.slug);
  assert(p.srcset.includes('500w') && p.srcset.includes('800w'));
  const body = profileBody(item,'source-unchanged');
  assert(body.includes('src="'+p.src+'"'));
  assert(body.includes('srcset="'+p.srcset+'"'));
  assert(body.includes('sizes="(max-width: 767px) 108px, 135px"'));
}
for (const url of ['https://example.com/photo.jpg','https://cdn.prod.website-files.com/'+'a'.repeat(24)+'/'+'b'.repeat(24)+'_unknown.jpg',doctors[0].doctor.photo+'?w=480',photoSources(doctors[0].doctor.photo).src]) {
  assert.deepEqual(photoSources(url),{src:url,srcset:''},'Unverified/already resized sources stay intact');
}
assert.deepEqual(photoSources(null),{src:'',srcset:''});
console.log('PASS: all 26 static profiles and both runtime helpers use verified variants; unknown sources preserved');
