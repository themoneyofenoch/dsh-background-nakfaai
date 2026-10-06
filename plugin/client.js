// sidebar-bg client half — paints the left/main/right zones with per-zone images
// and provides a small picker (button + panel) to change each one yourself.
window.__ModuleLoader__.load({ id: 'dsh-background-nakfaai', factory: (require) => {
  var module = { exports: {} };
  var exports = module.exports;

  var STYLE_ID = 'sidebar-bg-css';
  var PANEL_ID = 'sidebar-bg-panel';
  var BTN_ID = 'sidebar-bg-btn';
  var STORAGE_KEY = 'sidebar-bg-zones';
  // React comes from the client module table (a platform seed). Guarded so an
  // older shell without it still gets the floating picker below.
  var react = null;
  try { react = require('react'); } catch (e) { react = null; }
  var DEFAULT = { left: '/sidebar-bg/sidebar.webp', main: '/sidebar-bg/sidebar.webp', right: '/sidebar-bg/sidebar.webp', strength: { left: 0.6, main: 0.4, right: 0.5 } };

  function loadZones() {
    try { var v = localStorage.getItem(STORAGE_KEY); if (v) return Object.assign({}, DEFAULT, JSON.parse(v)); } catch (e) {}
    return Object.assign({}, DEFAULT);
  }
  function saveZones(z) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(z)); } catch (e) {} }

  function imgOverlay(url, strength) {
    // strength 0..1: 0 = fully transparent (photo at full brightness),
    // 1 = fully opaque dark (photo completely hidden, text fully readable).
    var s = Math.max(0, Math.min(1, strength == null ? 0.5 : Number(strength)));
    return 'linear-gradient(rgba(8,10,16,' + s.toFixed(2) + '), rgba(8,10,16,' + s.toFixed(2) + ')), url("' + url + '")';
  }

  function injectCss() {
    var zones = loadZones();
    var css = [];
    // ALL zones share custom props; each rule reads its own.
    css.push('/* ---- sidebar-bg: per-zone backgrounds (editable via picker) ---- */');
    // Left sidebar — the left zone always shows an image (stale/empty
    // saved values fall back to the bundled default instead of blanking).
    var leftSt = (zones.strength && zones.strength.left != null) ? zones.strength.left : 0.6;
    var leftVal = zones.left || DEFAULT.left;
    var leftBg = imgOverlay(leftVal, leftSt);
    css.push('div[class*="sidebarCol"][class*="sidebarCol"] { background-image: ' + leftBg + ' !important; background-size: cover !important; background-position: center !important; background-repeat: no-repeat !important; background-color: transparent !important; }');
    css.push('div[class*="sidebarCol"][class*="sidebarCol"] a, div[class*="sidebarCol"][class*="sidebarCol"] button, div[class*="sidebarCol"][class*="sidebarCol"] span, div[class*="sidebarCol"][class*="sidebarCol"] div { text-shadow: 0 1px 2px rgba(0,0,0,0.6); }');
    // The "New session" CTA is a solid white slab; make it translucent so it
    // does not cover the top of the sidebar image.
    css.push('div[class*="newSession"] { background: rgba(255,255,255,0.10) !important; box-shadow: none !important; }');
    // Main / center
    var mainSt = (zones.strength && zones.strength.main != null) ? zones.strength.main : 0.4;
    var mainBg = zones.main ? imgOverlay(zones.main, mainSt) : 'none';
    css.push('div[class*="centerCol"] { background-image: ' + mainBg + ' !important; background-size: cover !important; background-position: center !important; background-repeat: no-repeat !important; background-attachment: fixed !important; }');
    css.push('div[class*="frame"] { background-image: ' + mainBg + ' !important; background-size: cover !important; background-position: center !important; background-repeat: no-repeat !important; background-attachment: fixed !important; }');
    // Right bar: the harness workbench panel (nArs4W_*) plus the
    // dsh-better-sidebar content panes (wxwsGW_*) that render inside it.
    // The right zone always shows an image (falls back to the bundled one),
    // matching the left zone.
    var rightSt = (zones.strength && zones.strength.right != null) ? zones.strength.right : 0.5;
    var rightVal = zones.right || DEFAULT.right;
    var rightBg = imgOverlay(rightVal, rightSt);
    // Scoped to the right zone and its own panes: an app-wide [class*="_panel"]
    // rule paints backgrounds onto unrelated dialogs too.
    css.push('div[class*="sidebarRight"], div[class*="rightCol"], div[class*="workbench"], div[class*="bottomPanel"], div[class*="sidebarRight"] div[class*="_panel"], div[class*="sidebarRight"] div[class*="_pane"], div[class*="rightCol"] div[class*="_panel"], div[class*="rightCol"] div[class*="_pane"] { background-image: ' + rightBg + ' !important; background-size: cover !important; background-position: center !important; background-repeat: no-repeat !important; }');
    // Strip the opaque inner surfaces that would otherwise cover the zone
    // images (hashed *_root / *_pane class fragments), and the sidebar content
    // panes that sit inside the workbench.
    // DSH 0.1.7-rc.2 renamed the right workbench: it is now `SidebarRight`
    // (class fragments sidebarRight / rightCol) — the old `workbench` and
    // `bottomPanel` fragments no longer exist, so both are kept for older cores.
    css.push('div[class*="sidebarCol"] div[class*="root"], div[class*="sidebarCol"] div[class*="quietBars"] { background: transparent !important; }');
    css.push('div[class*="centerCol"] div[class*="root"] { background: transparent !important; }');
    // Scoped: an unscoped [class*="_panel"] rule strips the background from
    // every panel in the app (approval dialogs, todo/plan panels, ...).
    css.push('div[class*="sidebarRight"], div[class*="rightCol"], div[class*="bottomPanel"] { background: transparent !important; }');
    css.push('div[class*="sidebarRight"] div[class*="_panel"], div[class*="sidebarRight"] div[class*="_pane"], div[class*="sidebarRight"] div[class*="_tabBar"], div[class*="rightCol"] div[class*="_panel"], div[class*="rightCol"] div[class*="_pane"], div[class*="rightCol"] div[class*="_tabBar"] { background: transparent !important; }');
    css.push('div[class*="wxwsGW_jobs"], div[class*="wxwsGW_subagent"] { background: transparent !important; }');
    var style = document.getElementById(STYLE_ID);
    if (!style) { style = document.createElement('style'); style.id = STYLE_ID; document.head.appendChild(style); }
    style.textContent = css.join('\n');
  }

  function openPanel() {
    var existing = document.getElementById(PANEL_ID);
    if (existing) { existing.remove(); return; }
    var panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.style.cssText = 'position:fixed;left:8px;bottom:56px;z-index:100000;background:#141821;border:1px solid #2a2f3a;border-radius:10px;padding:14px 16px;width:260px;color:#e6e8ee;font:13px -apple-system,Segoe UI,sans-serif;box-shadow:0 8px 30px rgba(0,0,0,.5)';
    panel.innerHTML = '<div style="font-weight:700;margin-bottom:8px;font-size:14px">Background</div>' +
      '<div id="sb-bg-list" style="color:#8b93a3;font-size:12px;margin-bottom:4px">Loading images…</div>';
    // three rows
    ['left','main','right'].forEach(function(key){
      var label = { left:'Left bar', main:'Main chat', right:'Right bar' }[key];
      var row = document.createElement('div');
      row.style.cssText = 'margin:6px 0';
      row.innerHTML = '<div style="color:#8b93a3;font-size:12px;margin-bottom:2px">' + label + '</div>';
      var sel = document.createElement('select');
      sel.style.cssText = 'width:100%;padding:6px;background:#0d0f14;color:#e6e8ee;border:1px solid #2a2f3a;border-radius:6px';
      sel.dataset.zone = key;
      row.appendChild(sel);
      // strength slider row
      var strWrap = document.createElement('div');
      strWrap.style.cssText = 'display:flex;align-items:center;gap:8px;margin-top:4px';
      var strLabel = document.createElement('span');
      strLabel.textContent = 'Strong';
      strLabel.style.cssText = 'color:#8b93a3;font-size:11px;width:42px';
      var strInput = document.createElement('input');
      strInput.type = 'range';
      strInput.min = '0'; strInput.max = '100'; strInput.step = '5';
      strInput.dataset.strengthZone = key;
      strInput.style.cssText = 'flex:1;accent-color:#4f8cff';
      var strVal = document.createElement('span');
      strVal.style.cssText = 'color:#e6e8ee;font-size:11px;width:38px;text-align:right';
      strWrap.appendChild(strLabel);
      strWrap.appendChild(strInput);
      strWrap.appendChild(strVal);
      row.appendChild(strWrap);
      panel.appendChild(row);
    });
    // close button
    var close = document.createElement('button');
    close.textContent = 'Close';
    close.style.cssText = 'width:100%;margin-top:10px;padding:7px;background:#2a2f3a;color:#e6e8ee;border:none;border-radius:6px;cursor:pointer';
    close.onclick = function(){ panel.remove(); };
    panel.appendChild(close);
    document.body.appendChild(panel);

    // populate selects
    var zones = loadZones();
    fetch('/sidebar-bg/list.json').then(function(r){ return r.json(); }).then(function(d){
      var images = (d && d.images) || [];
      var list = document.getElementById('sb-bg-list');
      list.textContent = (d && d.dir) ? ('Images in ' + d.dir) : ('No images found');
      ['left','main','right'].forEach(function(key){
        var sel = document.querySelector('#sidebar-bg-panel select[data-zone="'+key+'"]');
        if (!sel) return;
        // option "None" (only main/right can be none)
        if (key !== 'left') {
          var noneOpt = document.createElement('option');
          noneOpt.value = ''; noneOpt.textContent = key === 'right' ? '(default)' : '(default / hide)';
          sel.appendChild(noneOpt);
        }
        images.forEach(function(im){
          var opt = document.createElement('option');
          opt.value = im.url; opt.textContent = im.name;
          sel.appendChild(opt);
        });
        sel.value = zones[key] || '';
        sel.onchange = function(){
          var z = loadZones();
          z[key] = sel.value || null;
          saveZones(z); injectCss();
        };
        // strength slider wiring
        var strInput = document.querySelector('#sidebar-bg-panel input[data-strength-zone="'+key+'"]');
        var strVal = document.querySelector('#sidebar-bg-panel input[data-strength-zone="'+key+'"] ~ span:last-child');
        if (strInput) {
          var cur = (zones.strength && zones.strength[key]) != null ? Math.round(zones.strength[key]*100) : 50;
          strInput.value = cur;
          if (strVal) strVal.textContent = cur + '%';
          strInput.oninput = function(){
            var v = Number(strInput.value)/100;
            if (strVal) strVal.textContent = strInput.value + '%';
            var z = loadZones();
            if (!z.strength) z.strength = {};
            z.strength[key] = v;
            saveZones(z); injectCss();
          };
        }
      });
    }).catch(function(e){
      var list = document.getElementById('sb-bg-list');
      if (list) list.textContent = 'Error loading: ' + e;
    });
  }

  function addButton() {
    if (document.getElementById(BTN_ID)) return;
    var btn = document.createElement('button');
    btn.id = BTN_ID;
    btn.textContent = '🌌';
    btn.title = 'Background';
    btn.style.cssText = 'position:fixed;z-index:2147483647;width:28px;height:28px;border-radius:8px;border:1px solid rgba(255,255,255,.14);background:rgba(12,16,22,.58);backdrop-filter:blur(14px) saturate(130%);color:#e6e8ee;cursor:pointer;font-size:14px;line-height:1;display:flex;align-items:center;justify-content:center';
    btn.style.transition = 'opacity .15s, background .18s, border-color .18s, transform .1s';
    btn.onmouseenter = function(){ btn.style.opacity = '1'; btn.style.color = '#8fe9e4'; };
    btn.onmouseleave = function(){ btn.style.opacity = '.9'; btn.style.color = '#e6e8ee'; };
    btn.onclick = openPanel;
    document.body.appendChild(btn);

    // Copy the open-sea-skin anchoring: pin to the Settings trigger so it stays
    // proportional, but place it ABOVE the skin icon with a ~10px gap.
    var placeButton = function() {
      var selectors = ['[data-slot="sidebar.settings"] button', '[data-testid="settings-trigger"]', '.VOzbGW_trigger'];
      var trigger = null;
      for (var i=0;i<selectors.length;i++) {
        var cand = document.querySelector(selectors[i]);
        if (cand instanceof HTMLElement && cand.getBoundingClientRect().width > 0) { trigger = cand; break; }
      }
      if (trigger instanceof HTMLElement) {
        var rect = trigger.getBoundingClientRect();
        // Same x column as the skin icon (right of trigger). Skin icon is 34px,
        // centered on trigger. Put our 28px button directly ABOVE it.
        var skinTop = rect.top + rect.height / 2 - 17; // skin icon's top = trigger center - 17
        btn.style.left = (rect.right + 8 + 3) + 'px';   // same column as skin, tiny centering
        btn.style.top = (skinTop - 28 - 10) + 'px';      // 10px above the skin icon's top
        btn.style.bottom = 'auto';
      } else {
        btn.style.left = '16px';
        btn.style.bottom = '68px'; // fallback: above the default bottom-left
        btn.style.top = 'auto';
      }
    };
    // Keep the button pinned like the skin icon: re-anchor whenever the DOM
    // changes or the window resizes (MutationObserver + resize + rAF), so it
    // never drifts when the page moves.
    // Debounced: a chat app mutates the DOM on every streaming token, and each
    // anchor pass costs three querySelectors plus a forced layout.
    var placementFrame = 0, placementDelay = 0;
    var schedulePlace = function() {
      if (placementDelay) clearTimeout(placementDelay);
      placementDelay = setTimeout(function() {
        placementDelay = 0;
        if (window.requestAnimationFrame) {
          if (placementFrame && window.cancelAnimationFrame) window.cancelAnimationFrame(placementFrame);
          placementFrame = window.requestAnimationFrame(placeButton);
        } else placeButton();
      }, 120);
    };
    placeButton();
    btn._placeListener = schedulePlace;
    if (window.addEventListener) window.addEventListener('resize', schedulePlace);
    if (window.MutationObserver) {
      try {
        btn._placeObserver = new MutationObserver(schedulePlace);
        // childList only — `attributes: true` fires on every class/style tweak.
        btn._placeObserver.observe(document.body || document.documentElement, { childList: true, subtree: true });
      } catch (e) {}
    }
    // Slow safety net (in case the observer misses an edge case).
    btn._placeTimer = setInterval(function(){ placeButton(); }, 5000);
  }

  // ---------------------------------------------------------------------------
  // Plugins-page configuration (slot "plugins.bundle.config", keyed by package
  // name). Renders the same three zones + strength controls as the floating
  // picker, but inside the plugin's own page — no DOM anchor required, so it
  // works in the desktop app where [data-testid="settings-trigger"] is gone.
  // ---------------------------------------------------------------------------
  var ZONE_LABELS = { left: 'Left bar', main: 'Main chat', right: 'Right bar' };

  function zoneStrength(zones, key) {
    var v = zones && zones.strength ? zones.strength[key] : null;
    return v == null ? 0.5 : v;
  }

  function BackgroundConfig() {
    var h = react.createElement;
    var zonesState = react.useState(loadZones());
    var zones = zonesState[0], setZones = zonesState[1];
    var listState = react.useState({ dir: '', images: [] });
    var listing = listState[0], setListing = listState[1];

    react.useEffect(function () {
      var alive = true;
      fetch('/sidebar-bg/list.json').then(function (r) { return r.json(); }).then(function (d) {
        if (alive) setListing({ dir: (d && d.dir) || '', images: (d && d.images) || [] });
      }).catch(function () { if (alive) setListing({ dir: '', images: [] }); });
      return function () { alive = false; };
    }, []);

    function commit(next) { setZones(next); saveZones(next); injectCss(); }
    function pickImage(key, url) {
      var next = Object.assign({}, zones);
      next[key] = url || null;
      commit(next);
    }
    function setStrength(key, value) {
      var next = Object.assign({}, zones);
      next.strength = Object.assign({}, zones.strength);
      next.strength[key] = value;
      commit(next);
    }

    var rows = ['left', 'main', 'right'].map(function (key) {
      var options = [{ value: '', label: key === 'right' ? '(default)' : '(default / hide)' }]
        .concat(listing.images.map(function (im) { return { value: im.url, label: im.name }; }));
      var pct = Math.round(zoneStrength(zones, key) * 100);
      return h('div', { key: key, style: { margin: '10px 0' } }, [
        h('div', { key: 'label', style: { fontSize: 12, color: '#8b93a3', marginBottom: 4 } }, ZONE_LABELS[key]),
        h('select', {
          key: 'select',
          value: zones[key] || '',
          onChange: function (e) { pickImage(key, e.target.value); },
          style: { width: '100%', padding: '6px', background: '#0d0f14', color: '#e6e8ee', border: '1px solid #2a2f3a', borderRadius: 6 }
        }, options.map(function (o) { return h('option', { key: o.value || 'none', value: o.value }, o.label); })),
        h('div', { key: 'strength', style: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 } }, [
          h('span', { key: 'a', style: { fontSize: 11, color: '#8b93a3', width: 42 } }, 'Strong'),
          h('input', {
            key: 'b',
            type: 'range', min: 0, max: 100, step: 5, value: pct,
            onChange: function (e) { setStrength(key, Number(e.target.value) / 100); },
            style: { flex: 1, accentColor: '#4f8cff' }
          }),
          h('span', { key: 'c', style: { fontSize: 11, width: 38, textAlign: 'right' } }, pct + '%')
        ])
      ]);
    });

    return h('div', null, [
      h('div', { key: 'title', style: { fontWeight: 700, fontSize: 14, marginBottom: 6 } }, 'Background'),
      h('div', { key: 'hint', style: { fontSize: 12, color: '#8b93a3' } },
        listing.dir ? ('Images in ' + listing.dir) : (listing.images.length ? '' : 'No images found — the bundled default is used')),
      h('div', { key: 'rows' }, rows)
    ]);
  }

  // ---------------------------------------------------------------------------
  // Settings section ("Background") — lives in the Settings left nav next to
  // the theme/skin section, not on the Plugins page. Registers a settings
  // section plus its own child slot, the same shape the skin plugin uses.
  // ---------------------------------------------------------------------------
  // DSH 0.2.0 declares every `settings.*` slot itself and enforces slot
  // ownership: injecting a key no registration declared throws
  // SlotOwnershipError("slot 'X' is not declared by this entry's children"),
  // which fails the whole web boot. `settings.section` is a plain
  // { kind: 'list', scope: 'root' } slot with no children table, so this plugin
  // must render its own config inline here instead of registering a child slot.
  function BackgroundSection() {
    var h = react.createElement;
    return h('div', { style: { display: 'flex', flexDirection: 'column', gap: 4 } },
      h(BackgroundConfig, null));
  }

  exports.name = 'dsh-background-nakfaai';
  exports.inject = [];
  exports.apply = function apply(ctx) {
    function init() {
      injectCss();
      addButton();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
    var tries = 0;
    var timer = setInterval(function () {
      init();
      if (++tries > 8) clearInterval(timer);
    }, 1000);
    // Settings → "Background" section (next to the theme/skin section).
    // "settings.section" is a list slot (needs id). It declares NO children in
    // DSH 0.2.0, so the config UI is rendered inline by BackgroundSection
    // rather than through a child slot registration (see the note above it).
    if (react && ctx.slots && typeof ctx.slots.inject === 'function') {
      var disposeSection = ctx.slots.inject('settings.section', function () {
        try {
          return ctx.slots.register({
            name: 'settings.section',
            id: 'sidebar-bg',
            order: 12,
            label: 'Background'
          }, BackgroundSection);
        } catch (e) { return undefined; }
      });
      ctx.effect(function () {
        if (typeof disposeSection === 'function') disposeSection();
      }, 'sidebar-bg: settings section');
    }

    // Full teardown: interval, observer, resize listener, safety timer, button,
    // picker and style tag — otherwise a reload leaves a second copy behind.
    ctx.effect(function () {
      clearInterval(timer);
      var btn = document.getElementById(BTN_ID);
      if (btn) {
        if (btn._placeObserver) { try { btn._placeObserver.disconnect(); } catch (e) {} }
        if (btn._placeTimer) clearInterval(btn._placeTimer);
        if (btn._placeListener && window.removeEventListener) window.removeEventListener('resize', btn._placeListener);
        btn.remove();
      }
      var panel = document.getElementById(PANEL_ID);
      if (panel) panel.remove();
      var style = document.getElementById(STYLE_ID);
      if (style) style.remove();
    }, 'sidebar-bg: picker');
  };

  return module.exports;
} });
