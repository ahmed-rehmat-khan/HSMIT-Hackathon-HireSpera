(() => {
  'use strict';

  const app = window.HireSpera;
  const { keys } = app;

  function namesFor(records) {
    const users = app.read(keys.USERS, []);
    return records
      .map((record) => users.find((person) => person.id === record.employeeId)?.name)
      .filter(Boolean);
  }

  function answer(question, user) {
    const text = String(question || '').toLowerCase().trim();
    if (!text) return 'Ask me about the information on your dashboard.';

    if (user.role === 'admin') {
      if (text.includes('late')) {
        const late = app.read(keys.ATTENDANCE, []).filter((record) => record.date === app.today() && record.late);
        const names = namesFor(late);
        return names.length
          ? `Late today: ${names.join(', ')}. ${names.length === 1 ? 'That is 1 late check-in.' : `That is ${names.length} late check-ins.`}`
          : 'No one has been marked late today.';
      }
      if (text.includes('leave') || text.includes('away') || text.includes('absent')) {
        const today = app.today();
        const onLeave = app.leave.list().filter((leave) => leave.status === 'Approved' && leave.from <= today && leave.to >= today);
        const names = namesFor(onLeave);
        return names.length
          ? `On approved leave today: ${names.join(', ')}.`
          : 'No employees are on approved leave today.';
      }
      if (text.includes('pending') || text.includes('awaiting')) {
        const count = app.leave.pendingCount();
        return count
          ? `${count} leave request${count === 1 ? ' is' : 's are'} waiting for your decision.`
          : 'You have no pending leave requests.';
      }
      if (text.includes('present') || text.includes('checked in')) {
        const present = app.read(keys.ATTENDANCE, []).filter((record) => record.date === app.today() && record.checkIn);
        return present.length
          ? `${present.length} employee${present.length === 1 ? ' has' : 's have'} checked in today.`
          : 'No employee has checked in today.';
      }
      if (text.includes('employee') || text.includes('staff') || text.includes('team') || text.includes('headcount') || text.includes('people')) {
        const count = app.employees.list().length;
        const name = app.read(keys.COMPANY, {}).name || 'your company';
        return `${name} has ${count} employee${count === 1 ? '' : 's'} in the team directory.`;
      }
      return 'I can answer questions about headcount, approved leave today, late arrivals, or pending leave requests.';
    }

    const record = app.attendance.statusOn(user.id, app.today());
    if (text.includes('late')) {
      return record?.late
        ? `Yes. Your check-in today was after the grace period.`
        : 'No. You have not been marked late today.';
    }
    if (text.includes('leave') || text.includes('balance') || text.includes('remaining') || text.includes('quota') || text.includes('left')) {
      const data = app.leave.summary(user.id);
      return `You have ${data.remaining} of ${data.quota} leave days remaining for ${new Date().getFullYear()}. You have used ${data.used} approved day${data.used === 1 ? '' : 's'}.`;
    }
    if (text.includes('hour') || text.includes('week') || text.includes('work') || text.includes('attendance')) {
      const today = new Date(`${app.today()}T12:00:00`);
      const start = new Date(today);
      start.setDate(today.getDate() - ((today.getDay() + 6) % 7));
      const hours = app.attendance.forEmployee(user.id)
        .filter((item) => new Date(`${item.date}T12:00:00`) >= start && item.date <= app.today())
        .reduce((sum, item) => sum + app.attendance.workHours(item), 0);
      return `You have recorded ${hours.toFixed(1)} work hour${hours.toFixed(1) === '1.0' ? '' : 's'} this week.`;
    }
    if (text.includes('present') || text.includes('status') || text.includes('check')) {
      if (!record) return 'Today is not a working day for your company.';
      return record.checkIn
        ? `You are marked ${record.status} today. Check-in: ${app.timeLabel(record.checkIn)}${record.checkOut ? `, check-out: ${app.timeLabel(record.checkOut)}` : ''}.`
        : 'You have not checked in yet today.';
    }
    return 'I can answer questions about your leave balance, today’s lateness, or hours worked this week.';
  }

  function suggestions(user) {
    return user.role === 'admin'
      ? ['How many employees do we have?', 'Who is on leave today?', 'Who was late today?']
      : ['How many leaves do I have left?', 'Was I late today?', 'How many hours did I work this week?'];
  }

  app.helper = { answer, suggestions };
})();
