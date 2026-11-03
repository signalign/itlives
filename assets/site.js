(function () {
  // hero loop
  var hero = document.querySelector('video.hero');
  if (hero && window.matchMedia) {
    var rm = window.matchMedia('(prefers-reduced-motion: reduce)');
    function applyMotion() {
      if (rm.matches) {
        hero.removeAttribute('autoplay');
        hero.pause();
        hero.currentTime = 0;
      } else {
        var p = hero.play();
        if (p && p.catch) p.catch(function () {});
      }
    }
    applyMotion();
    if (rm.addEventListener) rm.addEventListener('change', applyMotion);
  }

  // image fallbacks
  document.querySelectorAll('img[data-fallback]').forEach(function (img) {
    function fb() {
      if (img.dataset.fallback && img.src.indexOf(img.dataset.fallback) < 0) {
        img.src = img.dataset.fallback;
      }
    }
    img.addEventListener('error', fb);
    if (img.complete && !img.naturalWidth) fb();
  });

  // label links that open a new tab
  document.querySelectorAll('a[target="_blank"]:not(.video)').forEach(function (a) {
    var t = document.createElement('span');
    t.className = 'sr';
    t.textContent = ' (opens in a new tab)';
    a.appendChild(t);
  });

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // reading progress
  var bar = document.querySelector('.progress span');
  var startEl = document.getElementById('essay'), endEl = document.querySelector('section.bib');
  var ticking = false;
  function paintProgress() {
    ticking = false;
    var start = startEl.getBoundingClientRect().top + scrollY - innerHeight * 0.2;
    var end = endEl.getBoundingClientRect().top + scrollY - innerHeight;
    var f = (scrollY - start) / Math.max(1, end - start);
    bar.style.transform = 'scaleX(' + Math.max(0, Math.min(1, f)) + ')';
  }
  function req() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(paintProgress);
    }
  }
  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', req);
  req();

  // scroll helpers
  var gliding = false;
  function glideTo(y, done) {
    y = Math.max(0, Math.min(y, document.documentElement.scrollHeight - innerHeight));
    if (reduce) {
      scrollTo(0, y);
      if (done) done();
      return;
    }
    var from = scrollY, dist = y - from, t0 = performance.now(), dur = Math.min(460, 180 + Math.abs(dist) / 40);
    gliding = true;
    (function step(now) {
      var k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      scrollTo(0, from + dist * e);
      if (k < 1) requestAnimationFrame(step);
      else {
        gliding = false;
        if (done) done();
      }
    })(t0);
  }
  function landingY(el) {
    return el.getBoundingClientRect().top + scrollY - innerHeight * 0.28;
  }

  document.querySelector('.top').addEventListener('click', function () {
    var h1 = document.querySelector('h1');
    h1.setAttribute('tabindex', '-1');
    glideTo(0, function () {
      h1.focus({ preventScroll: true });
    });
  });

  // footnotes
  var lit = null, litSince = 0;
  function dim() {
    if (lit) {
      lit.classList.remove('lit');
      lit = null;
    }
  }
  addEventListener('scroll', function () {
    if (lit && !gliding && performance.now() - litSince > 150) dim();
  }, { passive: true });
  addEventListener('pointerdown', function () {
    if (lit && !gliding) dim();
  }, true);
  addEventListener('keydown', function (e) {
    if (lit && e.key !== 'Tab' && e.key !== 'Shift') dim();
  }, true);

  document.querySelectorAll('sup.fn a').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var n = a.getAttribute('href').slice(5), li = document.getElementById('ref-' + n);
      if (!li) return;
      e.preventDefault();
      var back = li.querySelector('.back'), byKey = e.detail === 0;
      if (back) back.setAttribute('href', '#' + a.id);
      dim();
      history.replaceState(null, '', '#ref-' + n);
      glideTo(landingY(li), function () {
        lit = li;
        litSince = performance.now();
        li.classList.add('lit');
        if (byKey && back) back.focus({ preventScroll: true });
      });
    });
  });

  document.querySelectorAll('.bib .back').forEach(function (b) {
    b.addEventListener('click', function (e) {
      var t = document.getElementById(b.getAttribute('href').slice(1));
      if (!t) return;
      e.preventDefault();
      dim();
      var byKey = e.detail === 0;
      history.replaceState(null, '', '#' + t.id);
      glideTo(landingY(t), function () {
        lit = t;
        litSince = performance.now();
        t.classList.add('lit');
        if (byKey) t.focus({ preventScroll: true });
      });
    });
  });

  // video posters swap to the player on click
  var framed;
  try {
    framed = window.self !== window.top
  } catch (e) {
    framed = true
  }
  document.querySelectorAll('.video[data-yt]').forEach(function (a) {
    if (framed) return;
    a.addEventListener('click', function (ev) {
      ev.preventDefault();
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube.com/embed/' + a.dataset.yt + '?autoplay=1&rel=0&playsinline=1' + (a.dataset.start ? '&start=' + a.dataset.start : '');
      f.title = a.querySelector('img').alt;
      f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      f.allowFullscreen = true;
      var box = document.createElement('div');
      box.className = 'video';
      box.appendChild(f);
      a.replaceWith(box);
      f.focus();
    });
  });

  // page scroller
  var root = document.querySelector('.scroller'), track = root.querySelector('.track');
  var slides = Array.prototype.slice.call(track.children), n = slides.length;
  var prev = root.querySelector('.prev'), next = root.querySelector('.next');
  var count = root.querySelector('.count'), dots = root.querySelector('.dots'), cur = 0;
  slides.forEach(function (s, i) {
    var d = document.createElement('button');
    d.type = 'button';
    d.setAttribute('aria-label', 'Page ' + (i + 1));
    d.addEventListener('click', function () {
      go(i)
    });
    dots.appendChild(d);
  });
  function go(i) {
    i = Math.max(0, Math.min(n - 1, i));
    track.scrollTo({ left: slides[i].offsetLeft - track.offsetLeft, behavior: 'smooth' });
  }
  function update(i) {
    cur = i;
    if (count) count.textContent = (i + 1) + ' / ' + n;
    if (prev) prev.disabled = i === 0;
    if (next) next.disabled = i === n - 1;
    dots.querySelectorAll('button').forEach(function (d, j) {
      d.setAttribute('aria-current', j === i)
    });
  }
  track.addEventListener('scroll', function () {
    if (!track.clientWidth) return;
    var i = Math.round(track.scrollLeft / track.clientWidth);
    if (i !== cur && i >= 0 && i < n) update(i);
  }, { passive: true });
  if (prev) prev.addEventListener('click', function () {
    go(cur - 1)
  });
  if (next) next.addEventListener('click', function () {
    go(cur + 1)
  });
  track.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') {
      go(cur - 1);
      e.preventDefault()
    }
    if (e.key === 'ArrowRight') {
      go(cur + 1);
      e.preventDefault()
    }
  });
  window.addEventListener('resize', function () {
    if (track.clientWidth) track.scrollLeft = slides[cur].offsetLeft - track.offsetLeft;
  });
  update(0);

  // lightbox
  function setInert(on) {
    ['main', 'footer.site', '.skip'].forEach(function (q) {
      var el = document.querySelector(q);
      if (el) el.inert = on;
    });
  }
  var lb = document.querySelector('.lb'), lbImg = lb.querySelector('img'), lbDots = lb.querySelector('.lbdots'), li = 0, opener;
  slides.forEach(function (s, i) {
    var d = document.createElement('button');
    d.type = 'button';
    d.setAttribute('aria-label', 'Page ' + (i + 1));
    d.addEventListener('click', function () {
      show(i)
    });
    lbDots.appendChild(d);
  });
  function show(i) {
    li = (i + n) % n;
    var s = slides[li].querySelector('img');
    lbImg.src = s.src;
    lbImg.alt = s.alt;
    lbDots.querySelectorAll('button').forEach(function (d, j) {
      d.setAttribute('aria-current', j === li)
    });
    unzoom(false);
  }
  function open(i) {
    opener = document.activeElement;
    show(i);
    lb.hidden = false;
    setInert(true);
    document.body.style.overflow = 'hidden';
    lb.querySelector('.close').focus();
  }
  function close() {
    lb.hidden = true;
    unzoom(false);
    setInert(false);
    document.body.style.overflow = '';
    go(li);
    if (opener) opener.focus();
  }
  slides.forEach(function (s, i) {
    s.addEventListener('click', function () {
      open(i)
    });
  });
  lb.querySelector('.close').addEventListener('click', close);
  lb.querySelector('.prev').addEventListener('click', function () {
    show(li - 1)
  });
  lb.querySelector('.next').addEventListener('click', function () {
    show(li + 1)
  });
  lb.addEventListener('click', function (e) {
    if (e.target === lb) close();
  });
  document.addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(li - 1);
    if (e.key === 'ArrowRight') show(li + 1);
  });

  // zoom and swipe
  var z = { s: 1, tx: 0, ty: 0, ox: 0, oy: 0 }, ptr = null, lastTap = 0, lastX = 0, lastY = 0;
  lbImg.draggable = false;
  function paint(anim) {
    lbImg.style.transition = anim ? 'transform .25s ease, opacity .25s ease' : 'none';
    lbImg.style.transformOrigin = z.ox + 'px ' + z.oy + 'px';
    lbImg.style.transform = 'translate(' + z.tx + 'px,' + z.ty + 'px) scale(' + z.s + ')';
    lbImg.style.cursor = z.s > 1 ? 'grab' : '';
  }
  function unzoom(anim) {
    z.s = 1;
    z.tx = 0;
    z.ty = 0;
    lbImg.style.opacity = '';
    paint(anim);
  }
  function clampPan() {
    var w = lbImg.offsetWidth, h = lbImg.offsetHeight, k = z.s - 1;
    z.tx = Math.max(-(w - z.ox) * k, Math.min(z.ox * k, z.tx));
    z.ty = Math.max(-(h - z.oy) * k, Math.min(z.oy * k, z.ty));
  }
  function toggleZoom(x, y) {
    if (z.s > 1) {
      unzoom(true);
      return;
    }
    var r = lbImg.getBoundingClientRect();
    z.ox = Math.max(0, Math.min(r.width, x - r.left));
    z.oy = Math.max(0, Math.min(r.height, y - r.top));
    z.s = 2.5;
    z.tx = 0;
    z.ty = 0;
    paint(true);
  }
  lb.addEventListener('pointerdown', function (e) {
    if (e.target.closest('button')) return;
    if (ptr) {
      ptr = null;
      return;
    }
    ptr = { id: e.pointerId, x: e.clientX, y: e.clientY, tx: z.tx, ty: z.ty, onImg: e.target === lbImg, moved: false };
    if (ptr.onImg) e.preventDefault();
  });
  lb.addEventListener('pointermove', function (e) {
    if (!ptr || e.pointerId !== ptr.id) return;
    var dx = e.clientX - ptr.x, dy = e.clientY - ptr.y;
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) ptr.moved = true;
    if (!ptr.moved) return;
    if (z.s > 1) {
      z.tx = ptr.tx + dx;
      z.ty = ptr.ty + dy;
      clampPan();
      paint(false);
    }
    else if (dy > 0 && dy > Math.abs(dx)) {
      z.ty = dy;
      paint(false);
      lbImg.style.opacity = Math.max(.3, 1 - dy / 400);
    }
  });
  function endPtr(e) {
    if (!ptr || e.pointerId !== ptr.id) return;
    var p = ptr;
    ptr = null;
    var dx = e.clientX - p.x, dy = e.clientY - p.y;
    if (e.type === 'pointercancel') {
      if (z.s === 1) unzoom(true);
      return;
    }
    if (!p.moved) {
      if (!p.onImg) return;
      var now = Date.now();
      if (now - lastTap < 320 && Math.abs(e.clientX - lastX) < 30 && Math.abs(e.clientY - lastY) < 30) {
        lastTap = 0;
        toggleZoom(e.clientX, e.clientY);
      }
      else {
        lastTap = now;
        lastX = e.clientX;
        lastY = e.clientY;
      }
      return;
    }
    if (z.s > 1) return;
    if (dy > 90 && dy > Math.abs(dx)) {
      close();
      return;
    }
    unzoom(true);
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) show(li + (dx < 0 ? 1 : -1));
  }
  lb.addEventListener('pointerup', endPtr);
  lb.addEventListener('pointercancel', endPtr);
})();
