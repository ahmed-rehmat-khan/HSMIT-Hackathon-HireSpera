(() => {
  'use strict';

  const app = window.HireSpera;
  const { keys } = app;

  function fail(message, field) {
    const error = new Error(message);
    error.field = field;
    return error;
  }

  function isoDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function workingDaysBetween(from, to) {
    if (!from || !to) return 0;
    let count = 0;
    for (let date = new Date(`${from}T12:00:00`); date <= new Date(`${to}T12:00:00`); date.setDate(date.getDate() + 1)) {
      if (app.attendance.isWorkingDay(isoDate(date))) count += 1;
    }
    return count;
  }

  function daysPerYear(from, to) {
    const days = {};
    for (let date = new Date(`${from}T12:00:00`); date <= new Date(`${to}T12:00:00`); date.setDate(date.getDate() + 1)) {
      const iso = isoDate(date);
      if (app.attendance.isWorkingDay(iso)) {
        const year = date.getFullYear();
        days[year] = (days[year] || 0) + 1;
      }
    }
    return days;
  }

  function summary(employeeId, year = new Date().getFullYear()) {
    const quota = Number(app.read(keys.COMPANY, {}).leaveQuota || 0);
    const leaves = app.read(keys.LEAVES, []).filter((leave) => leave.employeeId === employeeId);
    const used = leaves
      .filter((leave) => leave.status === 'Approved')
      .reduce((total, leave) => total + (daysPerYear(leave.from, leave.to)[year] || 0), 0);
    const pendingDays = leaves
      .filter((leave) => leave.status === 'Pending')
      .reduce((total, leave) => total + (daysPerYear(leave.from, leave.to)[year] || 0), 0);
    return {
      quota,
      used,
      pending: pendingDays,
      remaining: Math.max(0, quota - used)
    };
  }

  function balance(employeeId, year = new Date().getFullYear()) {
    return summary(employeeId, year).remaining;
  }

  function apply(employeeId, data) {
    const type = String(data.type || '').trim();
    const from = String(data.from || '').trim();
    const to = String(data.to || '').trim();
    const reason = String(data.reason || '').trim();
    if (!type) throw fail('Choose a leave type.', 'type');
    if (!from) throw fail('Choose a start date.', 'from');
    if (!to) throw fail('Choose an end date.', 'to');
    if (Number.isNaN(new Date(`${from}T12:00:00`).getTime()) || Number.isNaN(new Date(`${to}T12:00:00`).getTime())) {
      throw fail('Choose valid dates.', 'from');
    }
    if (from > to) throw fail('The start date must be on or before the end date.', 'to');
    if (from < app.today()) throw fail('Choose today or a future date.', 'from');
    if (!reason) throw fail('Add a short reason for your request.', 'reason');
    if (reason.length > 300) throw fail('Keep the reason under 300 characters.', 'reason');
    const days = workingDaysBetween(from, to);
    if (!days) throw fail('Those dates include no configured working days.', 'from');

    const leaves = app.read(keys.LEAVES, []);
    const requestedDays = new Set();
    for (let date = new Date(`${from}T12:00:00`); date <= new Date(`${to}T12:00:00`); date.setDate(date.getDate() + 1)) {
      const iso = isoDate(date);
      if (app.attendance.isWorkingDay(iso)) requestedDays.add(iso);
    }
    const overlaps = leaves.some((leave) => leave.employeeId === employeeId
      && leave.status !== 'Rejected'
      && [...requestedDays].some((date) => date >= leave.from && date <= leave.to));
    if (overlaps) throw fail('These dates overlap an existing leave request.', 'from');

    const quota = Number(app.read(keys.COMPANY, {}).leaveQuota || 0);
    const addedPerYear = daysPerYear(from, to);
    Object.entries(addedPerYear).forEach(([year, requested]) => {
      const used = leaves
        .filter((leave) => leave.employeeId === employeeId && leave.status !== 'Rejected')
        .reduce((total, leave) => total + (daysPerYear(leave.from, leave.to)[year] || 0), 0);
      if (used + requested > quota) throw fail(`This request exceeds the ${year} leave quota.`, 'to');
    });

    const leave = {
      id: app.id(),
      employeeId,
      type,
      from,
      to,
      days,
      reason,
      status: 'Pending',
      comment: '',
      createdAt: new Date().toISOString()
    };
    app.write(keys.LEAVES, [...leaves, leave]);
    return leave;
  }

  function decide(leaveId, status, comment = '') {
    if (!['Approved', 'Rejected'].includes(status)) throw fail('Choose approve or reject.');
    const cleanComment = String(comment || '').trim();
    if (cleanComment.length > 300) throw fail('Keep the decision note under 300 characters.');
    const leaves = app.read(keys.LEAVES, []);
    const target = leaves.find((leave) => leave.id === leaveId);
    if (!target || target.status !== 'Pending') throw fail('This request is no longer pending.');
    if (status === 'Approved') {
      const quota = Number(app.read(keys.COMPANY, {}).leaveQuota || 0);
      const targetYears = daysPerYear(target.from, target.to);
      Object.entries(targetYears).forEach(([year, requested]) => {
        const alreadyApproved = leaves
          .filter((leave) => leave.id !== target.id && leave.employeeId === target.employeeId && leave.status === 'Approved')
          .reduce((total, leave) => total + (daysPerYear(leave.from, leave.to)[year] || 0), 0);
        if (alreadyApproved + requested > quota) {
          throw fail(`Approving this request would exceed the ${year} leave quota.`);
        }
      });
    }
    app.write(keys.LEAVES, leaves.map((leave) => leave.id === leaveId
      ? { ...leave, status, comment: cleanComment, decidedAt: new Date().toISOString() }
      : leave));
    return app.read(keys.LEAVES, []).find((leave) => leave.id === leaveId);
  }

  function list(employeeId = null) {
    return app.read(keys.LEAVES, [])
      .filter((leave) => !employeeId || leave.employeeId === employeeId)
      .sort((a, b) => b.from.localeCompare(a.from) || String(b.createdAt).localeCompare(String(a.createdAt)));
  }

  function pendingCount() {
    return app.read(keys.LEAVES, []).filter((leave) => leave.status === 'Pending').length;
  }

  app.leave = { workingDaysBetween, summary, balance, apply, decide, list, pendingCount };
})();
