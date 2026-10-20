/* =========================================================
   四平 · 我的家乡 —— 交互逻辑
   ========================================================= */
(function () {
  'use strict';

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));

  const esc = (s) =>
    String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  /* 图片占位：有图则显示，无图则退化为带地名的版画式占位块 */
  function ph(src, alt, cat, text) {
    return '<figure class="ph" data-cat="' + esc(cat || '') + '" data-ph="' + esc(text || alt || '') + '">' +
      '<img src="' + esc(src) + '" alt="' + esc(alt) + '" loading="lazy" decoding="async">' +
      '</figure>';
  }
  function initPh(root) {
    $$('.ph', root).forEach((fig) => {
      const img = $('img', fig);
      if (!img) return;
      const ok = () => { fig.classList.add('has-img'); img.classList.remove('is-missing'); };
      const bad = () => { fig.classList.remove('has-img'); img.classList.add('is-missing'); };
      if (img.complete) { img.naturalWidth > 0 ? ok() : bad(); }
      else { img.addEventListener('load', ok); img.addEventListener('error', bad); }
    });
  }

  /* ---------------- 导航 ---------------- */
  function renderNav() {
    const links = NAV.map((n) => '<a href="#' + n.id + '" data-spy="' + n.id + '">' + n.label + '</a>').join('');
    $('#navLinks').innerHTML = links;
    $('#footNav').innerHTML = NAV.map((n) => '<a href="#' + n.id + '">' + n.label + '</a>').join('');

    const toggle = $('#navToggle');
    const box = $('#navLinks');
    toggle.addEventListener('click', () => box.classList.toggle('is-open'));
    box.addEventListener('click', (e) => { if (e.target.tagName === 'A') box.classList.remove('is-open'); });
  }

  /* ---------------- 首屏 ---------------- */
  function renderHero() {
    $('#heroPlace').textContent = SITE.place;
    $('#heroSlogan').textContent = SITE.slogan;
    $('#heroLead').textContent = SITE.lead;
    $('#heroStats').innerHTML = STATS.slice(0, 4).map(
      (s) => '<li><b>' + esc(s.num) + '</b><span>' + esc(s.label) + '</span></li>'
    ).join('');
  }

  /* ---------------- 01 分类 ---------------- */
  function renderCats() {
    $('#catsGrid').innerHTML = CATEGORIES.map((c) =>
      '<button class="cat reveal" type="button" data-filter="' + esc(c.filter) + '" data-anchor="' + esc(c.anchor) + '">' +
        '<span class="cat__badge"><svg viewBox="0 0 64 64"><use href="#' + c.icon + '"></use></svg></span>' +
        ph(c.img, c.name, c.key, c.name).replace('class="ph"', 'class="ph cat__ph"') +
        '<span class="cat__body">' +
          '<span class="cat__en">' + esc(c.en) + '</span>' +
          '<span class="cat__name">' + esc(c.name) + '</span>' +
          '<span class="cat__desc">' + esc(c.desc) + '</span>' +
          '<span class="cat__go">去看看<svg viewBox="0 0 64 64"><use href="#i-arrow"></use></svg></span>' +
        '</span>' +
      '</button>'
    ).join('');

    $$('.cat').forEach((btn) => {
      btn.addEventListener('click', () => {
        const f = btn.dataset.filter;
        if (f && $('#spots')) {
          state.spotFilter = f;
          renderSpotChips();
          renderSpots();
          document.getElementById('spots').scrollIntoView({ behavior: 'smooth' });
        } else {
          document.getElementById(btn.dataset.anchor).scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }

  /* ---------------- 02 好玩 ---------------- */
  const state = { spotFilter: '全部', days: 2, interests: [] };

  function renderSpotChips() {
    $('#spotChips').innerHTML = SPOT_FILTERS.map(
      (f) => '<button class="chip' + (f === state.spotFilter ? ' is-on' : '') + '" data-f="' + esc(f) + '">' + esc(f) + '</button>'
    ).join('');
    $$('#spotChips .chip').forEach((b) => {
      b.addEventListener('click', () => { state.spotFilter = b.dataset.f; renderSpotChips(); renderSpots(); });
    });
  }

  function renderSpots() {
    const list = state.spotFilter === '全部' ? SPOTS : SPOTS.filter((s) => s.cat === state.spotFilter);
    $('#spotTotal').textContent = SPOTS.length;
    $('#spotsEmpty').hidden = list.length > 0;
    $('#spotsGrid').innerHTML = list.map((s) =>
      '<article class="card reveal" data-id="' + s.id + '" data-kind="spot">' +
        '<span class="card__tag">' + esc(s.cat) + '</span>' +
        '<button class="card__wl' + (wish.has(s.id) ? ' is-on' : '') + '" data-wl="' + s.id + '" data-wlname="' + esc(s.name) +
          '" data-wlcat="' + esc(s.cat) + '" data-wlimg="' + esc(s.img) + '" aria-label="加入心愿单">' +
          '<svg viewBox="0 0 64 64"><use href="#i-heart"></use></svg></button>' +
        ph(s.img, s.name, s.catKey, s.name).replace('class="ph"', 'class="ph card__ph"') +
        '<div class="card__body">' +
          '<p class="card__meta"><span>' + esc(s.area) + '</span><i></i><span>' + esc(s.level) + '</span></p>' +
          '<h3 class="card__name">' + esc(s.name) + '</h3>' +
          '<p class="card__desc">' + esc(s.desc) + '</p>' +
          '<div class="card__tags">' + s.tags.map((t) => '<span>' + esc(t) + '</span>').join('') + '</div>' +
          '<p class="card__more">查看详情与贴士 →</p>' +
        '</div>' +
      '</article>'
    ).join('');
  }

  /* ---------------- 03 人文 ---------------- */
  function renderCulture() {
    $('#cultureList').innerHTML = CULTURE.map((c) =>
      '<article class="cu reveal" data-id="' + c.id + '" data-kind="culture">' +
        '<button class="cu__ph" data-img="' + esc(c.img) + '" data-cap="' + esc(c.name) + '" aria-label="查看大图">' +
          ph(c.img, c.name, 'man', c.name).replace(/^<figure class="ph"/, '<figure class="ph"') +
        '</button>' +
        '<div class="cu__body">' +
          '<p class="cu__kicker">' + esc(c.kicker) + '</p>' +
          '<h3 class="cu__name">' + esc(c.name) + '</h3>' +
          '<p class="cu__en">' + esc(c.en) + '</p>' +
          '<p class="cu__desc">' + esc(c.desc) + '</p>' +
          '<p class="cu__quote">' + esc(c.quote) + '</p>' +
          '<div class="cu__tags">' + c.tags.map((t) => '<span>' + esc(t) + '</span>').join('') + '</div>' +
        '</div>' +
      '</article>'
    ).join('');

    // 让 .cu__ph 成为图片容器本身（复用 .ph 的样式与图片）
    $$('.cu__ph').forEach((btn) => {
      const fig = $('.ph', btn);
      if (!fig) return;
      fig.classList.add('cu__phimg');
      btn.replaceWith(fig);
      fig.dataset.img = btn.dataset.img;
      fig.dataset.cap = btn.dataset.cap;
      fig.classList.add('is-clickable');
      fig.setAttribute('role', 'button');
      fig.setAttribute('tabindex', '0');
    });
  }

  /* ---------------- 04 好吃 ---------------- */
  function renderFood() {
    $('#foodGrid').innerHTML = FOOD.map((f) =>
      '<article class="card reveal" data-id="' + f.id + '" data-kind="food">' +
        '<span class="card__tag">' + esc(f.cat) + '</span>' +
        '<button class="card__wl' + (wish.has(f.id) ? ' is-on' : '') + '" data-wl="' + f.id + '" data-wlname="' + esc(f.name) +
          '" data-wlcat="' + esc(f.cat) + '" data-wlimg="' + esc(f.img) + '" aria-label="加入心愿单">' +
          '<svg viewBox="0 0 64 64"><use href="#i-heart"></use></svg></button>' +
        ph(f.img, f.name, 'life', f.name).replace('class="ph"', 'class="ph card__ph"') +
        '<div class="card__body">' +
          '<p class="card__meta"><span>' + esc(f.where) + '</span></p>' +
          '<h3 class="card__name">' + esc(f.name) + '</h3>' +
          '<p class="card__desc">' + esc(f.desc) + '</p>' +
          '<div class="card__tags">' + f.tags.map((t) => '<span>' + esc(t) + '</span>').join('') + '</div>' +
          '<p class="card__more">怎么吃 · 在哪吃 →</p>' +
        '</div>' +
      '</article>'
    ).join('');
  }

  /* ---------------- 05 线路规划器 ---------------- */
  function renderPlanner() {
    $('#daySeg').innerHTML = [1, 2, 3].map(
      (d) => '<button data-d="' + d + '" class="' + (d === state.days ? 'is-on' : '') + '">' + d + ' 天</button>'
    ).join('');
    $$('#daySeg button').forEach((b) => {
      b.addEventListener('click', () => {
        state.days = +b.dataset.d;
        $$('#daySeg button').forEach((x) => x.classList.toggle('is-on', x === b));
      });
    });

    $('#interestChecks').innerHTML = INTERESTS.map(
      (i) => '<label><input type="checkbox" value="' + esc(i) + '">' + esc(i) + '</label>'
    ).join('');
    $$('#interestChecks input').forEach((cb) => {
      cb.addEventListener('change', () => {
        cb.parentElement.classList.toggle('is-on', cb.checked);
        state.interests = $$('#interestChecks input:checked').map((x) => x.value);
      });
    });

    $('#genRoute').addEventListener('click', genRoute);
    $('#resetRoute').addEventListener('click', () => {
      state.days = 2; state.interests = [];
      renderPlanner();
      $('#routeOut').innerHTML = $('#routeOut').dataset.hint || '';
      renderHint();
    });
    renderHint();
  }

  function renderHint() {
    $('#routeOut').innerHTML =
      '<div class="planner__hint">' +
      '<svg viewBox="0 0 64 64" class="planner__icon"><use href="#i-pin"></use></svg>' +
      '<p>选好天数与偏好，点左边的按钮，这里会出现一条按天排好的线路。</p></div>';
  }

  function genRoute() {
    const days = state.days;
    const picks = state.interests.length ? state.interests : ['红色记忆', '城市烟火'];
    const seen = {};
    let pool = [];
    picks.forEach((k) => (ROUTE_POOLS[k] || []).forEach((it) => {
      if (!seen[it.name]) { seen[it.name] = 1; pool.push(it); }
    }));
    // 不足则用其它主题补齐
    Object.keys(ROUTE_POOLS).forEach((k) => (ROUTE_POOLS[k] || []).forEach((it) => {
      if (!seen[it.name]) { seen[it.name] = 1; pool.push(it); }
    }));
    // 仍不足则补自由活动
    const fillers = [
      { name: '南湖公园', note: '市区绿洲，散步骑行' },
      { name: '四平市博物馆', note: '补齐城市沿革与地域文化' },
      { name: '自由活动', note: '逛逛本地商圈，或回英雄广场再看一眼夜景' },
    ];
    let fi = 0;
    const need = DAY_SLOTS[days].reduce((a, b) => a + b, 0);
    while (pool.length < need && fi < fillers.length) {
      if (!seen[fillers[fi].name]) { seen[fillers[fi].name] = 1; pool.push(fillers[fi]); }
      fi++;
    }

    let idx = 0;
    let html = '';
    DAY_SLOTS[days].forEach((n, d) => {
      const stops = pool.slice(idx, idx + n);
      idx += n;
      const items = stops.slice();
      const meal = (MEALS[days] || [])[d];
      if (meal) items.splice(Math.min(2, items.length), 0, { name: meal, note: '', meal: true });
      html += '<div class="route-day"><h4>Day ' + (d + 1) + '<em>' + n + ' 站</em></h4><ul class="route-list">' +
        items.map((it) =>
          '<li' + (it.meal ? ' class="is-meal"' : '') + '><b>' + esc(it.name) + '</b>' +
          (it.note ? '<span>' + esc(it.note) + '</span>' : '') + '</li>'
        ).join('') +
        '</ul></div>';
    });
    html += '<p class="route-note">行程按“' + esc(picks.join(' + ')) + '”偏好自动生成，仅作路线参考。' +
      '红色场馆多在周一闭馆，票价与开放时间以景区及官方最新公告为准。</p>';
    $('#routeOut').innerHTML = html;
    $('#routeOut').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /* ---------------- 06 时节 ---------------- */
  function renderSeasons() {
    $('#seasonList').innerHTML = SEASONS.map((s) =>
      '<article class="season reveal" data-img="' + esc(s.img) + '" data-cap="' + esc(s.season + '·' + s.title) + '">' +
        ph(s.img, s.title, 'lake', s.season).replace('class="ph"', 'class="ph season__ph"') +
        '<div class="season__body">' +
          '<div class="season__top"><span class="season__ch">' + esc(s.season) + '</span>' +
          '<span class="season__en">' + esc(s.en) + '</span></div>' +
          '<p class="season__month">' + esc(s.month) + '</p>' +
          '<h3 class="season__title">' + esc(s.title) + '</h3>' +
          '<p class="season__desc">' + esc(s.desc) + '</p>' +
          '<div class="season__tags">' + s.tags.map((t) => '<span>' + esc(t) + '</span>').join('') + '</div>' +
          '<p class="season__tip">' + esc(s.tip) + '</p>' +
        '</div>' +
      '</article>'
    ).join('');
    $$('.season__ph').forEach((fig) => { fig.classList.add('is-clickable'); fig.setAttribute('role', 'button'); fig.setAttribute('tabindex', '0'); });
  }

  /* ---------------- 07 攻略 ---------------- */
  function renderTips() {
    $('#tipsGrid').innerHTML = TIPS.map((t) =>
      '<div class="tip reveal">' +
        '<div class="tip__ico"><svg viewBox="0 0 64 64"><use href="#' + t.icon + '"></use></svg></div>' +
        '<h3>' + esc(t.title) + '</h3><ul>' +
        t.items.map((i) => '<li>' + esc(i) + '</li>').join('') +
        '</ul></div>'
    ).join('');
  }

  /* ---------------- 08 关于 ---------------- */
  function renderAbout() {
    $('#aboutText').innerHTML = ABOUT.map((p) => '<p>' + esc(p) + '</p>').join('');
    $('#aboutStats').innerHTML = STATS.map((s) =>
      '<li><b>' + esc(s.num) + (s.unit ? '<i>' + esc(s.unit) + '</i>' : '') + '</b><span>' + esc(s.label) + '</span></li>'
    ).join('');
    $('#sourceList').innerHTML = SOURCES.map((s) =>
      '<li><a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.name) + '</a></li>'
    ).join('');
  }

  /* ---------------- 心愿单 ---------------- */
  const KEY = 'siping-wishlist';
  const wish = {
    data: [],
    load() {
      try { this.data = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { this.data = []; }
    },
    save() {
      try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (e) { /* 隐私模式下忽略 */ }
    },
    has(id) { return this.data.some((x) => x.id === id); },
    toggle(it) {
      const i = this.data.findIndex((x) => x.id === it.id);
      if (i >= 0) this.data.splice(i, 1); else this.data.push(it);
      this.save(); this.render(); this.sync();
    },
    remove(id) {
      this.data = this.data.filter((x) => x.id !== id);
      this.save(); this.render(); this.sync();
    },
    render() {
      $('#wlCount').textContent = this.data.length;
      $('#wlCount2').textContent = this.data.length;
      $('#wlEmpty').hidden = this.data.length > 0;
      $('#wlList').innerHTML = this.data.map((x) =>
        '<li><span class="ph wl__ph" data-cat="red" data-ph="' + esc(x.name) + '">' +
          '<img src="' + esc(x.img) + '" alt="" loading="lazy"></span>' +
        '<span class="wl__txt"><b>' + esc(x.name) + '</b><span>' + esc(x.cat) + '</span></span>' +
        '<button class="wl__del" data-del="' + esc(x.id) + '" aria-label="移除">×</button></li>'
      ).join('');
      $$('#wlList [data-del]').forEach((b) => b.addEventListener('click', () => this.remove(b.dataset.del)));
      initPh($('#wlList'));
    },
    sync() {
      $$('[data-wl]').forEach((b) => b.classList.toggle('is-on', this.has(b.dataset.wl)));
    },
  };

  function bindWishlist() {
    wish.load();
    wish.render();
    const open = () => { $('#wlPanel').classList.add('is-open'); $('#wlMask').classList.add('is-open'); };
    const close = () => { $('#wlPanel').classList.remove('is-open'); $('#wlMask').classList.remove('is-open'); };
    $('#wlFab').addEventListener('click', open);
    $('#wlClose').addEventListener('click', close);
    $('#wlMask').addEventListener('click', close);
    $('#wlClear').addEventListener('click', () => { wish.data = []; wish.save(); wish.render(); wish.sync(); });
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-wl]');
      if (!btn) return;
      e.stopPropagation();
      wish.toggle({ id: btn.dataset.wl, name: btn.dataset.wlname, cat: btn.dataset.wlcat, img: btn.dataset.wlimg });
    });
  }

  /* ---------------- 详情弹窗 ---------------- */
  function spotModal(s) {
    return '<div class="modal__hero">' + ph(s.img, s.name, s.catKey, s.name) + '</div>' +
      '<div class="modal__pad">' +
        '<p class="modal__kicker">' + esc(s.cat) + ' · ' + esc(s.area) + '</p>' +
        '<h3 class="modal__title">' + esc(s.name) + '</h3>' +
        '<p class="modal__en">' + esc(s.en) + '</p>' +
        '<p class="modal__desc">' + esc(s.desc) + '</p>' +
        '<dl class="modal__grid">' +
          '<div><dt>级别</dt><dd>' + esc(s.level) + '</dd></div>' +
          '<div><dt>门票</dt><dd>' + esc(s.price) + '</dd></div>' +
          '<div><dt>开放时间</dt><dd>' + esc(s.time) + '</dd></div>' +
        '</dl>' +
        '<p class="modal__sub">实用贴士</p><ul class="modal__tips">' +
          s.tips.map((t) => '<li>' + esc(t) + '</li>').join('') + '</ul>' +
        '<p class="modal__sub">标签</p><div class="modal__tags">' +
          s.tags.map((t) => '<span>' + esc(t) + '</span>').join('') + '</div>' +
        '<div class="modal__act">' +
          '<button class="btn btn--solid btn--sm" data-wl="' + s.id + '" data-wlname="' + esc(s.name) +
            '" data-wlcat="' + esc(s.cat) + '" data-wlimg="' + esc(s.img) + '">' +
            (wish.has(s.id) ? '♥ 已在心愿单' : '♥ 加入心愿单') + '</button>' +
          '<button class="btn btn--ghost btn--sm" data-view="' + esc(s.img) + '" data-cap="' + esc(s.name) + '">查看大图</button>' +
        '</div>' +
      '</div>';
  }

  function foodModal(f) {
    return '<div class="modal__hero">' + ph(f.img, f.name, 'life', f.name) + '</div>' +
      '<div class="modal__pad">' +
        '<p class="modal__kicker">' + esc(f.cat) + ' · ' + esc(f.where) + '</p>' +
        '<h3 class="modal__title">' + esc(f.name) + '</h3>' +
        '<p class="modal__en">' + esc(f.en) + '</p>' +
        '<p class="modal__desc">' + esc(f.desc) + '</p>' +
        '<p class="modal__sub">怎么吃</p><ul class="modal__tips"><li>' + esc(f.serve) + '</li></ul>' +
        '<p class="modal__sub">标签</p><div class="modal__tags">' +
          f.tags.map((t) => '<span>' + esc(t) + '</span>').join('') + '</div>' +
        '<div class="modal__act">' +
          '<button class="btn btn--solid btn--sm" data-wl="' + f.id + '" data-wlname="' + esc(f.name) +
            '" data-wlcat="' + esc(f.cat) + '" data-wlimg="' + esc(f.img) + '">' +
            (wish.has(f.id) ? '♥ 已在心愿单' : '♥ 加入心愿单') + '</button>' +
          '<button class="btn btn--ghost btn--sm" data-view="' + esc(f.img) + '" data-cap="' + esc(f.name) + '">查看大图</button>' +
        '</div>' +
      '</div>';
  }

  function openModal(html) {
    const m = $('#modal');
    $('#modalBody').innerHTML = html;
    m.hidden = false;
    document.body.style.overflow = 'hidden';
    initPh($('#modalBody'));
  }
  function closeModal() {
    $('#modal').hidden = true;
    document.body.style.overflow = '';
  }
  function bindModal() {
    $('#modal').addEventListener('click', (e) => {
      if (e.target.closest('[data-close]')) closeModal();
      const v = e.target.closest('[data-view]');
      if (v) openLightbox(v.dataset.view, v.dataset.cap);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { closeModal(); closeLightbox(); }
    });
  }

  /* ---------------- 图片灯箱 ---------------- */
  function openLightbox(src, cap) {
    const lb = $('#lightbox');
    const img = $('#lbImg');
    img.src = src; img.alt = cap || '';
    $('#lbCap').textContent = cap || '';
    lb.hidden = false;
    img.onerror = () => { lb.hidden = true; };
  }
  function closeLightbox() { $('#lightbox').hidden = true; }
  function bindLightbox() {
    $('#lbClose').addEventListener('click', closeLightbox);
    $('#lightbox').addEventListener('click', (e) => { if (e.target.id === 'lightbox') closeLightbox(); });
  }

  /* ---------------- 卡片点击 ---------------- */
  function bindCards() {
    document.addEventListener('click', (e) => {
      // 心愿单按钮已在上层处理，避免重复触发
      if (e.target.closest('[data-wl]')) return;

      const fig = e.target.closest('.is-clickable');
      if (fig) { openLightbox(fig.dataset.img, fig.dataset.cap); return; }

      const card = e.target.closest('[data-kind]');
      if (!card) return;
      const id = card.dataset.id;
      if (card.dataset.kind === 'spot') {
        const s = SPOTS.find((x) => x.id === id);
        if (s) openModal(spotModal(s));
      } else if (card.dataset.kind === 'food') {
        const f = FOOD.find((x) => x.id === id);
        if (f) openModal(foodModal(f));
      }
    });
  }

  /* ---------------- 滚动：进度条 / 吸顶 / 高亮 / 入场 ---------------- */
  function bindScroll() {
    const nav = $('#nav');
    const bar = $('#progressBar');
    const links = $$('#navLinks a');

    function onScroll() {
      const y = window.scrollY || document.documentElement.scrollTop;
      nav.classList.toggle('is-stuck', y > 60);
      const h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';

      let cur = 'home';
      NAV.forEach((n) => {
        const el = document.getElementById(n.id);
        if (el && el.getBoundingClientRect().top <= 120) cur = n.id;
      });
      links.forEach((a) => a.classList.toggle('is-active', a.dataset.spy === cur));
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
      $$('.reveal').forEach((el) => io.observe(el));
    } else {
      $$('.reveal').forEach((el) => el.classList.add('is-in'));
    }
  }

  /* ---------------- 启动 ---------------- */
  function boot() {
    renderNav();
    renderHero();
    renderCats();
    renderSpotChips();
    renderSpots();
    renderCulture();
    renderFood();
    renderPlanner();
    renderSeasons();
    renderTips();
    renderAbout();
    bindWishlist();
    bindModal();
    bindLightbox();
    bindCards();
    initPh(document);
    bindScroll();
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', boot)
    : boot();
})();
