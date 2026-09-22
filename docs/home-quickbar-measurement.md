# Home quickbar measurement

Scope: Hero branch quickbar only. No style, link destination, Hero geometry,
SVG path, animation, floating CTA, or raw-log receiver changes.

## Events

| Event | Meaning |
| --- | --- |
| `home_quickbar_view` | At least 50% of the bar visible for 1 continuous second; once per page load |
| `home_quickbar_dwell` | Incremental active-visible seconds; sum `dwell_sec` or numeric `value` (not event count) |
| `home_quickbar_phone_call_seocho` | Seocho phone intent, wide and compact layout |
| `home_quickbar_phone_call_ilsan` | Ilsan phone intent, wide and compact layout |
| `home_quickbar_detail_seocho` | Seocho detail link, compact layout only |
| `home_quickbar_detail_ilsan` | Ilsan detail link, compact layout only |
| `home_quickbar_detail_svicc` | 서울동물영상종양센터 link, wide and compact layout |

There are 3 links in wide markup and 5 in compact markup; only one layout is
visible. Heading/copy/scroll decoration that is not clickable is not recorded as
a click. No hover tracking, pointer coordinates, or visitor-entered text.

## Parameters and interpretation

- Shared: `page=home`, `section_key=quickbar`, `device`, `layout=wide|compact`.
- Click: `branch` (Korean full label), `item_type=phone_call|detail`,
  `click_area=icon|label|surface`, `link_url` (existing static public destination).
- Dwell: `dwell_sec` and `value` are seconds, up to millisecond precision.
- Existing session module adds `sid`, `step`, `prev`, `entry_src`, `visitor`,
  `landing` and available UTM values. Do not reuse attribution-reserved `source`.
- Existing phone conversion rule attaches `conv=1`, `conv_type=phone` to the
  phone events. This is intent, NOT proof of an answered call, booking or revenue.
- `device` keeps the site's <=767px convention; `layout` reads actual rendered
  markup, so tablet/landscape can be analyzed without changing historical device
  classification.
- Dwell excludes hidden tabs, offscreen/header-clipped area below the 50%
  threshold, and inactivity after 60 seconds. Re-entry resumes; pagehide and
  visibility changes flush only newly accrued time. A sub-1s visit can have dwell
  without a qualified view. Layout changes split elapsed time at resize.
- One `gtag` call fans out via existing `session.js` and `sheet-log.js`. Never
  independently POST the same event. Preserve `sheet-log.js` and its receiver.
- Scoped capture handlers keep native quickbar `tel:` navigation and exclude the
  legacy lower-card telephone handler even when delayed script loading changes
  initialization order. They never call preventDefault or modify clipboard/UI.
- Staging `*.webflow.io`, operator no-measure mode, and the raw logger's internal
  IP filter remain in force. Consent/blockers/network failure can prevent delivery;
  do not interpret collected data as every possible visitor.

## QA and reporting

- `?qb-qa=desktop` or `?qb-qa=mobile` marks only quickbar events with `qa_test`
  and `debug_mode=true`. Does not override exclusion. Ignore these rows in genuine
  performance reports; do not register session IDs as GA dimensions.
- GA4: filter event name beginning `home_quickbar_`. Event counts show individual
  actions. Use event-scoped definitions for `branch`, `section_key`, `layout`,
  `item_type`, `click_area`, `qa_test` as needed; reuse existing definitions. Built-in
  link URL/device and existing session context remain available where supported.
- Register numeric `dwell_sec` (seconds) as a custom metric if not already present.
  Custom definitions may take 24–48h to populate standard reports. DebugView is
  the immediate receipt check; raw sheet `log` exposes full JSON without definitions.
- Preserve current key-event rules; do not mark both raw telephone and a derived
  lead event as new key events (would inflate conversions).
- Local regression: `node scripts/test-quickbar-measurement.mjs` and
  `node scripts/check-site-quality.mjs`.
- Deploy measurement changes directly to main per CLAUDE.md. Subsequent staging
  promotion must preserve main's measurement additions in coming-soon.js.

Reference: https://support.google.com/analytics/answer/14239696
and https://developers.google.com/analytics/devguides/collection/ga4/events
