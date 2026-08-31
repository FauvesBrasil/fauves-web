// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { updateChatwootVisibility } from '../lib/chatwoot';

const createChatwootMock = (hasLoaded: boolean) => ({
  hasLoaded,
  toggleBubbleVisibility: vi.fn(),
  toggle: vi.fn(),
  setUser: vi.fn(),
  setCustomAttributes: vi.fn(),
  deleteUser: vi.fn(),
  setLocale: vi.fn(),
  reset: vi.fn(),
});

describe('updateChatwootVisibility', () => {
  afterEach(() => {
    delete window.$chatwoot;
  });

  it('waits until the SDK has finished creating the widget DOM', () => {
    const chatwoot = createChatwootMock(false);
    window.$chatwoot = chatwoot;

    updateChatwootVisibility(false);

    expect(chatwoot.toggleBubbleVisibility).not.toHaveBeenCalled();
    expect(chatwoot.toggle).not.toHaveBeenCalled();
  });

  it('shows the bubble on help-center routes after the SDK is ready', () => {
    const chatwoot = createChatwootMock(true);
    window.$chatwoot = chatwoot;

    updateChatwootVisibility(true);

    expect(chatwoot.toggleBubbleVisibility).toHaveBeenCalledWith('show');
    expect(chatwoot.toggle).not.toHaveBeenCalled();
  });

  it('hides and closes the widget outside help-center routes', () => {
    const chatwoot = createChatwootMock(true);
    window.$chatwoot = chatwoot;

    updateChatwootVisibility(false);

    expect(chatwoot.toggleBubbleVisibility).toHaveBeenCalledWith('hide');
    expect(chatwoot.toggle).toHaveBeenCalledWith('close');
  });
});
