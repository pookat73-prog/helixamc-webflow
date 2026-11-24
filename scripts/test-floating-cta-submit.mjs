import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../global/floating-cta.js', import.meta.url), 'utf8');
const guardDecl = source.match(/^[ \t]*var isSubmitting = false;$/m)?.[0];
assert.ok(guardDecl, 'submit guard must be declared in the actual source');

function between(startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);
  assert.ok(start >= 0 && end > start, 'source markers exist: ' + startMarker);
  return source.slice(start, end);
}

const errorFns = between('  function setError(', "  ownerInput.addEventListener('input'");
const phoneFns = between('  function phoneSubscriberDigits()', '  /* ── Enter(');
const modalFns = between('  function openModal() {', "  backdrop.addEventListener('click', closeModal);");
const submitFns = between('  async function persistLead(', '  function onSubmitSuccess(');
const successFn = between('  function onSubmitSuccess(', '  } // end run()');

function classList() {
  const values = new Set();
  return {
    add(value) { values.add(value); },
    remove(value) { values.delete(value); },
    contains(value) { return values.has(value); },
    toggle(value, force) {
      const shouldAdd = force === undefined ? !values.has(value) : Boolean(force);
      if (shouldAdd) values.add(value);
      else values.delete(value);
      return shouldAdd;
    }
  };
}

function element(id) {
  return {
    id, value: '', checked: true, disabled: false, textContent: '',
    style: {}, attributes: {}, classList: classList(), focused: false,
    setAttribute(name, value) { this.attributes[name] = value; },
    focus() { this.focused = true; },
    handlers: {},
    addEventListener(name, handler) { this.handlers[name] = handler; }
  };
}

function fixture(fetchImpl) {
  const ids = {};
  [
    'hxFctaForm', 'hxFctaSubmit', 'hxFctaDone', 'hxFctaToggle',
    'hxFctaModal', 'hxFctaModalClose', 'hxFctaModalBackdrop',
    'hxFcta_owner', 'hxFcta_phone', 'hxFcta_memo', 'hxFcta_memo_err', 'hxFcta_privacy', 'hxFcta_privacy_err',
    'hxFcta_owner_err', 'hxFcta_phone_err', 'hxFcta_submit_err'
  ].forEach(id => { ids[id] = element(id); });

  const form = ids.hxFctaForm;
  form.style.display = '';
  form.handler = null;
  form.addEventListener = (name, handler) => {
    if (name === 'submit') form.handler = handler;
  };
  form.resetCount = 0;
  form.reset = () => {
    form.resetCount++;
    ids.hxFcta_owner.value = '';
    ids.hxFcta_phone.value = '';
    ids.hxFcta_memo.value = '';
    ids.hxFcta_privacy.checked = false;
  };

  ids.hxFcta_owner.value = '모의 보호자';
  ids.hxFcta_phone.value = '1234-5678';
  ids.hxFcta_privacy.checked = true;

  const modal = ids.hxFctaModal;
  const body = { style: {} };
  const context = {
    console: { error() {} },
    document: {
      body,
      activeElement: ids.hxFcta_phone,
      getElementById(id) { return ids[id] || null; }
    },
    form,
    submitBtn: ids.hxFctaSubmit,
    done: ids.hxFctaDone,
    doneClose: element('hxFctaDoneClose'),
    toggle: ids.hxFctaToggle,
    modal,
    closeBtn: ids.hxFctaModalClose,
    backdrop: ids.hxFctaModalBackdrop,
    ownerInput: ids.hxFcta_owner,
    phoneInput: ids.hxFcta_phone,
    memoInput: ids.hxFcta_memo,
    privacyEl: ids.hxFcta_privacy,
    privacyDetail: element('privacyDetail'),
    privacyMore: element('privacyMore'),
    modalReturnFocus: ids.hxFctaToggle,
    getAttributionUtm: () => ({ utm_source: '', utm_medium: '', utm_campaign: '', utm_content: '' }),
    fetch: fetchImpl,
    LEADS_URL: 'https://mock.invalid/branches/seocho/leads.json',
    CTA_PAGE: 'home',
    formSrc: 'floating_cta',
    gaEvents: [], allGaEvents: [],
    ga(name, data) { context.allGaEvents.push({ name, data }); if (name === 'cta_form_submit') context.gaEvents.push({ name, data }); },
    location: { search: '', pathname: '/' },
    navigator: { userAgent: 'submit-handler-test' },
    URLSearchParams: class { get() { return null; } }
  };

  vm.runInNewContext([
    guardDecl,
    source.match(/^[ \t]*var formTracking = .*;$/m)[0],
    errorFns,
    phoneFns,
    modalFns,
    submitFns,
    successFn
  ].join('\n'), context);

  assert.equal(typeof form.handler, 'function', 'actual submit callback was registered');
  context.openModal();
  return { context, form, ids, modal, body, submit: () => form.handler({ preventDefault() {} }) };
}

function response(ok, body, status = ok ? 200 : 403) {
  return { ok, status, async json() { return body; } };
}

async function testSuccess() {
  let calls = 0;
  const f = fixture(async (url, options) => {
    calls++;
    assert.equal(url, 'https://mock.invalid/branches/seocho/leads.json');
    assert.equal(options.method, 'POST');
    const lead = JSON.parse(options.body);
    assert.equal(lead.name, '모의 보호자');
    assert.equal(lead.phone, '01012345678');
    assert.equal(lead.petType, '미선택');
    for (const field of ['petName', 'species', 'petAge', 'ageGroup', 'conditionEtc', 'symptom', 'inquiry']) {
      assert.equal(lead[field], '', field + ' remains compatible without collecting animal details');
    }
    assert.deepEqual(lead.conditions, []);
    return response(true, { name: '-mock-key' });
  });
  await f.submit();
  assert.equal(calls, 1);
  assert.equal(f.form.style.display, 'none');
  assert.equal(f.ids.hxFctaDone.classList.contains('is-visible'), true);
  assert.equal(f.context.gaEvents.length, 1);
  console.log('PASS success only after Firebase key response');
}

async function testFailureRetainsFormAndRetryClearsError() {
  let calls = 0;
  const f = fixture(async () => {
    calls++;
    return calls === 1 ? response(false, { error: 'denied' }) : response(true, { name: '-retry-key' });
  });

  await f.submit();
  assert.equal(calls, 1);
  assert.notEqual(f.ids.hxFcta_submit_err.textContent, '');
  assert.equal(f.form.style.display, '');
  assert.equal(f.ids.hxFcta_owner.value, '모의 보호자');
  assert.equal(f.ids.hxFcta_phone.value, '1234-5678');
  assert.equal(f.ids.hxFctaSubmit.disabled, false);

  await f.submit();
  assert.equal(calls, 2);
  assert.equal(f.ids.hxFcta_submit_err.textContent, '');
  assert.equal(f.form.style.display, 'none');
  assert.equal(f.ids.hxFctaDone.classList.contains('is-visible'), true);

  f.context.closeModal();
  f.context.openModal();
  assert.equal(f.form.resetCount, 1);
  assert.equal(f.ids.hxFcta_submit_err.textContent, '');
  assert.equal(f.ids.hxFctaDone.classList.contains('is-visible'), false);
  assert.equal(f.ids.hxFcta_owner.value, '');
  assert.equal(f.ids.hxFctaSubmit.disabled, false);
  console.log('PASS failure, retained values, retry, success, close/reopen clears state');
}

async function testDuplicateClickAndLateSuccess() {
  let calls = 0;
  let resolveRequest;
  const f = fixture(() => {
    calls++;
    return new Promise(resolve => { resolveRequest = resolve; });
  });

  const first = f.submit();
  await f.submit();
  assert.equal(calls, 1, 'double click must not create a second POST');
  assert.equal(f.ids.hxFctaSubmit.disabled, true);

  f.context.closeModal();
  f.context.openModal();
  assert.equal(f.ids.hxFcta_owner.value, '모의 보호자');
  await f.submit();
  assert.equal(calls, 1, 'reopen while pending must not create a second POST');

  resolveRequest(response(true, { name: '-late-key' }));
  await first;
  assert.equal(f.ids.hxFctaDone.classList.contains('is-visible'), true);
  assert.equal(f.form.style.display, 'none');
  console.log('PASS duplicate clicks and modal close/reopen while response is pending');
}

async function testLateFailureAfterCloseReopen() {
  let rejectRequest;
  const f = fixture(() => new Promise((resolve, reject) => { rejectRequest = reject; }));
  const pending = f.submit();
  f.context.closeModal();
  f.context.openModal();

  rejectRequest(new Error('offline'));
  await pending;
  assert.notEqual(f.ids.hxFcta_submit_err.textContent, '');
  assert.equal(f.ids.hxFcta_owner.value, '모의 보호자');
  assert.equal(f.ids.hxFctaSubmit.disabled, false);
  assert.equal(f.ids.hxFctaDone.classList.contains('is-visible'), false);
  console.log('PASS late network failure after modal close/reopen keeps values');
}

async function testFixedPrefixInputAndValidation() {
  let calls = 0;
  const f = fixture(async (url, options) => {
    calls++;
    assert.equal(JSON.parse(options.body).phone, '01001001234');
    return response(true, { name: '-prefix-key' });
  });
  for (const value of ['', '123', '1234-567']) {
    f.ids.hxFcta_phone.value = value;
    await f.submit();
    assert.equal(calls, 0, 'empty or incomplete suffix must not be saved');
    assert.notEqual(f.ids.hxFcta_phone_err.textContent, '');
  }
  for (const value of ['12345678', '01012345678', '010-1234-5678', '1234abcd5678']) {
    f.ids.hxFcta_phone.value = value;
    f.ids.hxFcta_phone.handlers.input();
    assert.equal(f.ids.hxFcta_phone.value, '1234-5678');
    assert.equal(f.context.phoneDigits(), '01012345678');
    assert.equal(f.ids.hxFcta_phone_err.textContent, '');
  }
  assert.equal(f.ids.hxFcta_memo.focused, true, 'complete suffix advances to memo');
  f.ids.hxFcta_phone.value = '';
  f.ids.hxFcta_phone.handlers.input();
  assert.equal(f.context.phoneDigits(), '', 'fixed prefix alone is not a phone number');
  assert.equal(f.context.phoneCompletedOnce, false);
  f.ids.hxFcta_phone.value = '01001234';
  f.ids.hxFcta_phone.handlers.input();
  assert.equal(f.ids.hxFcta_phone.value, '0100-1234', 'suffix may itself start with 010');
  await f.submit();
  assert.equal(calls, 1);
  console.log('PASS fixed prefix, suffix validation, paste/autofill, leading zeros and full-number storage');
}

async function testMalformedPhoneIsRejected() {
  const invalidValues = [
    '01112345678', '011-1234-5678', '02-1234-5678', '+82 10 1234 5678',
    '0101234567', '010-123-4567', '010-1234-567', '010-1234-56789',
    '010123456789', '010-1234', '011-12345', '010-123-45678',
    '010-1234-5678 ext 9', '010-1234-5678 99',
  ];
  for (const value of invalidValues) {
    let calls = 0;
    const f = fixture(async () => {
      calls++;
      return response(true, { name: '-unexpected' });
    });
    const input = f.ids.hxFcta_phone;
    input.value = value;
    input.handlers.input();
    assert.equal(input.value, value, 'malformed input is kept for correction: ' + value);
    assert.notEqual(f.ids.hxFcta_phone_err.textContent, '', 'show the format error: ' + value);
    assert.equal(f.ids.hxFcta_memo.focused, false, 'do not advance focus with invalid input');
    await f.submit();
    assert.equal(calls, 0, 'malformed input never reaches the mock POST: ' + value);
    assert.equal(input.focused, true, 'validation returns focus to the phone field');
  }

  const f = fixture(async () => assert.fail('values without an input event must also be validated'));
  f.ids.hxFcta_phone.value = '010-1234-56789';
  await f.submit();
  assert.notEqual(f.ids.hxFcta_phone_err.textContent, '', 'reject oversized autofill at submission');
  assert.match(source, /hx-fcta-form__phone-prefix[^<]*>010-</, 'the fixed prefix remains visible');
  const phoneMarkup = between('id="hxFcta_phone"', "'</div>'");
  assert.doesNotMatch(phoneMarkup, /maxlength=/, 'the browser must not silently truncate oversized paste');
  console.log('PASS malformed phone inputs retain their original value and never submit (' + (invalidValues.length + 1) + ' cases)');
}

async function testValidPhoneShapesAndCorrection() {
  const cases = [
    ['01112345', '0111-2345', '01001112345'],
    ['0111-2345', '0111-2345', '01001112345'],
    ['01001234', '0100-1234', '01001001234'],
    ['01012345678', '1234-5678', '01012345678'],
    ['010-1234-5678', '1234-5678', '01012345678'],
    [' 010 1234 5678 ', '1234-5678', '01012345678'],
  ];
  for (const [value, display, expectedPhone] of cases) {
    const sent = [];
    const f = fixture(async (_url, options) => {
      sent.push(JSON.parse(options.body).phone);
      return response(true, { name: '-valid-phone-key' });
    });
    const input = f.ids.hxFcta_phone;
    input.value = '011-1234-5678';
    input.handlers.input();
    input.value = value;
    input.handlers.input();
    assert.equal(input.value, display, 'valid suffix display: ' + value);
    assert.equal(f.ids.hxFcta_phone_err.textContent, '', 'correction clears the format error');
    assert.equal(f.ids.hxFcta_memo.focused, true, 'completed suffix advances to memo');
    await f.submit();
    assert.deepEqual(sent, [expectedPhone]);
  }

  const sent = [];
  const f = fixture(async (_url, options) => {
    sent.push(JSON.parse(options.body).phone);
    return response(true, { name: '-autofill-key' });
  });
  f.ids.hxFcta_phone.value = '010-1234-5678';
  await f.submit();
  assert.deepEqual(sent, ['01012345678'], 'valid autofill does not require an input event');
  console.log('PASS valid suffixes and complete 010 numbers, including correction and autofill (' + (cases.length + 1) + ' cases)');
}

await testSuccess();
await testFailureRetainsFormAndRetryClearsError();
await testDuplicateClickAndLateSuccess();
await testLateFailureAfterCloseReopen();

async function testOptionalMemo() {
  const sent = [];
  let fail = true;
  const f = fixture(async (url, options) => {
    sent.push(JSON.parse(options.body));
    return fail ? response(false, { error: 'unavailable' }) : response(true, { name: '-memo-key' });
  });
  const memo = '가'.repeat(20);
  f.ids.hxFcta_memo.value = memo;
  await f.submit();
  assert.equal(sent[0].inquiry, memo, '20-character memo reaches existing dashboard inquiry field');
  assert.equal(f.ids.hxFcta_memo.value, memo, 'failed requests preserve memo for retry');
  assert.equal(JSON.stringify(f.context.allGaEvents).includes(memo), false, 'memo text must not reach analytics');
  fail = false;
  await f.submit();
  assert.equal(sent[1].inquiry, memo);
  f.context.openModal();
  assert.equal(f.ids.hxFcta_memo.value, '', 'successful form starts with an empty memo when reopened');
  console.log('PASS optional 20-character memo persistence, retry, analytics exclusion and reset');
}

async function testOverlongMemoIsNotSubmitted() {
  let calls = 0;
  const f = fixture(async () => { calls++; return response(true, { name: '-unexpected' }); });
  f.ids.hxFcta_memo.value = '나'.repeat(21);
  await f.submit();
  assert.equal(calls, 0, 'overlong programmatically supplied memo must not be sent');
  assert.equal(f.ids.hxFcta_memo.focused, true);
  assert.equal(f.ids.hxFcta_memo_err.textContent, '메모는 20자 이내로 입력해 주세요.');
  assert.equal(JSON.stringify(f.context.allGaEvents).includes(f.ids.hxFcta_memo.value), false);
  console.log('PASS memo length validation without sending reservation or memo text');
}

await testOptionalMemo();
await testOverlongMemoIsNotSubmitted();

await testFixedPrefixInputAndValidation();
await testMalformedPhoneIsRejected();
await testValidPhoneShapesAndCorrection();
console.log('All floating CTA submit handler tests passed (9 scenarios).');
