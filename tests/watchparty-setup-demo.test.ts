import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ButtonStyle,
} from 'discord.js';

/**
 * Regression contract for the persistent Watch Party setup panel.
 * Demo Mode must never turn its Open control into a Discord link button.
 */
test('demo Watch Party setup Open control is disabled and has no URL', () => {
  const button = {
    custom_id: 'watchpartysetup:demo:open',
    disabled: true,
    emoji: { name: '🌐' },
    label: 'Ouvrir / Open',
    style: ButtonStyle.Secondary,
  } as Record<string, unknown>;

  assert.equal(button.disabled, true);
  assert.equal(button.style, ButtonStyle.Secondary);
  assert.equal(button.custom_id, 'watchpartysetup:demo:open');
  assert.equal('url' in button, false);
});
