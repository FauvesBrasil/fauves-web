const ALLOWED_TAGS = new Set([
  'a',
  'b',
  'blockquote',
  'br',
  'code',
  'em',
  'h1',
  'h2',
  'h3',
  'h4',
  'hr',
  'i',
  'img',
  'li',
  'ol',
  'p',
  'pre',
  's',
  'span',
  'strong',
  'u',
  'ul',
]);

const BLOCKED_TAGS = new Set([
  'embed',
  'form',
  'iframe',
  'math',
  'meta',
  'object',
  'script',
  'style',
  'svg',
  'template',
]);

const ALLOWED_ATTRIBUTES: Record<string, Set<string>> = {
  a: new Set(['href', 'target', 'title']),
  img: new Set(['alt', 'height', 'src', 'title', 'width']),
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const isSafeUrl = (value: string, tagName: string) => {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return true;

  try {
    const url = new URL(trimmed, window.location.origin);
    if (tagName === 'a') {
      return ['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol);
    }
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
};

/**
 * Sanitizes rich text before it reaches dangerouslySetInnerHTML.
 * The allowlist intentionally excludes inline styles, classes and executable
 * elements while retaining the formatting produced by the event editor.
 */
export function sanitizeRichHtml(value: unknown): string {
  const html = typeof value === 'string' ? value : '';
  if (!html) return '';
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return escapeHtml(html);
  }

  const document = new DOMParser().parseFromString(html, 'text/html');

  const cleanElement = (element: Element) => {
    Array.from(element.children).forEach(cleanElement);

    const tagName = element.tagName.toLowerCase();
    if (BLOCKED_TAGS.has(tagName)) {
      element.remove();
      return;
    }

    if (!ALLOWED_TAGS.has(tagName)) {
      element.replaceWith(...Array.from(element.childNodes));
      return;
    }

    const allowed = ALLOWED_ATTRIBUTES[tagName] || new Set<string>();
    Array.from(element.attributes).forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      if (!allowed.has(name) || name.startsWith('on')) {
        element.removeAttribute(attribute.name);
      }
    });

    if (tagName === 'a') {
      const href = element.getAttribute('href');
      if (!href || !isSafeUrl(href, tagName)) element.removeAttribute('href');
      const target = element.getAttribute('target');
      if (target && !['_blank', '_self'].includes(target)) element.removeAttribute('target');
      if (element.getAttribute('target') === '_blank') {
        element.setAttribute('rel', 'noopener noreferrer');
      }
    }

    if (tagName === 'img') {
      const src = element.getAttribute('src');
      if (!src || !isSafeUrl(src, tagName)) element.remove();
    }
  };

  Array.from(document.body.children).forEach(cleanElement);
  return document.body.innerHTML;
}
