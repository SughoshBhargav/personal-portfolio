(function () {
  var btn = document.getElementById('theme-toggle');

  btn.addEventListener('click', function () {
    var current = document.documentElement.getAttribute('data-theme');
    var next    = current === 'dark' ? 'light' : 'dark';

    /* Capture button centre — the reveal expands from here */
    var rect = btn.getBoundingClientRect();
    var x = (rect.left + rect.width  / 2).toFixed(1);
    var y = (rect.top  + rect.height / 2).toFixed(1);
    document.documentElement.style.setProperty('--vt-x', x + 'px');
    document.documentElement.style.setProperty('--vt-y', y + 'px');

    /* Pulse ring that bursts outward from the button */
    var ringColor = next === 'light'
      ? 'rgba(245,158,11,0.75)'
      : 'rgba(99,102,241,0.75)';
    var ring = document.createElement('div');
    ring.style.cssText = [
      'position:fixed',
      'border-radius:50%',
      'pointer-events:none',
      'z-index:10001',
      'width:0', 'height:0',
      'left:' + x + 'px',
      'top:'  + y + 'px',
      'transform:translate(-50%,-50%)',
      'border:2px solid ' + ringColor,
      'animation:vt-ring-pulse 0.7s cubic-bezier(0.2,0.8,0.4,1) forwards'
    ].join(';');
    document.body.appendChild(ring);
    setTimeout(function () { ring.remove(); }, 750);

    function applyTheme() {
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
    }

    /* View Transitions API — Chrome / Edge / Safari */
    if (document.startViewTransition) {
      document.startViewTransition(applyTheme);
      return;
    }

    /* Firefox fallback — slow colour overlay */
    var overlay = document.createElement('div');
    overlay.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:9997', 'pointer-events:none',
      'opacity:0',
      'background:' + (next === 'light' ? '#faf9f6' : '#080b14'),
      'transition:opacity 0.55s ease'
    ].join(';');
    document.body.appendChild(overlay);
    overlay.getBoundingClientRect();
    overlay.style.opacity = '1';
    setTimeout(function () {
      applyTheme();
      overlay.style.transition = 'opacity 0.55s ease';
      overlay.style.opacity = '0';
      setTimeout(function () { overlay.remove(); }, 600);
    }, 570);
  });
})();
