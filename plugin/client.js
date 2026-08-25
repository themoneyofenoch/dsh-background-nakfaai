// sidebar-bg client half — paints the left/main/right zones with per-zone images
// and provides a small picker (button + panel) to change each one yourself.
window.__ModuleLoader__.load({ id: 'dsh-background-nakfaai', factory: (require) => {
  var module = { exports: {} };
  var exports = module.exports;

  var STYLE_ID = 'sidebar-bg-css';
  var PANEL_ID = 'sidebar-bg-panel';
  var BTN_ID = 'sidebar-bg-btn';
  var STORAGE_KEY = 'sidebar-bg-zones';
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
    css.push('div[class*="_panel"], div[class*="_pane"], div[class*="workbench"], div[class*="bottomPanel"] { background-image: ' + rightBg + ' !important; background-size: cover !important; background-position: center !important; background-repeat: no-repeat !important; }');
    // Strip the opaque inner surfaces that would otherwise cover the zone
    // images (DSH 0.1.1-rc.2 web DOM: hHd-Xa_root / wSkVaW_root / nArs4W_*),
    // and the dsh-better-sidebar content panes that sit inside the workbench.
    css.push('div[class*="sidebarCol"] div[class*="root"], div[class*="sidebarCol"] div[class*="quietBars"] { background: transparent !important; }');
    css.push('div[class*="centerCol"] div[class*="root"] { background: transparent !important; }');
    css.push('div[class*="_panel"], div[class*="_pane"], div[class*="_tabBar"], div[class*="bottomPanel"] { background: transparent !important; }');
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
    var placementFrame = 0;
    var schedulePlace = function() {
      if (window.cancelAnimationFrame) window.cancelAnimationFrame(placementFrame);
      if (window.requestAnimationFrame) placementFrame = window.requestAnimationFrame(placeButton);
      else placeButton();
    };
    placeButton();
    if (window.addEventListener) window.addEventListener('resize', schedulePlace);
    if (window.MutationObserver) {
      try {
        btn._placeObserver = new MutationObserver(schedulePlace);
        btn._placeObserver.observe(document.body || document.documentElement, { childList: true, subtree: true, attributes: true });
      } catch (e) {}
    }
    // A light interval as a safety net (in case the observer misses an edge case).
    btn._placeTimer = setInterval(function(){ placeButton(); }, 1500);
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
    ctx.effect(function () { clearInterval(timer); }, 'sidebar-bg: picker');
  };

  return module.exports;
} });
