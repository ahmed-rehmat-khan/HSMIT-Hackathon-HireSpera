(() => {
  'use strict';

  const app = window.HireSpera;
  if (!app) return;

  const icons = {
    layout: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    userPlus: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2.5"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>',
    calendarCheck: '<rect x="3" y="4" width="18" height="18" rx="2.5"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="m9 15 2 2 4-4"/>',
    settings: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3"/><path d="M1 14h6M9 8h6M17 16h6"/>',
    receipt: '<path d="M4 2v20l2.5-1.4L9 22l2.5-1.4L14 22l2.5-1.4L19 22l1-1V2l-1 1-2.5-1.4L14 3l-2.5-1.4L9 3 6.5 1.6 4 3Z"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    lock: '<rect x="3.5" y="10.5" width="17" height="11" rx="2.5"/><path d="M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5"/><path d="M12 14.5v3"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
    menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
    x: '<path d="m18 6-12 12M6 6l12 12"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/>',
    filter: '<path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3Z"/>',
    chevronDown: '<path d="m6 9 6 6 6-6"/>',
    chevronRight: '<path d="m9 18 6-6-6-6"/>',
    arrowRight: '<path d="M5 12h14M12 5l7 7-7 7"/>',
    arrowLeft: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
    arrowDown: '<path d="M12 5v14M5 12l7 7 7-7"/>',
    arrowUp: '<path d="M12 19V5M5 12l7-7 7 7"/>',
    sparkles: '<path d="m12 3 1.9 5.5L19.5 10.5l-5.6 1.9L12 18l-1.9-5.6L4.5 10.5l5.6-2L12 3Z"/><path d="M19 16.5 20 19l2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1 1-2.5Z" opacity=".7"/><path d="M5 2.5 5.7 4.3 7.5 5l-1.8.7L5 7.5 4.3 5.7 2.5 5l1.8-.7L5 2.5Z" opacity=".7"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 1.9"/>',
    trendingUp: '<path d="m23 6-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/>',
    alert: '<circle cx="12" cy="12" r="9"/><path d="M12 8v4.5M12 16h.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    chart: '<path d="M3 3v18h18"/><path d="M7 16v-5M12 16V7M17 16v-9"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2.5"/><path d="m22 7-10 6L2 7"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/>',
    printer: '<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8" rx="1"/>',
    eye: '<path d="M1.5 12S5.5 4.5 12 4.5 22.5 12 22.5 12 18.5 19.5 12 19.5 1.5 12 1.5 12Z"/><circle cx="12" cy="12" r="3"/>',
    eyeOff: '<path d="M17.94 17.94A10.5 10.5 0 0 1 12 19.5C5.5 19.5 1.5 12 1.5 12a19.6 19.6 0 0 1 5.1-5.94M9.9 4.74A10.3 10.3 0 0 1 12 4.5c6.5 0 10.5 7.5 10.5 7.5a19.8 19.8 0 0 1-2.42 3.36M1 1l22 22"/><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>',
    trash: '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M10 11v6M14 11v6"/>',
    pencil: '<path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>',
    mapPin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z"/><circle cx="12" cy="10" r="3"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
    message: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"/>',
    wallet: '<path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>',
    briefcase: '<rect x="2" y="7" width="20" height="14" rx="2.5"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
    checkCircle: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m22 4-10 10.01-3-3"/>',
    logIn: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="m10 17 5-5-5-5M15 12H3"/>',
    logOut: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
    moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"/>',
    building: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01"/>',
    camera: '<path d="M14.5 4h-5L8 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-4l-1.5-3Z"/><circle cx="12" cy="13" r="4"/>',
    crosshair: '<circle cx="12" cy="12" r="9"/><path d="M22 12h-4M6 12H2M12 6V2M12 22v-4"/><circle cx="12" cy="12" r="3"/>',
    refresh: '<path d="M3 12a9 9 0 0 1 15.5-6.2L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.5 6.2L3 16"/><path d="M3 21v-5h5"/>'
  };

  function icon(name, className = 'icon') {
    const body = icons[name] || icons.info;
    return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;
  }

  function hydrateIcons(root = document) {
    root.querySelectorAll('[data-icon]').forEach((element) => {
      if (element.dataset.iconReady === 'true') return;
      const name = element.dataset.icon;
      if (!name || !icons[name]) return;
      element.insertAdjacentHTML('afterbegin', icon(name));
      element.dataset.iconReady = 'true';
    });
  }

  function initials(value) {
    const parts = String(value || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '·';
    return `${parts[0][0] || ''}${parts.length > 1 ? parts[parts.length - 1][0] : ''}`.toUpperCase();
  }

  function formatToday() {
    try {
      return new Intl.DateTimeFormat('en', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(`${app.today()}T12:00:00`));
    } catch {
      return '';
    }
  }

  function currentGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  function initIdentity() {
    const user = typeof app.auth?.currentUser === 'function' ? app.auth.currentUser() : null;
    const company = app.read(app.keys.COMPANY, {});
    if (user) {
      document.body.dataset.role = user.role;
      document.querySelectorAll('#user-name, [data-user-name]').forEach((element) => { element.textContent = user.name; });
      document.querySelectorAll('#user-avatar, [data-user-avatar]').forEach((element) => { element.textContent = initials(user.name); });
      const roleLabel = user.role === 'admin' ? 'Administrator' : (user.jobTitle || user.department || 'Team member');
      document.querySelectorAll('#user-role, [data-user-role]').forEach((element) => { element.textContent = roleLabel; });
    }
    const companyName = company.name || 'Company';
    document.querySelectorAll('#sidebar-company, [data-company-name]').forEach((element) => { element.textContent = companyName; });
    document.querySelectorAll('#company-initial, [data-company-initial]').forEach((element) => { element.textContent = initials(companyName).charAt(0); });
    document.querySelectorAll('[data-today-chip]').forEach((element) => { element.textContent = formatToday(); });
  }

  function toast(message, type = 'success') {
    let stack = document.querySelector('.toast-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.className = 'toast-stack';
      stack.setAttribute('aria-live', 'polite');
      document.body.append(stack);
    }
    const item = document.createElement('div');
    item.className = `toast toast-${type}`;
    item.setAttribute('role', 'status');
    item.innerHTML = `<span class="toast-icon">${icon(type === 'error' ? 'alert' : type === 'info' ? 'info' : 'checkCircle')}</span><span class="toast-text"></span>`;
    item.querySelector('.toast-text').textContent = message;
    stack.append(item);
    requestAnimationFrame(() => item.classList.add('is-visible'));
    window.setTimeout(() => {
      item.classList.remove('is-visible');
      item.addEventListener('transitionend', () => item.remove(), { once: true });
      window.setTimeout(() => item.remove(), 500);
    }, 4400);
  }

  function setFormMessage(element, message, type = 'error') {
    if (!element) return;
    element.textContent = message || '';
    element.className = `form-message${message ? ` is-${type}` : ''}`;
    element.classList.toggle('hidden', !message);
  }

  function fieldContainer(input) {
    return input.closest('.field') || input.closest('label') || input.parentElement;
  }

  function setFieldError(form, name, message) {
    const input = typeof name === 'string' ? form?.elements?.[name] : name;
    if (!input) return;
    const elements = input instanceof RadioNodeList ? [...input] : [input];
    elements.forEach((element) => {
      if (!element || element.type === 'hidden') return;
      element.classList.toggle('is-invalid', Boolean(message));
      if (message) element.setAttribute('aria-invalid', 'true');
      else element.removeAttribute('aria-invalid');
    });
    const container = fieldContainer(elements[0]);
    if (!container) return;
    let error = container.querySelector('.field-error');
    if (!error) {
      error = document.createElement('small');
      error.className = 'field-error';
      if (typeof name === 'string') error.dataset.errorFor = name;
      container.append(error);
    }
    error.textContent = message || '';
    error.classList.toggle('is-visible', Boolean(message));
    if (!message) error.removeAttribute('id');
  }

  function setGroupError(form, name, message) {
    const inputs = [...(form?.querySelectorAll(`[name="${name}"]`) || [])];
    inputs.forEach((input) => {
      input.classList.toggle('is-invalid', Boolean(message));
      if (message) input.setAttribute('aria-invalid', 'true');
      else input.removeAttribute('aria-invalid');
    });
    const error = form?.querySelector(`[data-error-for="${name}"]`);
    if (error) {
      error.textContent = message || '';
      error.classList.toggle('is-visible', Boolean(message));
    }
  }

  function clearErrors(form) {
    if (!form) return;
    form.querySelectorAll('.is-invalid').forEach((element) => element.classList.remove('is-invalid'));
    form.querySelectorAll('[aria-invalid="true"]').forEach((element) => element.removeAttribute('aria-invalid'));
    form.querySelectorAll('.field-error').forEach((element) => {
      element.textContent = '';
      element.classList.remove('is-visible');
    });
    form.querySelectorAll('.form-message').forEach((element) => {
      element.textContent = '';
      element.classList.remove('is-error', 'is-success');
      element.classList.add('hidden');
    });
  }

  function focusFirstError(form) {
    form?.querySelector('.is-invalid, [aria-invalid="true"]')?.focus();
  }

  function setButtonLoading(button, loading, label) {
    if (!button) return;
    if (loading) {
      button.dataset.originalHtml = button.innerHTML;
      button.disabled = true;
      button.classList.add('is-loading');
      button.innerHTML = `<span class="spinner" aria-hidden="true"></span><span>${label || 'Working…'}</span>`;
    } else {
      button.disabled = false;
      button.classList.remove('is-loading');
      if (button.dataset.originalHtml) button.innerHTML = button.dataset.originalHtml;
      delete button.dataset.originalHtml;
    }
  }

  function createPasswordDialog() {
    if (document.querySelector('#password-dialog')) return;
    const dialog = document.createElement('dialog');
    dialog.id = 'password-dialog';
    dialog.className = 'modal modal-sm';
    dialog.innerHTML = `
      <form id="password-form" class="form-stack" novalidate>
        <div class="modal-heading">
          <div>
            <span class="eyebrow">Account security</span>
            <h2>Change password</h2>
            <p>Choose a new password with at least 8 characters.</p>
          </div>
          <button class="icon-button" type="button" data-dialog-close aria-label="Close dialog" data-icon="x"></button>
        </div>
        <label class="field">
          <span class="field-label">Current password</span>
          <span class="password-wrap">
            <input name="currentPassword" type="password" autocomplete="current-password" required>
            <button class="password-toggle" type="button" data-password-toggle aria-label="Show password" data-icon="eye"></button>
          </span>
          <small class="field-error" data-error-for="currentPassword"></small>
        </label>
        <label class="field">
          <span class="field-label">New password</span>
          <span class="password-wrap">
            <input name="newPassword" type="password" autocomplete="new-password" minlength="8" required>
            <button class="password-toggle" type="button" data-password-toggle aria-label="Show password" data-icon="eye"></button>
          </span>
          <small class="field-error" data-error-for="newPassword"></small>
        </label>
        <label class="field">
          <span class="field-label">Confirm new password</span>
          <span class="password-wrap">
            <input name="confirmPassword" type="password" autocomplete="new-password" minlength="8" required>
            <button class="password-toggle" type="button" data-password-toggle aria-label="Show password" data-icon="eye"></button>
          </span>
          <small class="field-error" data-error-for="confirmPassword"></small>
        </label>
        <div class="modal-actions">
          <button class="button button-secondary" type="button" data-dialog-close>Cancel</button>
          <button class="button button-primary" type="submit">Update password</button>
        </div>
      </form>`;
    document.body.append(dialog);
    hydrateIcons(dialog);
    const form = dialog.querySelector('form');
    dialog.addEventListener('close', () => {
      form.reset();
      clearErrors(form);
      dialog.querySelectorAll('input[type="password"]').forEach((input) => { input.type = 'password'; });
      dialog.querySelectorAll('[data-password-toggle]').forEach((button) => {
        button.innerHTML = icon('eye');
        button.setAttribute('aria-label', 'Show password');
      });
    });
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      clearErrors(form);
      const data = new FormData(form);
      const currentPassword = String(data.get('currentPassword') || '');
      const newPassword = String(data.get('newPassword') || '');
      const confirmPassword = String(data.get('confirmPassword') || '');
      let valid = true;
      if (!currentPassword) { setFieldError(form, 'currentPassword', 'Enter your current password.'); valid = false; }
      if (newPassword.length < 8) { setFieldError(form, 'newPassword', 'Use at least 8 characters.'); valid = false; }
      if (confirmPassword !== newPassword) { setFieldError(form, 'confirmPassword', 'Passwords do not match.'); valid = false; }
      if (!valid) { focusFirstError(form); return; }
      try {
        app.auth.changePassword(currentPassword, newPassword);
        dialog.close();
        toast('Your password has been updated.');
      } catch (error) {
        setFieldError(form, 'currentPassword', error.message);
        focusFirstError(form);
      }
    });
  }

  let confirmResolver = null;

  function confirmAction({ title = 'Are you sure?', message = '', confirmLabel = 'Confirm', cancelLabel = 'Cancel', tone = 'danger', iconName = 'alert' } = {}) {
    let dialog = document.querySelector('#confirm-dialog');
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.id = 'confirm-dialog';
      dialog.className = 'modal modal-confirm';
      dialog.innerHTML = `
        <form method="dialog" class="form-stack">
          <div class="confirm-head">
            <span class="confirm-icon" data-confirm-icon></span>
            <div>
              <h2 data-confirm-title>Are you sure?</h2>
              <p data-confirm-message></p>
            </div>
          </div>
          <div class="modal-actions">
            <button class="button button-secondary" value="cancel" data-confirm-cancel>Cancel</button>
            <button class="button" value="confirm" data-confirm-ok>Confirm</button>
          </div>
        </form>`;
      document.body.append(dialog);
      dialog.addEventListener('close', () => {
        const accepted = dialog.returnValue === 'confirm';
        if (confirmResolver) { confirmResolver(accepted); confirmResolver = null; }
      });
      dialog.addEventListener('click', (event) => {
        if (event.target === dialog) {
          dialog.returnValue = '';
          dialog.close();
        }
      });
    }
    hydrateIcons(dialog);
    const iconElement = dialog.querySelector('[data-confirm-icon]');
    iconElement.innerHTML = icon(iconName);
    iconElement.className = `confirm-icon confirm-icon-${tone}`;
    dialog.querySelector('[data-confirm-title]').textContent = title;
    dialog.querySelector('[data-confirm-message]').textContent = message;
    const confirmButton = dialog.querySelector('[data-confirm-ok]');
    confirmButton.textContent = confirmLabel;
    confirmButton.className = `button ${tone === 'danger' ? 'button-danger' : 'button-primary'}`;
    dialog.querySelector('[data-confirm-cancel]').textContent = cancelLabel;
    dialog.returnValue = '';
    if (confirmResolver) { confirmResolver(false); confirmResolver = null; }
    return new Promise((resolve) => {
      confirmResolver = resolve;
      dialog.showModal();
      dialog.querySelector('[data-confirm-cancel]').focus();
    });
  }

  function initDialogs() {
    document.addEventListener('click', (event) => {
      const closeButton = event.target.closest('[data-dialog-close]');
      if (closeButton) {
        closeButton.closest('dialog')?.close();
        return;
      }
      if (event.target instanceof HTMLDialogElement) {
        const rect = event.target.getBoundingClientRect();
        const outside = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
        if (outside) event.target.close();
      }
    });
    document.addEventListener('click', (event) => {
      const opener = event.target.closest('[data-password-open]');
      if (!opener) return;
      event.preventDefault();
      createPasswordDialog();
      const dialog = document.querySelector('#password-dialog');
      dialog.showModal();
      window.setTimeout(() => dialog.querySelector('input')?.focus(), 60);
    });
    document.addEventListener('click', (event) => {
      const logoutButton = event.target.closest('[data-logout]');
      if (!logoutButton) return;
      event.preventDefault();
      app.auth.logout();
    });
    document.addEventListener('click', (event) => {
      const toggle = event.target.closest('[data-password-toggle]');
      if (!toggle) return;
      const wrap = toggle.closest('.password-wrap');
      const input = wrap?.querySelector('input');
      if (!input) return;
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      toggle.innerHTML = icon(show ? 'eyeOff' : 'eye');
      toggle.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    });
  }

  function mountShell({ breadcrumb = 'Workspace', active = '' } = {}) {
    const shell = document.querySelector('.app-shell');
    if (!shell) return null;
    const user = typeof app.auth?.currentUser === 'function' ? app.auth.currentUser() : null;
    if (!user) return null;
    const company = app.read(app.keys.COMPANY, {});
    const isAdmin = user.role === 'admin';
    const pending = isAdmin ? app.leave?.pendingCount?.() || 0 : 0;
    const navItems = isAdmin
      ? [
          ['overview', 'admin.html', 'layout', 'Overview'],
          ['employees', 'employees.html', 'users', 'People'],
          ['leaves', 'leaves.html', 'calendarCheck', 'Leave requests', pending],
          ['settings', 'settings.html', 'settings', 'Company settings'],
          ['payslip', 'payslip.html', 'receipt', 'Payslips']
        ]
      : [
          ['overview', 'employee.html', 'layout', 'My dashboard'],
          ['payslip', 'payslip.html', 'receipt', 'My payslip']
        ];
    const sidebar = document.querySelector('#app-sidebar');
    const topbar = document.querySelector('#app-topbar');
    if (!sidebar || !topbar) return user;

    const nav = navItems.map(([key, href, iconName, label, badge]) => `
      <a class="nav-link${active === key ? ' is-active' : ''}" href="${href}"${active === key ? ' aria-current="page"' : ''}>
        <span class="nav-icon" data-icon="${iconName}"></span>
        <span>${label}</span>
        ${badge ? `<span class="nav-badge" aria-label="${badge} pending">${badge}</span>` : ''}
      </a>`).join('');

    sidebar.innerHTML = `
      <div class="sidebar-head">
        <a class="brand-lockup" href="${isAdmin ? 'admin.html' : 'employee.html'}" aria-label="HireSpera workspace home">
          <img src="../assets/brand-mark.svg" alt="" class="brand-mark" width="38" height="38">
          <span class="brand-copy"><strong>HireSpera</strong><small>People workspace</small></span>
        </a>
        <button class="icon-button sidebar-close" type="button" data-sidebar-close aria-label="Close navigation" data-icon="x"></button>
      </div>
      <div class="workspace-badge">
        <span class="workspace-avatar">${app.escape(initials(company.name || 'H').charAt(0))}</span>
        <span class="workspace-copy"><small>${isAdmin ? 'Admin workspace' : 'Employee workspace'}</small><strong data-company-name>${app.escape(company.name || 'Company')}</strong></span>
        <span class="live-dot" aria-hidden="true"></span>
      </div>
      <div class="nav-label">${isAdmin ? 'Workspace' : 'My workspace'}</div>
      <nav class="side-nav" aria-label="${isAdmin ? 'Admin' : 'Employee'} navigation">${nav}</nav>
      <div class="sidebar-spacer"></div>
      <div class="sidebar-note">
        <span class="pulse-label"><span class="live-dot" aria-hidden="true"></span>${isAdmin ? 'People pulse' : 'Private record'}</span>
        <p>${isAdmin ? 'Attendance, leave and pay, kept in one clear view.' : 'Your attendance and leave are visible only to you and your Admin.'}</p>
        <span class="pulse-bars ${isAdmin ? '' : 'pulse-bars-calm'}" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span>
      </div>
      <div class="sidebar-bottom">
        <button class="nav-link nav-button" type="button" data-password-open><span class="nav-icon" data-icon="lock"></span><span>Change password</span></button>
        <button class="nav-link nav-button nav-logout" type="button" data-logout><span class="nav-icon" data-icon="logout"></span><span>Sign out</span></button>
      </div>`;

    topbar.innerHTML = `
      <div class="topbar-left">
        <button class="icon-button menu-button" type="button" data-sidebar-open aria-label="Open navigation" aria-expanded="false" data-icon="menu"></button>
        <span class="breadcrumb"><span>Workspace</span><span class="breadcrumb-slash">/</span><strong>${app.escape(breadcrumb)}</strong></span>
      </div>
      <div class="topbar-actions">
        <span class="today-chip" data-today-chip>${formatToday()}</span>
        <span data-theme-slot></span>
        <div class="user-menu-wrap">
          <button class="user-chip" type="button" data-user-menu aria-expanded="false" aria-haspopup="true">
            <span class="avatar" id="user-avatar">${app.escape(initials(user.name))}</span>
            <span class="user-chip-copy"><strong id="user-name">${app.escape(user.name)}</strong><small id="user-role">${app.escape(isAdmin ? 'Administrator' : (user.jobTitle || user.department || 'Team member'))}</small></span>
            <span class="user-chip-caret" data-icon="chevronDown"></span>
          </button>
          <div class="user-menu" data-user-menu-panel hidden>
            <div class="user-menu-head"><span class="avatar avatar-small">${app.escape(initials(user.name))}</span><div><strong>${app.escape(user.name)}</strong><small>${app.escape(user.email)}</small></div></div>
            <button class="user-menu-item" type="button" data-password-open><span data-icon="lock"></span>Change password</button>
            <button class="user-menu-item user-menu-danger" type="button" data-logout><span data-icon="logout"></span>Sign out</button>
          </div>
        </div>
      </div>`;

    hydrateIcons(sidebar);
    hydrateIcons(topbar);
    initIdentity();
    bindSidebar();
    bindUserMenu();
    app.mountTheme?.();
    hydrateIcons();
    return user;
  }

  function bindUserMenu() {
    const trigger = document.querySelector('[data-user-menu]');
    const panel = document.querySelector('[data-user-menu-panel]');
    if (!trigger || !panel) return;
    if (trigger.dataset.bound === 'true') return;
    trigger.dataset.bound = 'true';
    const close = () => {
      panel.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
      trigger.classList.remove('is-open');
    };
    const open = () => {
      panel.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      trigger.classList.add('is-open');
    };
    trigger.addEventListener('click', (event) => {
      event.stopPropagation();
      if (panel.hidden) open();
      else close();
    });
    document.addEventListener('click', (event) => {
      if (!event.target.closest('.user-menu-wrap')) close();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') close();
    });
  }

  function bindSidebar() {
    const sidebar = document.querySelector('#app-sidebar');
    if (!sidebar || !sidebar.innerHTML.trim()) return;
    if (sidebar.dataset.bound === 'true') return;
    sidebar.dataset.bound = 'true';
    const scrim = document.querySelector('.sidebar-scrim');
    const opener = document.querySelector('[data-sidebar-open]');
    const closeButtons = document.querySelectorAll('[data-sidebar-close]');
    const open = () => {
      sidebar.classList.add('is-open');
      scrim?.classList.add('is-visible');
      document.body.classList.add('nav-open');
      opener?.setAttribute('aria-expanded', 'true');
      window.setTimeout(() => sidebar.querySelector('a, button')?.focus(), 80);
    };
    const close = () => {
      sidebar.classList.remove('is-open');
      scrim?.classList.remove('is-visible');
      document.body.classList.remove('nav-open');
      opener?.setAttribute('aria-expanded', 'false');
    };
    opener?.addEventListener('click', open);
    closeButtons.forEach((button) => button.addEventListener('click', close));
    scrim?.addEventListener('click', close);
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') close();
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 980) close();
    });
  }

  function initCharacterCounts() {
    document.querySelectorAll('textarea[maxlength]').forEach((textarea) => {
      const counter = document.querySelector(`[data-char-count-for="${textarea.id}"]`);
      if (!counter) return;
      const update = () => { counter.textContent = `${textarea.value.length} / ${textarea.maxLength}`; };
      textarea.addEventListener('input', update);
      update();
    });
  }

  function initHelperSuggestions() {
    document.addEventListener('click', (event) => {
      const suggestion = event.target.closest('[data-helper-suggestion]');
      if (!suggestion) return;
      const form = document.querySelector('#helper-form');
      const input = form?.querySelector('input');
      if (!form || !input) return;
      input.value = suggestion.textContent.trim();
      form.requestSubmit();
    });
  }

  function bindHelper(user, { formSelector = '#helper-form', historySelector = '#helper-history', inputSelector = '#helper-question' } = {}) {
    const form = document.querySelector(formSelector);
    const history = document.querySelector(historySelector);
    const input = document.querySelector(inputSelector);
    if (!form || !history || !input || form.dataset.bound === 'true') return null;
    form.dataset.bound = 'true';
    history.setAttribute('aria-live', 'polite');
    function ask(question) {
      const clean = String(question || '').trim();
      if (!clean) return;
      const questionItem = document.createElement('div');
      questionItem.className = 'helper-message helper-question';
      questionItem.textContent = clean;
      const answerItem = document.createElement('div');
      answerItem.className = 'helper-message helper-answer';
      answerItem.textContent = app.helper.answer(clean, user);
      history.append(questionItem, answerItem);
      while (history.children.length > 12) history.firstElementChild?.remove();
      history.scrollTop = history.scrollHeight;
    }
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      ask(input.value);
      input.value = '';
      input.focus({ preventScroll: true });
    });
    return { ask };
  }

  function init() {
    hydrateIcons();
    initIdentity();
    bindSidebar();
    bindUserMenu();
    createPasswordDialog();
    initDialogs();
    initCharacterCounts();
    initHelperSuggestions();
    document.body.classList.add('ui-ready');
  }

  app.ui = {
    icon,
    hydrateIcons,
    initials,
    formatToday,
    currentGreeting,
    toast,
    setFormMessage,
    setFieldError,
    setGroupError,
    clearErrors,
    focusFirstError,
    setButtonLoading,
    confirm: confirmAction,
    mountShell,
    bindHelper,
    restoreIcons: hydrateIcons
  };

  init();
})();
