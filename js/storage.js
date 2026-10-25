(() => {
  'use strict';

  const keys = {
    COMPANY: 'hcm_company',
    USERS: 'hcm_users',
    ATTENDANCE: 'hcm_attendance',
    LEAVES: 'hcm_leaves',
    SESSION: 'hcm_session'
  };

  function read(key, fallback = null) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
    return value;
  }

  function update(key, updater, fallback = []) {
    return write(key, updater(read(key, fallback)));
  }

  function remove(key) {
    localStorage.removeItem(key);
  }

  function today() {
    const date = new Date();
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 10);
  }

  function money(amount) {
    return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(Number(amount) || 0);
  }

  function escape(value) {
    return String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
  }

  function emailValid(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
  }

  function dateLabel(value, options = { day: 'numeric', month: 'short', year: 'numeric' }) {
    return value ? new Intl.DateTimeFormat('en', options).format(new Date(`${value}T12:00:00`)) : '—';
  }

  function timeLabel(value) {
    if (!value) return '—';
    const [hour, minute] = String(value).split(':').map(Number);
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) return value;
    const date = new Date();
    date.setHours(hour, minute, 0, 0);
    return new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(date);
  }

  function monthLabel(year, month) {
    return new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1));
  }

  function monthKey(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  function initials(value) {
    const parts = String(value || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '·';
    return `${parts[0][0] || ''}${parts.length > 1 ? parts[parts.length - 1][0] : ''}`.toUpperCase();
  }

  function applyTimeZone(dateValue) {
    const date = new Date(`${dateValue}T12:00:00`);
    return date;
  }

  function themeSwitchMarkup() {
    return `
      <div class="theme-switch" role="group" aria-label="Color theme">
        <button type="button" data-theme="light" aria-label="Use light theme" title="Light theme">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
        </button>
        <button type="button" data-theme="dark" aria-label="Use dark theme" title="Dark theme">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"/></svg>
        </button>
      </div>`;
  }

  function initTheme() {
    const themeKey = 'hcm_theme';
    const stored = localStorage.getItem(themeKey);
    const selected = stored === 'light' || stored === 'dark' ? stored : 'dark';
    const root = document.documentElement;
    let slot = document.querySelector('[data-theme-slot]');
    if (!slot) {
      slot = document.querySelector('.topbar-actions') || document.querySelector('.landing-nav-actions') || document.querySelector('.landing-nav');
      if (slot) {
        const container = document.createElement('div');
        container.dataset.themeSlot = '';
        slot.append(container);
        slot = container;
      }
    }
    if (!slot) return null;
    if (!slot.querySelector('.theme-switch')) slot.innerHTML = themeSwitchMarkup();
    const switcher = slot.querySelector('.theme-switch');

    function applyTheme(theme, save = true) {
      root.dataset.theme = theme;
      if (save) localStorage.setItem(themeKey, theme);
      switcher.querySelectorAll('button').forEach((button) => {
        const active = button.dataset.theme === theme;
        button.setAttribute('aria-pressed', String(active));
      });
      const themeColor = document.querySelector('meta[name="theme-color"]');
      if (themeColor) themeColor.content = theme === 'light' ? '#f7f5fb' : '#07060d';
      window.dispatchEvent(new Event('hirespera:theme-change'));
    }

    if (switcher.dataset.ready !== 'true') {
      switcher.dataset.ready = 'true';
      switcher.querySelectorAll('button').forEach((button) => {
        button.addEventListener('click', () => applyTheme(button.dataset.theme));
      });
    }
    applyTheme(selected, false);
    return switcher;
  }

  initTheme();

  window.HireSpera = Object.assign(window.HireSpera || {}, {
    keys,
    read,
    write,
    update,
    remove,
    id: () => `hs-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    today,
    money,
    escape,
    emailValid,
    dateLabel,
    timeLabel,
    monthLabel,
    monthKey,
    initials,
    parseDate: applyTimeZone,
    mountTheme: initTheme
  });
})();
