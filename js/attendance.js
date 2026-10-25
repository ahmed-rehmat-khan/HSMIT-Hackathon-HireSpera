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

  function isWorkingDay(dateValue, company = app.read(keys.COMPANY, {})) {
    if (!dateValue) return false;
    const date = new Date(`${dateValue}T12:00:00`);
    if (Number.isNaN(date.getTime())) return false;
    const day = date.getDay();
    if (day === 0 || day === 6) return false;
    return (company.workingDays || [1, 2, 3, 4, 5]).includes(day);
  }

  function workHours(record) {
    if (!record?.checkIn || !record?.checkOut) return 0;
    const [inHour, inMinute] = record.checkIn.split(':').map(Number);
    const [outHour, outMinute] = record.checkOut.split(':').map(Number);
    const duration = (outHour * 60 + outMinute) - (inHour * 60 + inMinute);
    return Math.max(0, duration / 60);
  }

  function checkIn(employeeId, now = new Date()) {
    const employee = app.read(keys.USERS, []).find((user) => user.id === employeeId && user.role === 'employee');
    if (!employee) throw fail('Your employee record could not be found.');
    const date = isoDate(now);
    const company = app.read(keys.COMPANY, {});
    if (!isWorkingDay(date, company)) throw fail('Today is not a configured working day.');
    const records = app.read(keys.ATTENDANCE, []);
    if (records.some((record) => record.employeeId === employeeId && record.date === date)) {
      throw fail('You have already checked in today.');
    }
    const checkInTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const [startHour, startMinute] = (company.officeStart || '09:00').split(':').map(Number);
    const late = now.getHours() * 60 + now.getMinutes() > startHour * 60 + startMinute + Number(company.graceMinutes || 0);
    const record = {
      id: app.id(),
      employeeId,
      date,
      checkIn: checkInTime,
      checkOut: '',
      status: late ? 'Late' : 'Present',
      late,
      workHours: 0,
      createdAt: now.toISOString()
    };
    app.write(keys.ATTENDANCE, [...records, record]);
    return record;
  }

  function checkOut(employeeId, now = new Date()) {
    const date = isoDate(now);
    const records = app.read(keys.ATTENDANCE, []);
    const record = records.find((item) => item.employeeId === employeeId && item.date === date);
    if (!record) throw fail('Check in before checking out.');
    if (record.checkOut) throw fail('You have already checked out today.');
    const checkOutTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    if (checkOutTime <= record.checkIn) throw fail('Check-out time must be later than check-in.');
    const updated = { ...record, checkOut: checkOutTime };
    updated.workHours = workHours(updated);
    if (updated.workHours < 5) updated.status = 'Half Day';
    else if (record.late) updated.status = 'Late';
    else updated.status = 'Present';
    app.write(keys.ATTENDANCE, records.map((item) => item.id === record.id ? updated : item));
    return updated;
  }

  function forEmployee(employeeId) {
    return app.read(keys.ATTENDANCE, [])
      .filter((item) => item.employeeId === employeeId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  function statusOn(employeeId, date) {
    const record = app.read(keys.ATTENDANCE, []).find((item) => item.employeeId === employeeId && item.date === date);
    if (record) return record;
    return isWorkingDay(date) ? { employeeId, date, status: 'Absent', checkIn: '', checkOut: '', workHours: 0, late: false } : null;
  }

  function monthSummary(employee, year, month) {
    const company = app.read(keys.COMPANY, {});
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);
    const createdAt = employee.createdAt || `${year}-${String(month).padStart(2, '0')}-01`;
    const today = app.today();
    const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
    const approvedLeaveDates = new Set();
    let approvedLeaveDays = 0;
    app.read(keys.LEAVES, [])
      .filter((leave) => leave.employeeId === employee.id && leave.status === 'Approved')
      .forEach((leave) => {
        for (let date = new Date(`${leave.from}T12:00:00`); date <= new Date(`${leave.to}T12:00:00`); date.setDate(date.getDate() + 1)) {
          const iso = isoDate(date);
          approvedLeaveDates.add(iso);
          if (iso.startsWith(monthPrefix) && isWorkingDay(iso, company)) approvedLeaveDays += 1;
        }
      });

    const records = forEmployee(employee.id).filter((record) => record.date.startsWith(monthPrefix));
    const recordByDate = new Map(records.map((record) => [record.date, record]));
    const workDates = [];
    for (let date = new Date(monthStart); date <= monthEnd; date.setDate(date.getDate() + 1)) {
      const iso = isoDate(date);
      if (isWorkingDay(iso, company)) workDates.push(iso);
    }

    let absentDays = 0;
    let halfDays = 0;
    workDates.forEach((date) => {
      if (date < createdAt) return;
      if (approvedLeaveDates.has(date)) return;
      const record = recordByDate.get(date);
      if (record?.status === 'Half Day' && date <= today) {
        halfDays += 1;
        return;
      }
      if (date >= today) return;
      if (!record) absentDays += 1;
    });

    const workingDays = workDates.length;
    const perDaySalary = workingDays ? Number(employee.salary) / workingDays : 0;
    const deduction = perDaySalary * (absentDays + 0.5 * halfDays);
    return {
      records,
      workingDays,
      absentDays,
      halfDays,
      leaveDays: approvedLeaveDays,
      perDaySalary,
      deduction,
      netSalary: Math.max(0, Number(employee.salary) - deduction)
    };
  }

  app.attendance = { isWorkingDay, workHours, checkIn, checkOut, forEmployee, statusOn, monthSummary };
})();
