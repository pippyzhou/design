// 点击带 data-copy 的元素：复制文本并弹出 toast 提示
(function () {
  function showToast(msg) {
    // 连续点击时先移除上一个 toast，保证每次点击都重新弹出
    var old = document.querySelector('.toast');
    if (old && old.parentNode) old.parentNode.removeChild(old);

    var t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    // 触发进入动画
    requestAnimationFrame(function () {
      t.classList.add('toast--show');
    });
    setTimeout(function () {
      t.classList.remove('toast--show');
      setTimeout(function () {
        if (t.parentNode) t.parentNode.removeChild(t);
      }, 300);
    }, 1800);
  }

  function copyText(text) {
    // 优先使用异步剪贴板 API（需 HTTPS / localhost）
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(
        function () { return true; },
        function () { return fallbackCopy(text); }
      );
    }
    return Promise.resolve(fallbackCopy(text));
  }

  function fallbackCopy(text) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '-9999px';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      var ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch (e) {
      return false;
    }
  }

  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-copy]');
    if (!el) return;
    e.preventDefault();
    var text = el.getAttribute('data-copy');
    var toast = el.getAttribute('data-toast') || '已复制';
    copyText(text).then(function (ok) {
      showToast(ok ? toast : '复制失败，请手动复制：' + text);
    });
  });

  // 点击导航栏右上角「语言切换」或「关于我」：提示功能开发中
  document.addEventListener('click', function (e) {
    var lang = e.target.closest('.lang-switch');
    var aboutLink = e.target.closest('.site-header a');
    var isAbout = !!aboutLink && aboutLink.textContent.trim() === '关于我';
    if (!lang && !isAbout) return;
    e.preventDefault();
    showToast('正在井然有序地开发中...');
  });

  // 点击 data-href 容器：整卡跳转（忽略按钮/链接自身交互）
  document.addEventListener('click', function (e) {
    var card = e.target.closest('[data-href]');
    if (!card) return;
    if (e.target.closest('a, button, [data-copy]')) return;
    var href = card.getAttribute('data-href');
    if (href) window.location.href = href;
  });

  // 键盘可访问性：聚焦卡片后按回车/空格跳转
  document.addEventListener('keydown', function (e) {
    var card = e.target.closest('[data-href]');
    if (!card) return;
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    var href = card.getAttribute('data-href');
    if (href) window.location.href = href;
  });

  // project-ai 页样式调参：从 localStorage 注入运行时覆盖样式
  function applyProjectAiRuntimeStyles() {
    if (!document.body || !document.body.classList.contains('project-ai-page')) return;
    var cssText = localStorage.getItem('project-ai-runtime-css');
    var styleId = 'project-ai-runtime-style';
    var oldStyle = document.getElementById(styleId);
    if (oldStyle && oldStyle.parentNode) oldStyle.parentNode.removeChild(oldStyle);
    if (!cssText) return;

    var styleEl = document.createElement('style');
    styleEl.id = styleId;
    styleEl.textContent = cssText;
    document.head.appendChild(styleEl);
  }

  applyProjectAiRuntimeStyles();

  // 导航栏：下滑时显示底部分割线，回到顶部时隐藏
  (function initHeaderScroll() {
    var header = document.querySelector('.site-header');
    if (!header) return;
    function onScroll() {
      var scrolled = window.pageYOffset > 0;
      header.classList.toggle('is-scrolled', scrolled);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  })();

  // ============================================================
  // 导航栏自适应：nav-list 放不下时，整体收成汉堡菜单（全站通用，零 HTML 改动）
  // 汉堡结构由此处运行时克隆 nav-list 链接生成，复用 components.css 的 .nav-menu 下拉样式。
  // ============================================================
  (function initNavAutoCollapse() {
    var header = document.querySelector('.site-header');
    if (!header) return;
    var navbar = header.querySelector('.navbar');
    var navList = header.querySelector('.nav-list');
    if (!navbar || !navList) return;
    var langSwitch = navbar.querySelector('.lang-switch');

    // 注入汉堡菜单（若尚未注入）
    var auto = navbar.querySelector('.nav-menu--auto');
    if (!auto) {
      auto = document.createElement('div');
      auto.className = 'nav-menu nav-menu--auto';
      auto.setAttribute('tabindex', '0');
      auto.setAttribute('role', 'button');
      auto.setAttribute('aria-haspopup', 'true');
      auto.setAttribute('aria-label', '打开菜单');

      var icon = document.createElement('img');
      icon.className = 'nav-menu__icon';
      icon.src = 'assets/menu.png';
      icon.alt = '菜单';
      auto.appendChild(icon);

      var home = document.createElement('img');
      home.className = 'nav-menu__home';
      home.src = 'assets/home.png';
      home.alt = 'Polly';
      auto.appendChild(home);

      var dropdown = document.createElement('ul');
      dropdown.className = 'nav-menu__dropdown';
      Array.prototype.forEach.call(navList.querySelectorAll('a'), function (a) {
        var li = document.createElement('li');
        var na = document.createElement('a');
        na.setAttribute('href', a.getAttribute('href') || '#');
        na.textContent = (a.textContent || '').trim() || a.getAttribute('aria-label') || '';
        li.appendChild(na);
        dropdown.appendChild(li);
      });
      auto.appendChild(dropdown);

      // 插到 nav-list 之后（收起时占据其原位置，位于导航栏左侧）
      if (navList.nextSibling) navbar.insertBefore(auto, navList.nextSibling);
      else navbar.appendChild(auto);
    }

    var GAP = 24;     // nav-list 与 lang-switch 之间的间距余量
    var SAFETY = 24;  // 安全余量，避免刚好顶满就不收

    function update() {
      // 先解除折叠，测得 nav-list 完整内容宽度（同步 reflow，不会闪烁）
      header.classList.remove('is-nav-collapsed');
      var needed = navList.scrollWidth;
      var langW = langSwitch ? langSwitch.getBoundingClientRect().width : 0;
      var avail = navbar.clientWidth;
      var fits = (needed + langW + GAP + SAFETY) <= avail;
      if (!fits) header.classList.add('is-nav-collapsed');
    }

    update();
    window.addEventListener('resize', update, { passive: true });
    window.addEventListener('load', update);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(update);
    }
  })();

  // project-ai：右侧悬浮目录（TOC）——收集标题动态生成 + 平滑滚动 + 滚动高亮
  (function initCaseToc() {
    if (!document.body || !document.body.classList.contains('project-ai-page')) return;
    var main = document.querySelector('main');
    if (!main) return;

    // 一级 = h2.case-section__title；二级 = h3.case-subtitle（保持文档顺序）
    var heads = main.querySelectorAll('h2.case-section__title, h3.case-subtitle');
    if (!heads.length) return;

    var toc = document.createElement('nav');
    toc.className = 'case-toc';
    toc.setAttribute('aria-label', '目录');

    var titleEl = document.createElement('div');
    titleEl.className = 'case-toc__title';
    titleEl.textContent = '目录';
    toc.appendChild(titleEl);

    var items = [];
    Array.prototype.forEach.call(heads, function (h, i) {
      if (!h.id) h.id = 'toc-sec-' + i;
      var isSub = h.classList.contains('case-subtitle');

      var a = document.createElement('a');
      a.className = 'case-toc__item' + (isSub ? ' case-toc__item--sub' : '');
      a.href = '#' + h.id;

      var track = document.createElement('span');
      track.className = 'case-toc__track';
      track.setAttribute('aria-hidden', 'true');

      var bar = document.createElement('span');
      bar.className = 'case-toc__bar';
      bar.setAttribute('aria-hidden', 'true');

      var text = document.createElement('span');
      text.className = 'case-toc__text';
      text.textContent = h.textContent.trim();

      a.appendChild(track);
      a.appendChild(bar);
      a.appendChild(text);
      toc.appendChild(a);
      items.push({ link: a, target: h });
    });

    document.body.appendChild(toc);

    // 点击平滑滚动（预留 header 高度约 120px）
    toc.addEventListener('click', function (e) {
      var a = e.target.closest('.case-toc__item');
      if (!a) return;
      e.preventDefault();
      var el = document.getElementById(a.getAttribute('href').slice(1));
      if (!el) return;
      var top = el.getBoundingClientRect().top + window.pageYOffset - 120;
      window.scrollTo({ top: top < 0 ? 0 : top, behavior: 'smooth' });
      if (history.replaceState) history.replaceState(null, '', a.getAttribute('href'));
    });

    // 滚动高亮：判定线取导航栏下方约 280px（标题进入屏幕上半部分即高亮，不等其滑出）
    var tocHeader = document.querySelector('.site-header');
    function onScroll() {
      var headerH = tocHeader ? tocHeader.getBoundingClientRect().height : 108;
      var line = headerH + 280;
      var current = items[0];
      for (var i = 0; i < items.length; i++) {
        if (items[i].target.getBoundingClientRect().top - line <= 0) current = items[i];
        else break;
      }
      items.forEach(function (it) {
        it.link.classList.toggle('is-active', it === current);
      });
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
  })();

  // 导航栏选中态装饰：向选中 Tab 注入 Star + Snowflake，触发飞出动画（样式见 components.css）
  // 【旧版 · 已停用，保留备用】改为「短下划线」指示器（纯 CSS ::after，无需 JS 注入）。
  // (function initNavSpark() {
  //   var active = document.querySelector('.nav-link.is-active');
  //   if (!active || active.querySelector('.nav-spark')) return;
  //
  //   var star = document.createElement('span');
  //   star.className = 'nav-spark nav-spark--star';
  //   star.setAttribute('aria-hidden', 'true');
  //
  //   var snow = document.createElement('span');
  //   snow.className = 'nav-spark nav-spark--snow';
  //   snow.setAttribute('aria-hidden', 'true');
  //   snow.appendChild(document.createElement('i'));
  //
  //   active.appendChild(star);
  //   active.appendChild(snow);
  // })();

  // ============================================================
  // 通行码门禁：同设备输入一次，30 天内访问所有受保护页免重复输入
  // 用法：给需要保护的页面 <body> 加 data-protected 属性即可。
  // 注意：这是前端「轻量遮挡」，可防路人随手点开，不能防有技术能力者。
  // ============================================================
  (function initPageGuard() {
    // ⬇⬇⬇⬇⬇  在这里修改通行码  ⬇⬇⬇⬇⬇
    var PASS_CODE = 'polly2026';
    // ⬆⬆⬆⬆⬆  在这里修改通行码  ⬆⬆⬆⬆⬆

    var STORAGE_KEY = 'site-pass-granted';
    var MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 记忆 30 天

    var body = document.body;
    if (!body || !body.hasAttribute('data-protected')) return;

    if (isGranted()) {
      unlock();
      return;
    }
    lockAndPrompt();

    function isGranted() {
      try {
        var raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return false;
        var ts = parseInt(raw, 10);
        if (!ts || (Date.now() - ts) > MAX_AGE) {
          localStorage.removeItem(STORAGE_KEY);
          return false;
        }
        return true;
      } catch (e) {
        return false;
      }
    }

    function grant() {
      try { localStorage.setItem(STORAGE_KEY, String(Date.now())); } catch (e) {}
    }

    function unlock() {
      body.classList.add('is-unlocked');
    }

    function lockAndPrompt() {
      var overlay = document.createElement('div');
      overlay.className = 'pass-guard';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-label', '请输入访问通行码');
      overlay.innerHTML =
        '<div class="pass-guard__card">' +
          '<form class="pass-guard__form">' +
            '<div class="pass-guard__head">' +
              '<img class="pass-guard__img" src="assets/pass.png" alt="" aria-hidden="true" />' +
              '<h2 class="pass-guard__title">哎呀！需要通行码</h2>' +
            '</div>' +
            '<input class="pass-guard__input" type="text" inputmode="text" autocomplete="off" spellcheck="false" placeholder="请输入通行码" aria-label="通行码" />' +
            '<button class="pass-guard__btn" type="submit">通行</button>' +
          '</form>' +
        '</div>';
      body.appendChild(overlay);

      var card = overlay.querySelector('.pass-guard__card');
      var input = overlay.querySelector('.pass-guard__input');
      var form = overlay.querySelector('.pass-guard__form');

      setTimeout(function () { input.focus(); }, 60);

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (input.value === PASS_CODE) {
          grant();
          unlock();
          if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        } else {
          input.classList.add('is-error');
          input.value = '';
          input.focus();
          card.classList.remove('is-shake');
          void card.offsetWidth; // 重置动画
          card.classList.add('is-shake');
        }
      });

      input.addEventListener('input', function () {
        input.classList.remove('is-error');
      });
    }
  })();
})();
