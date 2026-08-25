import assert from 'node:assert/strict';
import test, { afterEach } from 'node:test';

import { getOmbiAutoApprove } from '../src/providers/ombi/ombi-config.js';

const original = process.env.OMBI_AUTO_APPROVE;

afterEach(() => {
  if (original === undefined) {
    delete process.env.OMBI_AUTO_APPROVE;
  } else {
    process.env.OMBI_AUTO_APPROVE = original;
  }
});

test('OMBI_AUTO_APPROVE defaults to false', () => {
  delete process.env.OMBI_AUTO_APPROVE;
  assert.equal(getOmbiAutoApprove(), false);
});

test('OMBI_AUTO_APPROVE=true enables approval', () => {
  process.env.OMBI_AUTO_APPROVE = 'true';
  assert.equal(getOmbiAutoApprove(), true);
});

test('OMBI_AUTO_APPROVE=false disables approval', () => {
  process.env.OMBI_AUTO_APPROVE = 'false';
  assert.equal(getOmbiAutoApprove(), false);
});
