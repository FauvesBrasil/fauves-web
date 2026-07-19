(function () {
  'use strict';

  var SCRIPT_MARKER = 'data-fauves-embed-ready';

  function enhance(button) {
    if (!button || button.getAttribute(SCRIPT_MARKER) === 'true') return;
    button.setAttribute(SCRIPT_MARKER, 'true');

    var href = button.getAttribute('href');
    if (!href) return;

    try {
      var url = new URL(href, window.location.href);
      var coupon = button.getAttribute('data-fauves-coupon');
      var source = button.getAttribute('data-fauves-utm-source');
      if (coupon) url.searchParams.set('coupon', coupon);
      if (source) url.searchParams.set('utm_source', source);
      button.setAttribute('href', url.toString());
    } catch (_) {
      // Preserve the original URL when it cannot be parsed.
    }

    if (!button.hasAttribute('target')) button.setAttribute('target', '_blank');
    button.setAttribute('rel', 'noopener noreferrer');
  }

  function start() {
    var buttons = document.querySelectorAll('.fauves-checkout--button');
    for (var i = 0; i < buttons.length; i += 1) enhance(buttons[i]);
  }

  if (!document.getElementById('fauves-checkout-button-styles')) {
    var style = document.createElement('style');
    style.id = 'fauves-checkout-button-styles';
    style.textContent = '.fauves-checkout--button{display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;padding:10px 20px;border-radius:999px;background:#fff;color:#171717;font:600 16px/1.25 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;text-decoration:none;box-shadow:0 1px 2px rgba(0,0,0,.16);transition:transform .16s ease,box-shadow .16s ease}.fauves-checkout--button:hover{transform:translateY(-1px);box-shadow:0 5px 14px rgba(0,0,0,.18)}';
    document.head.appendChild(style);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
