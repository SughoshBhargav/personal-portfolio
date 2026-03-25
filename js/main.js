
/* ------ Cursor + comet trail ------ */
if (window.matchMedia('(pointer: fine)').matches) {
var dot = document.getElementById('cursor-dot');
var mx = -200, my = -200;

/* Trail canvas */
var trailCv = document.createElement('canvas');
trailCv.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9997;';
document.body.appendChild(trailCv);
var tctx = trailCv.getContext('2d');
(function resizeTrail() {
  trailCv.width  = window.innerWidth;
  trailCv.height = window.innerHeight;
})();
window.addEventListener('resize', function() {
  trailCv.width  = window.innerWidth;
  trailCv.height = window.innerHeight;
});

var trailPts = [];

document.addEventListener('mousemove', function(e) {
  mx = e.clientX; my = e.clientY;
  trailPts.push({ x: e.clientX, y: e.clientY, t: performance.now() });
});

document.querySelectorAll('.hoverable, a, button').forEach(function(el) {
  el.addEventListener('mouseenter', function() { document.body.classList.add('cursor-hover'); });
  el.addEventListener('mouseleave', function() { document.body.classList.remove('cursor-hover'); });
});

(function loop() {
  var now = performance.now();
  var LIFE = 420;

  /* Drop expired points */
  while (trailPts.length && now - trailPts[0].t > LIFE) trailPts.shift();

  /* Draw trail */
  tctx.clearRect(0, 0, trailCv.width, trailCv.height);
  trailPts.forEach(function(p) {
    var life  = 1 - (now - p.t) / LIFE;
    var r     = Math.max(0.3, 3.5 * life);
    var alpha = life * 0.7;
    /* Indigo → cyan as point ages */
    var col = life > 0.5
      ? 'rgba(129,140,248,' + alpha + ')'
      : 'rgba(6,182,212,'   + alpha + ')';
    tctx.beginPath();
    tctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    tctx.fillStyle = col;
    tctx.fill();
  });

  /* Move dot */
  dot.style.left = mx + 'px';
  dot.style.top  = my + 'px';

  requestAnimationFrame(loop);
})();

document.addEventListener('mouseleave', function() { document.body.classList.remove('cursor-hover'); });
}

/* ------ Navbar scroll ------ */
var navbar = document.getElementById('navbar');
window.addEventListener('scroll', function() {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

/* ------ Hamburger ------ */
var hamburger  = document.getElementById('hamburger');
var mobileMenu = document.getElementById('mobile-menu');
hamburger.addEventListener('click', function() {
  hamburger.classList.toggle('open');
  mobileMenu.classList.toggle('open');
  document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
});
document.querySelectorAll('.mobile-link').forEach(function(link) {
  link.addEventListener('click', function() {
    hamburger.classList.remove('open');
    mobileMenu.classList.remove('open');
    document.body.style.overflow = '';
  });
});

/* ------ Scroll reveal ------ */
var revealEls = document.querySelectorAll('.reveal');
var revealObs = new IntersectionObserver(function(entries) {
  entries.forEach(function(e) {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revealObs.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });
revealEls.forEach(function(el) { revealObs.observe(el); });

/* Footer year */
var fy = document.getElementById('footer-year');
if (fy) fy.textContent = new Date().getFullYear();
