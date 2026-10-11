import { describe, expect, it } from 'vitest';
import { getEventDestination, getExternalEventUrl } from './eventUrl';

describe('event destinations', () => {
  it('sends imported events to their ticketing page', () => {
    expect(getEventDestination({
      id: 'event-1',
      slug: 'show-x',
      isExternal: true,
      externalUrl: 'https://tickets.example.com/show-x',
    })).toEqual({
      href: 'https://tickets.example.com/show-x',
      external: true,
    });
  });

  it('keeps native Fauves events on the internal page', () => {
    expect(getEventDestination({ id: 'event-2', slug: 'evento-fauves' })).toEqual({
      href: '/evento-fauves',
      external: false,
    });
  });

  it('rejects unsafe external URL schemes', () => {
    expect(getExternalEventUrl({ id: 'event-3', isExternal: true, externalUrl: 'javascript:alert(1)' })).toBeNull();
  });
});
