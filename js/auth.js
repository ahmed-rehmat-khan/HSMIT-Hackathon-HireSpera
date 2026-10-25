(() => {
  'use strict';

  const app = window.HireSpera;
  const { keys } = app;

  function fail(message, field) {
    const error = new Error(message);
    error.field = field;
    return error;
  }

  function setup({ companyName, name, email, password }) {
    const users = app.read(keys.USERS, []);
    if (app.read(keys.COMPANY)) throw fail('Company setup is already complete.', 'companyName');
    const cleanCompany = String(companyName || '').trim();
    const cleanName = String(name || '').trim();
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!cleanCompany) throw fail('Enter your company name.', 'companyName');
    if (!cleanName) throw fail('Enter your full name.', 'name');
    if (!cleanEmail) throw fail('Enter your work email.', 'email');
    if (!app.emailValid(cleanEmail)) throw fail('Enter a valid email address.', 'email');
    if (!password) throw fail('Create a password.', 'password');
    if (String(password).length < 8) throw fail('Use a password with at least 8 characters.', 'password');
    if (users.some((user) => user.email.toLowerCase() === cleanEmail)) throw fail('That email address is already in use.', 'email');
    const admin = {
      id: app.id(),
      name: cleanName,
      email: cleanEmail,
      password: String(password),
      role: 'admin',
      department: 'Administration',
      jobTitle: 'Administrator',
      salary: 0,
      createdAt: app.today()
    };
    app.write(keys.COMPANY, {
      name: cleanCompany,
      officeStart: '09:00',
      graceMinutes: 15,
      leaveQuota: 20,
      workingDays: [1, 2, 3, 4, 5],
      announcements: [],
      createdAt: app.today()
    });
    app.write(keys.USERS, [admin]);
    app.write(keys.ATTENDANCE, []);
    app.write(keys.LEAVES, []);
    return login(cleanEmail, password);
  }

  function login(email, password) {
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!cleanEmail || !password) throw fail('Enter your email and password.', !cleanEmail ? 'email' : 'password');
    if (!app.emailValid(cleanEmail)) throw fail('Enter a valid email address.', 'email');
    const user = app.read(keys.USERS, []).find((item) => item.email.toLowerCase() === cleanEmail && item.password === password);
    if (!user) throw fail('Email or password is incorrect.', 'password');
    app.write(keys.SESSION, { userId: user.id, role: user.role, createdAt: new Date().toISOString() });
    return user;
  }

  function currentUser() {
    const session = app.read(keys.SESSION);
    if (!session?.userId) return null;
    return app.read(keys.USERS, []).find((item) => item.id === session.userId) || null;
  }

  function logout() {
    app.remove(keys.SESSION);
    const inPagesFolder = /\/pages\//i.test(location.pathname);
    location.href = inPagesFolder ? '../index.html' : 'index.html';
  }

  function changePassword(currentPassword, newPassword) {
    const user = currentUser();
    if (!user) throw fail('Your session has expired. Sign in again.', 'currentPassword');
    if (user.password !== String(currentPassword || '')) throw fail('Your current password is incorrect.', 'currentPassword');
    if (String(newPassword || '').length < 8) throw fail('Use a password with at least 8 characters.', 'newPassword');
    if (user.password === newPassword) throw fail('Choose a password you have not used before.', 'newPassword');
    app.update(keys.USERS, (users) => users.map((item) => item.id === user.id ? { ...item, password: String(newPassword) } : item));
  }

  function protect(role) {
    const user = currentUser();
    const isLoginPage = location.pathname.endsWith('/index.html') || location.pathname.endsWith('/');
    if (!user && !isLoginPage) {
      location.replace('../index.html');
      return null;
    }
    if (user && isLoginPage) {
      location.replace(user.role === 'admin' ? 'pages/admin.html' : 'pages/employee.html');
      return user;
    }
    if (user && role && user.role !== role) {
      location.replace(user.role === 'admin' ? 'admin.html' : 'employee.html');
      return null;
    }
    return user;
  }

  app.auth = { setup, login, logout, currentUser, changePassword, protect };
})();
