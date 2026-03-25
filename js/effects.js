/* ================================================
   SCROLL PROGRESS BAR
================================================ */
var progressBar = document.createElement('div');
progressBar.id = 'scroll-progress';
document.body.prepend(progressBar);

window.addEventListener('scroll', function() {
  var total = document.documentElement.scrollHeight - window.innerHeight;
  progressBar.style.width = (total > 0 ? (window.scrollY / total * 100) : 0) + '%';
}, { passive: true });

/* ================================================
   ACTIVE NAV SECTION TRACKING
================================================ */
var navSections  = document.querySelectorAll('section[id]');
var navAnchors   = document.querySelectorAll('.nav-links a[href^="#"]');

var sectionObs = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (entry.isIntersecting) {
      var id = entry.target.id;
      navAnchors.forEach(function(a) {
        a.classList.toggle('nav-active', a.getAttribute('href') === '#' + id);
      });
    }
  });
}, { rootMargin: '-40% 0px -55% 0px' });
navSections.forEach(function(s) { sectionObs.observe(s); });

/* ================================================
   3D CARD TILT
================================================ */
document.querySelectorAll('.project-card, .skill-group').forEach(function(card) {
  card.addEventListener('mousemove', function(e) {
    var rect = card.getBoundingClientRect();
    var dx = (e.clientX - (rect.left + rect.width  / 2)) / (rect.width  / 2);
    var dy = (e.clientY - (rect.top  + rect.height / 2)) / (rect.height / 2);
    card.style.transform = [
      'perspective(900px)',
      'rotateX(' + (-dy * 4) + 'deg)',
      'rotateY(' + ( dx * 4) + 'deg)',
      'scale(1.015)'
    ].join(' ');
  });
  card.addEventListener('mouseleave', function() {
    card.style.transform = '';
  });
});

/* ================================================
   MAGNETIC BUTTONS
================================================ */
document.querySelectorAll('.btn-primary, .btn-ghost, .nav-resume').forEach(function(btn) {
  btn.addEventListener('mousemove', function(e) {
    var rect = btn.getBoundingClientRect();
    var dx = (e.clientX - (rect.left + rect.width  / 2)) * 0.45;
    var dy = (e.clientY - (rect.top  + rect.height / 2)) * 0.45;
    btn.style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';
  });
  btn.addEventListener('mouseleave', function() {
    btn.style.transition = 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)';
    btn.style.transform = '';
    btn.addEventListener('transitionend', function clear() {
      btn.style.transition = '';
      btn.removeEventListener('transitionend', clear);
    });
  });
});

/* ================================================
   TYPEWRITER — hero title
================================================ */
var titleEl = document.querySelector('.hero-title');
if (titleEl) {
  var roles = [
    'Backend Engineer',
    '.NET & Auth Systems',
    'OAuth 2.0 / OIDC / IdentityServer',
    'API Gateway & Kong',
    'C# / .NET Core / SQL Server'
  ];
  var ri = 0, ci = 0, deleting = false;
  var cursor = document.createElement('span');
  cursor.className = 'tw-cursor';

  titleEl.textContent = '';
  titleEl.appendChild(cursor);

  function tick() {
    var full = roles[ri];
    if (!deleting) {
      ci++;
      titleEl.textContent = full.slice(0, ci);
      titleEl.appendChild(cursor);
      if (ci === full.length) {
        deleting = true;
        setTimeout(tick, 2000);
      } else {
        setTimeout(tick, 52);
      }
    } else {
      ci--;
      titleEl.textContent = full.slice(0, ci);
      titleEl.appendChild(cursor);
      if (ci === 0) {
        deleting = false;
        ri = (ri + 1) % roles.length;
        setTimeout(tick, 320);
      } else {
        setTimeout(tick, 26);
      }
    }
  }
  setTimeout(tick, 900);
}

/* ================================================
   HERO SPOTLIGHT (cursor radial glow)
================================================ */
var heroSection = document.getElementById('hero');
if (heroSection) {
  var spotlight = document.createElement('div');
  spotlight.className = 'hero-spotlight';
  heroSection.appendChild(spotlight);

  heroSection.addEventListener('mousemove', function(e) {
    var rect = heroSection.getBoundingClientRect();
    spotlight.style.setProperty('--sx', ((e.clientX - rect.left) / rect.width  * 100).toFixed(1) + '%');
    spotlight.style.setProperty('--sy', ((e.clientY - rect.top)  / rect.height * 100).toFixed(1) + '%');
  });
}

/* ================================================
   SECTION HEADING UNDERLINE — on scroll reveal
================================================ */
var headingObs = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (entry.isIntersecting) {
      entry.target.classList.add('heading-visible');
      headingObs.unobserve(entry.target);
    }
  });
}, { threshold: 0.6 });
document.querySelectorAll('.section-heading').forEach(function(h) { headingObs.observe(h); });
