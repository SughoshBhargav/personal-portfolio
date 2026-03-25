/* ------ Hero orb canvas + particle constellation ------ */
(function() {
  var canvas = document.getElementById('orb-canvas');
  var ctx    = canvas.getContext('2d');
  var W, H;

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    // Re-spread particles on resize
    particles.forEach(function(p) {
      p.x = Math.random() * W;
      p.y = Math.random() * H;
    });
  }
  window.addEventListener('resize', resize);

  var ORBS = [
    { x: 0.18, y: 0.38, r: 320, hue: 250, speed: 0.00018 },
    { x: 0.72, y: 0.62, r: 260, hue: 195, speed: 0.00024 },
    { x: 0.5,  y: 0.2,  r: 200, hue: 220, speed: 0.0003  },
    { x: 0.85, y: 0.25, r: 180, hue: 240, speed: 0.00015 },
  ];

  /* Particles */
  var PCOUNT = 80;
  var particles = [];
  for (var i = 0; i < PCOUNT; i++) {
    particles.push({
      x: Math.random() * (window.innerWidth  || 900),
      y: Math.random() * (window.innerHeight || 600),
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r:  Math.random() * 1.2 + 0.4,
    });
  }
  var LINK_DIST   = 140;
  var MOUSE_REACH = 220;

  /* Track mouse over hero only */
  var _hmx = -9999, _hmy = -9999;
  document.addEventListener('mousemove', function(e) { _hmx = e.clientX; _hmy = e.clientY; });

  /* Wind state */
  var activeBlast  = null;  // propagating wave
  var blastTimer   = 0;

  /* Double-click on hero — wind gust */
  var heroEl = document.getElementById('hero');
  heroEl.addEventListener('dblclick', function(e) {
    var rect = canvas.getBoundingClientRect();
    var bx = e.clientX - rect.left;
    var by = e.clientY - rect.top;

    /* Mark all particles unblasted for this wave */
    particles.forEach(function(p) { p._hit = false; });

    activeBlast = { x: bx, y: by, waveR: 0, BLAST_R: 270, BLAST_F: 9.5 };
    blastTimer  = 45;

  });

  var t = 0;
  resize();

  var rafId = null;
  var obs = new IntersectionObserver(function(entries) {
    if (entries[0].isIntersecting) { if (!rafId) rafId = requestAnimationFrame(draw); }
    else { cancelAnimationFrame(rafId); rafId = null; }
  });
  obs.observe(canvas);

  function draw() {
    rafId = null;
    ctx.clearRect(0, 0, W, H);
    t += 1;
    var isLight = document.documentElement.getAttribute('data-theme') === 'light';

    /* Orb blobs */
    ORBS.forEach(function(o, i) {
      var phase = t * o.speed * Math.PI * 2;
      var ox    = (o.x + Math.sin(phase + i * 1.2) * 0.06) * W;
      var oy    = (o.y + Math.cos(phase + i * 0.8) * 0.05) * H;
      var grad  = ctx.createRadialGradient(ox, oy, 0, ox, oy, o.r);
      var alpha = isLight ? 0.06 + Math.sin(phase * 2) * 0.02 : 0.07 + Math.sin(phase * 2) * 0.02;
      grad.addColorStop(0, 'hsla(' + o.hue + ',' + (isLight ? 60 : 80) + '%,' + (isLight ? 55 : 65) + '%,' + alpha + ')');
      grad.addColorStop(1, 'hsla(0,0%,0%,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    });

    /* Blast shockwave rings */
    if (blastTimer > 0) blastTimer--;
    /* Propagating wind wave — hits particles as wavefront reaches them */
    if (activeBlast) {
      activeBlast.waveR += 38;
      particles.forEach(function(p) {
        if (p._hit) return;
        var dx = p.x - activeBlast.x, dy = p.y - activeBlast.y;
        var d  = Math.sqrt(dx * dx + dy * dy);
        if (d <= activeBlast.waveR && d <= activeBlast.BLAST_R && d > 0.5) {
          p._hit = true;
          var f = (1 - d / activeBlast.BLAST_R) * activeBlast.BLAST_F;
          var turb = (Math.random() - 0.5) * 0.7;
          var ca = Math.cos(turb), sa = Math.sin(turb);
          var nx = (dx / d) * ca - (dy / d) * sa;
          var ny = (dx / d) * sa + (dy / d) * ca;
          p.vx += nx * f;
          p.vy += ny * f;
        }
      });
      if (activeBlast.waveR > activeBlast.BLAST_R) activeBlast = null;
    }


    /* Particle update */
    var pCol = isLight ? '79,70,229' : '129,140,248';
    particles.forEach(function(p) {
      /* Mouse attraction */
      var dx = _hmx - p.x, dy = _hmy - p.y;
      var d  = Math.sqrt(dx * dx + dy * dy);
      if (d < MOUSE_REACH && d > 1) {
        var f = ((MOUSE_REACH - d) / MOUSE_REACH) * 0.045;
        p.vx += (dx / d) * f;
        p.vy += (dy / d) * f;
      }
      p.vx *= 0.982;
      p.vy *= 0.982;
      var spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      var maxSpd = blastTimer > 0 ? 14 : 1.8;
      if (spd > maxSpd) { p.vx = p.vx / spd * maxSpd; p.vy = p.vy / spd * maxSpd; }
      p.x = (p.x + p.vx + W) % W;
      p.y = (p.y + p.vy + H) % H;

      /* Dot */
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + pCol + ',' + (isLight ? 0.55 : 0.45) + ')';
      ctx.fill();
    });

    /* Combined particle-particle repulsion + constellation lines — each pair visited once */
    var REP_D = 36;
    for (var a = 0; a < particles.length - 1; a++) {
      for (var b = a + 1; b < particles.length; b++) {
        var rdx = particles[a].x - particles[b].x;
        var rdy = particles[a].y - particles[b].y;
        var rd  = Math.sqrt(rdx * rdx + rdy * rdy);
        /* Repulsion */
        if (rd < REP_D && rd > 0.5) {
          var rf = (REP_D - rd) / REP_D * 0.016;
          var fx = (rdx / rd) * rf, fy = (rdy / rd) * rf;
          particles[a].vx += fx; particles[a].vy += fy;
          particles[b].vx -= fx; particles[b].vy -= fy;
        }
        /* Constellation lines */
        if (rd < LINK_DIST) {
          var la = (1 - rd / LINK_DIST) * (isLight ? 0.3 : 0.24);
          ctx.beginPath();
          ctx.moveTo(particles[a].x, particles[a].y);
          ctx.lineTo(particles[b].x, particles[b].y);
          ctx.strokeStyle = 'rgba(' + pCol + ',' + la + ')';
          ctx.lineWidth = 0.65;
          ctx.stroke();

          /* Proximity spark — tiny glow where particles are very close */
          if (rd < 22) {
            var sx = (particles[a].x + particles[b].x) * 0.5;
            var sy = (particles[a].y + particles[b].y) * 0.5;
            var sa = (1 - rd / 22) * (isLight ? 0.55 : 0.7);
            var sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, 7);
            sg.addColorStop(0, 'rgba(255,255,255,' + sa + ')');
            sg.addColorStop(1, 'rgba(' + pCol + ',0)');
            ctx.beginPath();
            ctx.arc(sx, sy, 7, 0, Math.PI * 2);
            ctx.fillStyle = sg;
            ctx.fill();
          }
        }
      }
    }

    rafId = requestAnimationFrame(draw);
  }
})();

// Auth Flow Canvas — Authorization Code + PKCE (Sequence Diagram)
(function() {
  var canvas = document.getElementById('auth-flow-canvas');
  if (!canvas) return;
  function resize() { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; }
  resize();
  window.addEventListener('resize', resize);
  var ctx = canvas.getContext('2d');

  function tc() {
    var light = document.documentElement.getAttribute('data-theme') === 'light';
    return {
      TEXT:            light ? '#57534e'               : '#94a3b8',
      BRIGHT:          light ? '#1c1917'               : '#f1f5f9',
      NODE_ACCENT_BG:  light ? 'rgba(79,70,229,0.1)'  : 'rgba(99,102,241,0.18)',
      NODE_BG:         light ? 'rgba(79,70,229,0.05)'  : 'rgba(99,102,241,0.06)',
      NODE_ACCENT_BD:  light ? 'rgba(79,70,229,0.65)' : 'rgba(99,102,241,0.65)',
      NODE_BD:         light ? 'rgba(79,70,229,0.28)'  : 'rgba(99,102,241,0.22)',
      LIFELINE:        light ? 'rgba(79,70,229,0.22)'  : 'rgba(99,102,241,0.18)',
      INDIGO:          light ? '#4f46e5'               : '#818cf8',
      CYAN:            light ? '#0284c7'               : '#06b6d4',
      GREEN:           light ? '#059669'               : '#34d399',
    };
  }
  var NW=72, NH=26, NR=6, STEP_DUR=155, WAIT_DUR=50;

  // Node order: User(0) — Client App(1) — Auth Server(2) — Resource(3)
  var steps = [
    { f:0, t:1, label:'1. Visit app',                      col:'INDIGO' },
    { f:1, t:2, label:'2. /authorize (code_challenge)',     col:'CYAN'   },
    { f:0, t:2, label:'3. User: Login / Consent',           col:'INDIGO' },
    { f:2, t:1, label:'4. Redirect w/ auth code',          col:'CYAN'   },
    { f:1, t:2, label:'5. POST /token (code+verifier)',    col:'INDIGO' },
    { f:2, t:1, label:'6. Access token + ID token',        col:'GREEN'  },
    { f:1, t:3, label:'7. Client: API w/ access token',   col:'GREEN'  },
  ];

  function getLayout(W, H) {
    var spacing = (W - 4*NW) / 5;
    var nodeY = 10;
    var nodes = [
      { x: spacing,               y: nodeY, label: 'User',        accent: false },
      { x: spacing*2 + NW,        y: nodeY, label: 'Client App',  accent: true  },
      { x: spacing*3 + NW*2,      y: nodeY, label: 'Auth Server', accent: true  },
      { x: spacing*4 + NW*3,      y: nodeY, label: 'Resource',    accent: false },
    ];
    var topPad = nodeY + NH + 10;
    var stepH = (H - topPad - 10) / steps.length;
    return { nodes: nodes, topPad: topPad, stepH: stepH };
  }

  var stepIdx=0, progress=0, waiting=false, waitTimer=0;
  function ease(t){ return t<.5?2*t*t:-1+(4-2*t)*t; }

  function rrect(x,y,w,h,r,fill,stroke){
    ctx.beginPath();
    ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.arcTo(x+w,y,x+w,y+r,r);
    ctx.lineTo(x+w,y+h-r); ctx.arcTo(x+w,y+h,x+w-r,y+h,r);
    ctx.lineTo(x+r,y+h); ctx.arcTo(x,y+h,x,y+h-r,r);
    ctx.lineTo(x,y+r); ctx.arcTo(x,y,x+r,y,r); ctx.closePath();
    ctx.fillStyle=fill; ctx.fill(); ctx.strokeStyle=stroke; ctx.lineWidth=1.5; ctx.stroke();
  }

  function drawNode(n) {
    var t = tc();
    rrect(n.x, n.y, NW, NH, NR,
      n.accent ? t.NODE_ACCENT_BG : t.NODE_BG,
      n.accent ? t.NODE_ACCENT_BD : t.NODE_BD);
    ctx.fillStyle = n.accent ? t.BRIGHT : t.TEXT;
    ctx.font = '500 9.5px Inter,sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(n.label, n.x + NW/2, n.y + NH/2);
  }

  function drawArrow(x1, y, x2, color, alpha) {
    var dir = x2 > x1 ? 1 : -1;
    ctx.globalAlpha = alpha;
    ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y);
    ctx.strokeStyle = color; ctx.lineWidth = 1.3; ctx.setLineDash([4,3]); ctx.stroke(); ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(x2, y); ctx.lineTo(x2 - dir*8*Math.cos(0.38), y - 8*Math.sin(0.38));
    ctx.moveTo(x2, y); ctx.lineTo(x2 - dir*8*Math.cos(0.38), y + 8*Math.sin(0.38));
    ctx.strokeStyle = color; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.globalAlpha = 1;
  }

  var authRafId = null;
  var authObs = new IntersectionObserver(function(entries) {
    if (entries[0].isIntersecting) { if (!authRafId) authRafId = requestAnimationFrame(frame); }
    else { cancelAnimationFrame(authRafId); authRafId = null; }
  });
  authObs.observe(canvas);

  function frame() {
    authRafId = null;
    var W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    var layout = getLayout(W, H);
    var nodes = layout.nodes, topPad = layout.topPad, stepH = layout.stepH;

    // Lifelines
    var t = tc();
    nodes.forEach(function(n) {
      var cx = n.x + NW/2;
      ctx.beginPath(); ctx.moveTo(cx, n.y + NH); ctx.lineTo(cx, H - 4);
      ctx.strokeStyle = t.LIFELINE; ctx.lineWidth = 1;
      ctx.setLineDash([3,5]); ctx.stroke(); ctx.setLineDash([]);
    });

    // Completed steps
    for (var i = 0; i < stepIdx; i++) {
      var s = steps[i]; var sc = t[s.col];
      var y = topPad + (i + 0.5) * stepH;
      var x1 = nodes[s.f].x + NW/2, x2 = nodes[s.t].x + NW/2;
      drawArrow(x1, y, x2, sc, 0.55);
      ctx.globalAlpha = 0.65; ctx.beginPath(); ctx.arc(x1, y, 3, 0, Math.PI*2); ctx.fillStyle = sc; ctx.fill();
      ctx.globalAlpha = 0.75; ctx.fillStyle = sc;
      ctx.font = '7.5px JetBrains Mono,monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText(s.label, (x1+x2)/2, y - 3);
      ctx.globalAlpha = 1;
    }

    // Active step
    if (stepIdx < steps.length) {
      var s = steps[stepIdx]; var sc = t[s.col];
      var y = topPad + (stepIdx + 0.5) * stepH;
      var x1 = nodes[s.f].x + NW/2, x2 = nodes[s.t].x + NW/2;
      var p = ease(Math.min(progress / STEP_DUR, 1));
      var cx = x1 + (x2 - x1) * p;
      var dir = x2 > x1 ? 1 : -1;

      ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(cx, y);
      ctx.strokeStyle = sc; ctx.lineWidth = 1.6; ctx.setLineDash([4,3]); ctx.stroke(); ctx.setLineDash([]);

      if (p > 0.1) {
        ctx.beginPath();
        ctx.moveTo(cx, y); ctx.lineTo(cx - dir*8*Math.cos(0.38), y - 8*Math.sin(0.38));
        ctx.moveTo(cx, y); ctx.lineTo(cx - dir*8*Math.cos(0.38), y + 8*Math.sin(0.38));
        ctx.strokeStyle = sc; ctx.lineWidth = 1.5; ctx.stroke();
      }

      var grd = ctx.createRadialGradient(cx, y, 0, cx, y, 9);
      // sc is always 6-digit hex from tc() — 'cc' appends 80% alpha
      grd.addColorStop(0, sc + 'cc'); grd.addColorStop(1, 'transparent');
      ctx.beginPath(); ctx.arc(cx, y, 9, 0, Math.PI*2); ctx.fillStyle = grd; ctx.fill();
      ctx.beginPath(); ctx.arc(cx, y, 2.5, 0, Math.PI*2); ctx.fillStyle = sc; ctx.fill();

      if (p > 0.4) {
        ctx.globalAlpha = Math.min((p-0.4)/0.2, 1);
        ctx.fillStyle = sc; ctx.font = 'bold 8px JetBrains Mono,monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.fillText(s.label, (x1+x2)/2, y - 3);
        ctx.globalAlpha = 1;
      }
    }

    // Node boxes drawn on top
    nodes.forEach(drawNode);

    if (!waiting) {
      progress++;
      if (progress >= STEP_DUR) {
        progress = 0; waiting = true; waitTimer = 0; stepIdx++;
        if (stepIdx >= steps.length) { setTimeout(function() { stepIdx = 0; waiting = false; }, 2000); authRafId = requestAnimationFrame(frame); return; }
      }
    } else { waitTimer++; if (waitTimer >= WAIT_DUR) { waiting = false; waitTimer = 0; } }
    authRafId = requestAnimationFrame(frame);
  }
})();
