(() => {
  'use strict';

  const app = window.HireSpera;
  const { keys } = app;

  function fail(message, field) {
    const error = new Error(message);
    error.field = field;
    return error;
  }

  function saveEmployee(data, employeeId = null) {
    const users = app.read(keys.USERS, []);
    const name = String(data.name || '').trim();
    const email = String(data.email || '').trim().toLowerCase();
    const department = String(data.department || '').trim();
    const jobTitle = String(data.jobTitle || '').trim();
    const salary = Number(data.salary);
    const password = String(data.password || '');
    if (!name) throw fail('Enter the employee’s full name.', 'name');
    if (!email) throw fail('Enter a work email address.', 'email');
    if (!app.emailValid(email)) throw fail('Enter a valid email address.', 'email');
    if (!department) throw fail('Enter a department.', 'department');
    if (!jobTitle) throw fail('Enter a job role.', 'jobTitle');
    if (!Number.isFinite(salary) || salary <= 0) throw fail('Salary must be greater than zero.', 'salary');
    if (users.some((user) => user.email.toLowerCase() === email && user.id !== employeeId)) throw fail('That email address is already in use.', 'email');

    if (employeeId) {
      const existing = users.find((user) => user.id === employeeId && user.role === 'employee');
      if (!existing) throw fail('Employee record could not be found.');
      if (password && password.length < 8) throw fail('Use a password with at least 8 characters.', 'password');
      app.write(keys.USERS, users.map((user) => user.id === employeeId
        ? { ...user, name, email, department, jobTitle, salary, ...(password ? { password } : {}) }
        : user));
      return app.read(keys.USERS, []).find((user) => user.id === employeeId);
    }

    if (!password) throw fail('Create a temporary password for the employee login.', 'password');
    if (password.length < 8) throw fail('Use a password with at least 8 characters.', 'password');
    const employee = {
      id: app.id(),
      name,
      email,
      password,
      role: 'employee',
      department,
      jobTitle,
      salary,
      createdAt: app.today()
    };
    app.write(keys.USERS, [...users, employee]);
    return employee;
  }

  function removeEmployee(employeeId) {
    const target = app.read(keys.USERS, []).find((user) => user.id === employeeId && user.role === 'employee');
    if (!target) throw fail('Employee record could not be found.');
    app.write(keys.USERS, app.read(keys.USERS, []).filter((user) => user.id !== employeeId));
    app.write(keys.ATTENDANCE, app.read(keys.ATTENDANCE, []).filter((entry) => entry.employeeId !== employeeId));
    app.write(keys.LEAVES, app.read(keys.LEAVES, []).filter((entry) => entry.employeeId !== employeeId));
    return target;
  }

  function list({ search = '', department = '' } = {}) {
    const query = String(search || '').trim().toLowerCase();
    return app.read(keys.USERS, [])
      .filter((user) => user.role === 'employee')
      .filter((user) => !query || `${user.name} ${user.email} ${user.department} ${user.jobTitle || ''}`.toLowerCase().includes(query))
      .filter((user) => !department || user.department === department)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  function departments() {
    return [...new Set(list().map((user) => user.department).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  }

  app.employees = { save: saveEmployee, remove: removeEmployee, list, departments };
})();
