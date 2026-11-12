# SEO format and home-loader follow-up

## Change

Keep all published department labels, services, doctor records, branch identity,
hours, address and credentials while correcting their Schema.org representation:

- Use `knowsAbout` for the existing free-text specialty labels. They are not
  MedicalSpecialty enumeration members; do not invent or approximate clinical codes.
- Type organizational departments as `MedicalOrganization`, preserving names and IDs.
- Represent the branch's department-level services as
  `hasOfferCatalog > Offer > Service`, preserving the Korean name and English
  label as `serviceType`. `availableService` is not defined for VeterinaryCare;
  the labels are also not MedicalProcedureType enumeration members.
- Type the `/services` department-card items as `Service`, preserving all labels,
  descriptions and existing URLs. No published/draft page flags are changed.
- Parse all home SEO response blocks before adding any. Invalid JSON, invalid
  graph shapes and mixed valid/invalid blocks add nothing; static schema remains.

`seocho-schema.json` is the full Webflow schema derived from the saved T08 version.
Only the above field representations differ. `home/seo-loader.html` is the exact
source for the page's SEO block; the rest of its head and all footer code stay intact.
The Seocho deduplication loader stays unchanged.

## Verification

Generated graph comparison preserves every other node and value across all eight
SEO snippets. The static schema preserves address, hours, three credentials and
26 employee IDs. Current T08 regression tests cover ten branch/fetch scenarios.
The home-loader test covers eleven response scenarios at 390px and 1440px.

The targeted domain/range audit uses the official Schema.org 30.1 vocabulary:
https://github.com/schemaorg/schemaorg/blob/main/data/releases/30.1/schemaorg-current-https.jsonld
(Git blob `d04621d491eff20f3a8defe7bd4351a16db75e42`).
This is a local vocabulary-based audit, not a new validator.schema.org report
and not a guarantee that every unrelated property on the complete pages is valid.

Commands (baseline is a pre-change copy of `seo-snippets/`):

```sh
node scripts/build-seo.js
node scripts/check-site-quality.mjs
python scripts/test-seo-followup.py OUT_DIR SCHEMAORG_JSONLD BEFORE_DIR
python scripts/test-seo-t08.py OUT_DIR
git diff --check
```

## Rollout and rollback

1. Back up latest Webflow schema and page head/footer, and compare immediately
   before writing to avoid overwriting concurrent edits.
2. Save `seocho-schema.json` and replace only the existing Home SEO loader block.
   Read both back and compare exactly. Keep other page and site settings intact.
3. Use the user's approved full-site publishing route. Do not treat this as
   single-page isolation; other pending Webflow changes are included.
4. Merge this follow-up PR to main, wait for quality/deployment checks, then fetch
   live HTML and CDN snippets and run the actual SEO code with tracking blocked.
5. Restore backed-up Webflow fields and publish again if necessary. Revert this
   PR's builder/snippets separately if the generated response needs rollback.

The user requested grouped execution through verification and reflection into
production and main. No plan, pricing, medical facts, design or analytics changes
are part of this work. Historical T08 candidate/report files retain their dated evidence.

Official references:
https://schema.org/medicalSpecialty
https://schema.org/MedicalSpecialty
https://schema.org/department
https://schema.org/availableService
https://schema.org/procedureType
https://schema.org/knowsAbout
https://schema.org/hasOfferCatalog
https://schema.org/Service
