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
const modalFns = between('  function openModal() {', "  backdrop.addEventListener('click', closeModal);");
const submitFns = between('  async function persistLead(', '  function onSubmitSuccess() {');
const successFn = between('  function onSubmitSuccess() {', '  } // end run()');

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
    addEventListener() {}
  };
}

function fixture(fetchImpl) {
  const ids = {};
  [
    'hxFctaForm', 'hxFctaSubmit', 'hxFctaDone', 'hxFctaToggle',
    'hxFctaModal', 'hxFctaModalClose', 'hxFctaModalBackdrop',
    'hxFcta_owner', 'hxFcta_phone', 'hxFcta_pet', 'hxFcta_symptom',
    'hxFcta_etc', 'hxFcta_privacy', 'hxFcta_privacy_err',
    'hxFcta_owner_err', 'hxFcta_phone_err', 'hxFcta_submit_err'
  ].forEach(id => { ids[id] = element(id); });

  const form = ids.hxFctaForm;
  form.handler = null;
  form.addEventListener = (name, handler) => {
    if (name === 'submit') form.handler = handler;
  };
  form.resetCount = 0;
  form.reset = () => {
    form.resetCount++;
    ids.hxFcta_owner.value = '';
    ids.hxFcta_phone.value = '';
    ids.hxFcta_pet.value = '';
    ids.hxFcta_symptom.value = '';
    ids.hxFcta_etc.value = '';
    ids.hxFcta_privacy.checked = false;
  };

  ids.hxFcta_owner.value = '모의 보호자';
  ids.hxFcta_phone.value = '01012345678';
  ids.hxFcta_pet.value = '모의 반려동물';
  ids.hxFcta_symptom.value = '모의 상담 내용';
  ids.hxFcta_privacy.checked = true;

  const modal = ids.hxFctaModal;
  const body = { style: {} };
  const context = {
    console: { error() {} },
    document: {
      body,
      getElementById(id) { return ids[id] || null; }
    },
    form,
    submitBtn: ids.hxFctaSubmit,
    done: ids.hxFctaDone,
    toggle: ids.hxFctaToggle,
    modal,
    closeBtn: ids.hxFctaModalClose,
    backdrop: ids.hxFctaModalBackdrop,
    ownerInput: ids.hxFcta_owner,
    phoneInput: ids.hxFcta_phone,
    petInput: ids.hxFcta_pet,
    symptomInput: ids.hxFcta_symptom,
    etcInput: ids.hxFcta_etc,
    privacyEl: ids.hxFcta_privacy,
    chipEls: [],
    etcWrap: element('etcWrap'),
    privacyDetail: element('privacyDetail'),
    privacyMore: element('privacyMore'),
    modalReturnFocus: ids.hxFctaToggle,
    phoneDigits: () => ids.hxFcta_phone.value.replace(/\D/g, ''),
    chipValues: () => [],
    clearErrors: undefined,
    setError: undefined,
    fetch: fetchImpl,
    LEADS_URL: 'https://mock.invalid/branches/seocho/leads.json',
    CTA_PAGE: 'home',
    formSrc: 'floating_cta',
    gaEvents: [],
    ga(name, data) { context.gaEvents.push({ name, data }); },
    location: { search: '', pathname: '/' },
    navigator: { userAgent: 'submit-handler-test' },
    URLSearchParams: class { get() { return null; } }
  };

  vm.runInNewContext([
    guardDecl,
    errorFns,
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
  assert.equal(f.ids.hxFcta_phone.value, '01012345678');
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

await testSuccess();
await testFailureRetainsFormAndRetryClearsError();
await testDuplicateClickAndLateSuccess();
await testLateFailureAfterCloseReopen();
console.log('All floating CTA submit handler tests passed (4 scenarios).');
