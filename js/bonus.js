(() => {
  'use strict';

  const app = window.HireSpera;
  if (!app) return;

  const escape = app.escape;
  const keys = app.keys;
  const CHART_SOURCES = [
    'https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js',
    'https://unpkg.com/chart.js@4.4.7/dist/chart.umd.min.js'
  ];
  const FACE_SOURCE = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js';
  const FACE_MODELS = 'https://justadudewhohacks.github.io/face-api.js/models';
  const START_BUTTON_HTML = '<span data-icon="camera"></span>Start verification';
  const chartInstances = [];
  let chartLoadPromise = null;
  let faceLoadPromise = null;
  let faceModelsLoaded = false;
  let insightsToken = 0;
  let refreshTimer = 0;
  let cameraDialog = null;
  let cameraStream = null;
  let cameraRun = 0;
  let cameraUser = null;

  /* ------------------------------------------------------------------------
     Small utilities
     ------------------------------------------------------------------------ */

  function delay(milliseconds) {
    return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
  }

  function isoDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function monthBounds(monthValue) {
    const [year, month] = String(monthValue || app.monthKey()).split('-').map(Number);
    if (!year || !month) return null;
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    return {
      year,
      month,
      start,
      end,
      startIso: isoDate(start),
      endIso: isoDate(end),
      prefix: `${year}-${String(month).padStart(2, '0')}`,
      label: app.monthLabel(year, month)
    };
  }

  function workingDaysInMonth(year, month, company) {
    let count = 0;
    const end = new Date(year, month, 0);
    for (let date = new Date(year, month - 1, 1); date <= end; date.setDate(date.getDate() + 1)) {
      if (app.attendance.isWorkingDay(isoDate(date), company)) count += 1;
    }
    return count;
  }

  function csvCell(value) {
    let text = String(value ?? '');
    if (/^[\s]*[=+@\-\t\r]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  }

  function downloadCsv(filename, rows) {
    const csv = rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function loadScript(source, timeout = 7000) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = source;
      script.async = true;
      script.crossOrigin = 'anonymous';
      let settled = false;
      const finish = (error) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        script.onload = null;
        script.onerror = null;
        if (error) {
          script.remove();
          reject(error);
        } else {
          resolve();
        }
      };
      const timer = window.setTimeout(() => finish(new Error(`Timed out loading ${source}`)), timeout);
      script.onload = () => finish();
      script.onerror = () => finish(new Error(`Could not load ${source}`));
      document.head.append(script);
    });
  }

  function loadChartJs() {
    if (window.Chart) return Promise.resolve(window.Chart);
    if (chartLoadPromise) return chartLoadPromise;
    chartLoadPromise = (async () => {
      for (const source of CHART_SOURCES) {
        try {
          await loadScript(source);
          if (window.Chart) return window.Chart;
        } catch {
          /* Try the next CDN. */
        }
      }
      throw new Error('Chart.js is unavailable.');
    })().catch((error) => {
      chartLoadPromise = null;
      throw error;
    });
    return chartLoadPromise;
  }

  function loadFaceApi() {
    if (faceModelsLoaded && window.faceapi) return Promise.resolve(window.faceapi);
    if (faceLoadPromise) return faceLoadPromise;
    faceLoadPromise = (async () => {
      try {
        if (!window.faceapi) await loadScript(FACE_SOURCE, 12000);
        if (!window.faceapi) throw new Error('face-api.js is unavailable.');
        if (!faceModelsLoaded) {
          await Promise.race([
            window.faceapi.nets.tinyFaceDetector.loadFromUri(FACE_MODELS),
            delay(16000).then(() => { throw new Error('The face model timed out.'); })
          ]);
          faceModelsLoaded = true;
        }
        return window.faceapi;
      } catch {
        throw new Error('The face-presence model could not load. Check your internet connection and try again.');
      }
    })().catch((error) => {
      faceLoadPromise = null;
      throw error;
    });
    return faceLoadPromise;
  }

  function chartColors() {
    const light = document.documentElement.dataset.theme === 'light';
    return light
      ? {
          text: '#5c5470',
          grid: 'rgba(27, 19, 46, .08)',
          violet: '#6d3fe4',
          violetFill: 'rgba(109, 63, 228, .16)',
          green: '#0f9f72',
          greenFill: 'rgba(15, 159, 114, .16)',
          amber: '#b77906',
          amberFill: 'rgba(183, 121, 6, .16)',
          blue: '#2f6cfa',
          blueFill: 'rgba(47, 108, 250, .14)',
          tooltipBg: '#ffffff',
          tooltipText: '#17131f',
          tooltipBorder: 'rgba(27, 19, 46, .12)'
        }
      : {
          text: '#c8c3d8',
          grid: 'rgba(255, 255, 255, .07)',
          violet: '#a78bfa',
          violetFill: 'rgba(167, 139, 250, .2)',
          green: '#34d399',
          greenFill: 'rgba(52, 211, 153, .18)',
          amber: '#fbbf24',
          amberFill: 'rgba(251, 191, 36, .18)',
          blue: '#5b8cff',
          blueFill: 'rgba(91, 140, 255, .18)',
          tooltipBg: '#171726',
          tooltipText: '#f5f2ff',
          tooltipBorder: 'rgba(255, 255, 255, .12)'
        };
  }

  function tooltipOptions(colors) {
    return {
      backgroundColor: colors.tooltipBg,
      titleColor: colors.tooltipText,
      bodyColor: colors.tooltipText,
      borderColor: colors.tooltipBorder,
      borderWidth: 1,
      cornerRadius: 8,
      padding: 10,
      displayColors: true,
      titleFont: { family: 'Manrope', size: 11, weight: '700' },
      bodyFont: { family: 'Manrope', size: 11 }
    };
  }

  function animationOptions() {
    return {
      duration: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 0 : 420
    };
  }

  /* ------------------------------------------------------------------------
     CSV exports
     ------------------------------------------------------------------------ */

  function exportAttendance() {
    const people = new Map(app.read(keys.USERS, []).map((person) => [person.id, person]));
    const records = app.read(keys.ATTENDANCE, [])
      .filter((record) => people.has(record.employeeId))
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date) || String(people.get(a.employeeId)?.name || '').localeCompare(String(people.get(b.employeeId)?.name || '')));
    if (!records.length) {
      app.ui.toast('There are no attendance records to export yet.', 'info');
      return;
    }
    const rows = [
      ['Date', 'Employee', 'Email', 'Department', 'Check in', 'Check out', 'Hours', 'Status'],
      ...records.map((record) => {
        const person = people.get(record.employeeId);
        return [
          record.date,
          person?.name || 'Employee',
          person?.email || '',
          person?.department || '',
          record.checkIn || '',
          record.checkOut || '',
          app.attendance.workHours(record).toFixed(2),
          record.status || 'Present'
        ];
      })
    ];
    downloadCsv(`hirespera-attendance-${app.today()}.csv`, rows);
    app.ui.toast(`${records.length} attendance ${records.length === 1 ? 'record' : 'records'} exported.`);
  }

  function exportEmployees() {
    const search = document.querySelector('#employee-search')?.value || '';
    const department = document.querySelector('#department-filter')?.value || '';
    const employees = app.employees.list({ search, department });
    if (!employees.length) {
      app.ui.toast('There are no employees in this view to export.', 'info');
      return;
    }
    const rows = [
      ['Name', 'Email', 'Department', 'Job role', 'Monthly salary (PKR)', 'Joined'],
      ...employees.map((person) => [
        person.name,
        person.email,
        person.department || '',
        person.jobTitle || '',
        Number(person.salary) || 0,
        person.createdAt || ''
      ])
    ];
    downloadCsv(`hirespera-employees-${app.today()}.csv`, rows);
    app.ui.toast(`${employees.length} ${employees.length === 1 ? 'employee' : 'employees'} exported.`);
  }

  function initExports() {
    if (app.auth.currentUser()?.role !== 'admin') return;
    const attendanceButton = document.querySelector('[data-export-attendance]');
    if (attendanceButton && attendanceButton.dataset.bonusBound !== 'true') {
      attendanceButton.dataset.bonusBound = 'true';
      attendanceButton.addEventListener('click', exportAttendance);
    }
    const employeeButton = document.querySelector('[data-export-employees]');
    if (employeeButton && employeeButton.dataset.bonusBound !== 'true') {
      employeeButton.dataset.bonusBound = 'true';
      employeeButton.addEventListener('click', exportEmployees);
    }
  }

  /* ------------------------------------------------------------------------
     Attendance insights
     ------------------------------------------------------------------------ */

  function insightData() {
    const people = new Map(app.read(keys.USERS, []).map((person) => [person.id, person]));
    const records = app.read(keys.ATTENDANCE, []).filter((record) => people.has(record.employeeId));

    const departments = new Map();
    const statuses = new Map();
    records.forEach((record) => {
      const person = people.get(record.employeeId);
      const department = person?.department || 'Unassigned';
      departments.set(department, (departments.get(department) || 0) + 1);
      const status = record.status || (record.late ? 'Late' : 'Present');
      statuses.set(status, (statuses.get(status) || 0) + 1);
    });

    const sortedDepartments = [...departments.entries()].sort((a, b) => b[1] - a[1]);
    const topDepartments = sortedDepartments.slice(0, 7);
    if (sortedDepartments.length > 7) {
      topDepartments.push(['Other departments', sortedDepartments.slice(7).reduce((total, entry) => total + entry[1], 0)]);
    }

    const trend = [];
    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = new Date(`${app.today()}T12:00:00`);
      date.setDate(date.getDate() - offset);
      const value = isoDate(date);
      trend.push({
        date: value,
        label: new Intl.DateTimeFormat('en', { weekday: 'short', day: 'numeric' }).format(date),
        count: records.filter((record) => record.date === value).length
      });
    }

    const statusOrder = ['Present', 'Late', 'Half Day'];
    const statusEntries = statusOrder
      .filter((status) => statuses.has(status))
      .map((status) => [status, statuses.get(status)]);
    [...statuses.keys()].filter((status) => !statusOrder.includes(status)).sort().forEach((status) => {
      statusEntries.push([status, statuses.get(status)]);
    });

    return {
      records,
      people,
      departments: topDepartments,
      departmentCount: departments.size,
      statuses: statusEntries,
      trend
    };
  }

  function departmentTable(entries) {
    return `<details class="insights-table">
      <summary>View the department numbers</summary>
      <table>
        <thead><tr><th>Department</th><th>Check-ins</th></tr></thead>
        <tbody>${entries.map(([name, count]) => `<tr><td>${escape(name)}</td><td>${count}</td></tr>`).join('')}</tbody>
      </table>
    </details>`;
  }

  function statusTable(entries) {
    return `<details class="insights-table">
      <summary>View the status numbers</summary>
      <table>
        <thead><tr><th>Status</th><th>Records</th></tr></thead>
        <tbody>${entries.map(([name, count]) => `<tr><td>${escape(name)}</td><td>${count}</td></tr>`).join('')}</tbody>
      </table>
    </details>`;
  }

  function trendTable(entries) {
    return `<details class="insights-table">
      <summary>View the seven-day numbers</summary>
      <table>
        <thead><tr><th>Day</th><th>Check-ins</th></tr></thead>
        <tbody>${entries.map((entry) => `<tr><td>${escape(entry.label)}</td><td>${entry.count}</td></tr>`).join('')}</tbody>
      </table>
    </details>`;
  }

  function insightsMarkup(data) {
    const total = data.records.length;
    return `<div class="panel-heading">
      <div>
        <span class="eyebrow">A wider read</span>
        <h2>Attendance insights</h2>
        <p>Drawn from ${total} saved ${total === 1 ? 'check-in' : 'check-ins'} across ${data.departmentCount} ${data.departmentCount === 1 ? 'department' : 'departments'}.</p>
      </div>
      <span class="insight-meta"><span class="live-dot" aria-hidden="true"></span>Local data</span>
    </div>
    <div class="insights-grid">
      <article class="chart-card">
        <div class="chart-card-head"><div><h3>By department</h3><p>All saved attendance records</p></div></div>
        <div class="chart-frame"><canvas id="insights-department-chart" role="img" aria-label="Bar chart of attendance records by department"></canvas></div>
        ${departmentTable(data.departments)}
      </article>
      <article class="chart-card">
        <div class="chart-card-head"><div><h3>By status</h3><p>Present, late and half days</p></div></div>
        <div class="chart-frame"><canvas id="insights-status-chart" role="img" aria-label="Doughnut chart of attendance records by status"></canvas></div>
        ${statusTable(data.statuses)}
      </article>
      <article class="chart-card">
        <div class="chart-card-head"><div><h3>Seven-day trend</h3><p>Check-ins across the last seven days</p></div></div>
        <div class="chart-frame"><canvas id="insights-trend-chart" role="img" aria-label="Line chart of check-ins across the last seven days"></canvas></div>
        ${trendTable(data.trend)}
      </article>
    </div>`;
  }

  function emptyInsightsMarkup() {
    return `<div class="panel-heading">
      <div>
        <span class="eyebrow">A wider read</span>
        <h2>Attendance insights</h2>
        <p>Charts are built only from saved attendance records.</p>
      </div>
      <span class="insight-meta"><span class="live-dot" aria-hidden="true"></span>Local data</span>
    </div>
    <div class="chart-empty"><span data-icon="chart"></span>Insights appear after the first attendance record is saved. Department, status and the seven-day trend will build from there.</div>`;
  }

  function destroyCharts() {
    while (chartInstances.length) {
      try {
        chartInstances.pop().destroy();
      } catch {
        /* A canvas may already have been removed. */
      }
    }
  }

  function paintCharts(Chart, data) {
    const colors = chartColors();
    const departmentCanvas = document.querySelector('#insights-department-chart');
    const statusCanvas = document.querySelector('#insights-status-chart');
    const trendCanvas = document.querySelector('#insights-trend-chart');
    if (!departmentCanvas || !statusCanvas || !trendCanvas) return;

    const statusColors = data.statuses.map(([status]) => {
      if (status === 'Late') return colors.amber;
      if (status === 'Half Day') return colors.blue;
      return colors.green;
    });
    const statusFills = data.statuses.map(([status]) => {
      if (status === 'Late') return colors.amberFill;
      if (status === 'Half Day') return colors.blueFill;
      return colors.greenFill;
    });

    chartInstances.push(new Chart(departmentCanvas, {
      type: 'bar',
      data: {
        labels: data.departments.map(([name]) => name),
        datasets: [{
          label: 'Check-ins',
          data: data.departments.map(([, count]) => count),
          backgroundColor: colors.violetFill,
          borderColor: colors.violet,
          borderWidth: 1,
          borderRadius: 5,
          maxBarThickness: 20
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        animation: animationOptions(),
        plugins: { legend: { display: false }, tooltip: tooltipOptions(colors) },
        scales: {
          x: {
            beginAtZero: true,
            ticks: { color: colors.text, precision: 0, font: { family: 'Manrope', size: 10 } },
            grid: { color: colors.grid, drawTicks: false },
            border: { display: false }
          },
          y: {
            ticks: { color: colors.text, font: { family: 'Manrope', size: 10 } },
            grid: { display: false },
            border: { display: false }
          }
        }
      }
    }));

    chartInstances.push(new Chart(statusCanvas, {
      type: 'doughnut',
      data: {
        labels: data.statuses.map(([status]) => status),
        datasets: [{
          data: data.statuses.map(([, count]) => count),
          backgroundColor: statusFills,
          borderColor: statusColors,
          borderWidth: 1.5,
          hoverOffset: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        animation: animationOptions(),
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: colors.text,
              boxWidth: 8,
              boxHeight: 8,
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 13,
              font: { family: 'Manrope', size: 10 }
            }
          },
          tooltip: tooltipOptions(colors)
        }
      }
    }));

    chartInstances.push(new Chart(trendCanvas, {
      type: 'line',
      data: {
        labels: data.trend.map((entry) => entry.label),
        datasets: [{
          label: 'Check-ins',
          data: data.trend.map((entry) => entry.count),
          borderColor: colors.violet,
          backgroundColor: colors.violetFill,
          fill: true,
          tension: .34,
          borderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 4,
          pointBackgroundColor: colors.violet,
          pointBorderColor: colors.violet
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: animationOptions(),
        plugins: { legend: { display: false }, tooltip: tooltipOptions(colors) },
        scales: {
          x: {
            ticks: { color: colors.text, font: { family: 'Manrope', size: 10 } },
            grid: { display: false },
            border: { display: false }
          },
          y: {
            beginAtZero: true,
            ticks: { color: colors.text, precision: 0, font: { family: 'Manrope', size: 10 } },
            grid: { color: colors.grid, drawTicks: false },
            border: { display: false }
          }
        }
      }
    }));
  }

  function chartFallback() {
    document.querySelectorAll('[data-attendance-insights] .chart-frame').forEach((frame) => {
      if (frame.querySelector('.chart-empty')) return;
      frame.innerHTML = '<div class="chart-empty"><span data-icon="chart"></span>The chart engine could not load. The tables below hold the same numbers.</div>';
    });
    const target = document.querySelector('[data-attendance-insights]');
    if (target) app.ui.hydrateIcons(target);
  }

  function renderInsights() {
    const target = document.querySelector('[data-attendance-insights]');
    if (!target) return;
    const token = ++insightsToken;
    destroyCharts();
    const data = insightData();
    if (!data.records.length) {
      target.innerHTML = emptyInsightsMarkup();
      app.ui.hydrateIcons(target);
      return;
    }
    target.innerHTML = insightsMarkup(data);
    app.ui.hydrateIcons(target);
    if (navigator.onLine === false) {
      chartFallback();
      return;
    }
    loadChartJs()
      .then((Chart) => {
        if (token !== insightsToken || !target.isConnected) return;
        paintCharts(Chart, data);
      })
      .catch(() => {
        if (token !== insightsToken || !target.isConnected) return;
        chartFallback();
      });
  }

  /* ------------------------------------------------------------------------
     Printable monthly report
     ------------------------------------------------------------------------ */

  function leaveDaysInPeriod(leave, startIso, endIso) {
    const from = leave.from > startIso ? leave.from : startIso;
    const to = leave.to < endIso ? leave.to : endIso;
    if (from > to) return 0;
    return app.leave.workingDaysBetween(from, to);
  }

  function reportMarkup(bounds) {
    const company = app.read(keys.COMPANY, {});
    const people = new Map(app.read(keys.USERS, []).map((person) => [person.id, person]));
    const employees = app.employees.list().filter((person) => !person.createdAt || person.createdAt <= bounds.endIso);
    const employeeIds = new Set(employees.map((person) => person.id));
    const workingDays = workingDaysInMonth(bounds.year, bounds.month, company);
    const attendance = app.read(keys.ATTENDANCE, [])
      .filter((record) => record.date.startsWith(bounds.prefix) && employeeIds.has(record.employeeId))
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date) || String(people.get(a.employeeId)?.name || '').localeCompare(String(people.get(b.employeeId)?.name || '')));
    const leaves = app.read(keys.LEAVES, [])
      .filter((leave) => employeeIds.has(leave.employeeId) && leave.from <= bounds.endIso && leave.to >= bounds.startIso)
      .slice()
      .sort((a, b) => a.from.localeCompare(b.from) || String(people.get(a.employeeId)?.name || '').localeCompare(String(people.get(b.employeeId)?.name || '')));
    const payroll = employees.map((employee) => ({ employee, summary: app.attendance.monthSummary(employee, bounds.year, bounds.month) }));
    const approvedLeaveDays = leaves
      .filter((leave) => leave.status === 'Approved')
      .reduce((total, leave) => total + leaveDaysInPeriod(leave, bounds.startIso, bounds.endIso), 0);
    const totalNet = payroll.reduce((total, row) => total + row.summary.netSalary, 0);

    const attendanceBody = attendance.length
      ? attendance.map((record) => {
          const person = people.get(record.employeeId);
          return `<tr>
            <td>${escape(app.dateLabel(record.date, { day: 'numeric', month: 'short' }))}</td>
            <td>${escape(person?.name || 'Employee')}</td>
            <td>${escape(person?.department || '—')}</td>
            <td>${escape(record.checkIn ? app.timeLabel(record.checkIn) : '—')}</td>
            <td>${escape(record.checkOut ? app.timeLabel(record.checkOut) : '—')}</td>
            <td>${app.attendance.workHours(record).toFixed(1)}</td>
            <td>${escape(record.status || 'Present')}</td>
          </tr>`;
        }).join('')
      : '<tr><td colspan="7"><div class="report-empty">No attendance records were saved in this period.</div></td></tr>';

    const leaveBody = leaves.length
      ? leaves.map((leave) => {
          const person = people.get(leave.employeeId);
          return `<tr>
            <td>${escape(person?.name || 'Employee')}</td>
            <td>${escape(leave.type)}</td>
            <td>${escape(app.dateLabel(leave.from, { day: 'numeric', month: 'short' }))} – ${escape(app.dateLabel(leave.to, { day: 'numeric', month: 'short' }))}</td>
            <td>${leaveDaysInPeriod(leave, bounds.startIso, bounds.endIso)}</td>
            <td>${escape(leave.status)}</td>
          </tr>`;
        }).join('')
      : '<tr><td colspan="5"><div class="report-empty">No leave requests overlap this period.</div></td></tr>';

    const salaryBody = payroll.length
      ? payroll.map(({ employee, summary }) => `<tr>
          <td>${escape(employee.name)}</td>
          <td>${escape(app.money(employee.salary))}</td>
          <td>${summary.workingDays}</td>
          <td>${summary.absentDays}</td>
          <td>${summary.halfDays}</td>
          <td>${summary.leaveDays}</td>
          <td>${escape(app.money(summary.deduction))}</td>
          <td>${escape(app.money(summary.netSalary))}</td>
        </tr>`).join('')
      : '<tr><td colspan="8"><div class="report-empty">No employee salary records are available for this period.</div></td></tr>';

    return `<article class="report-document">
      <header class="report-header">
        <div>
          <span class="brand-lockup">
            <img class="brand-mark" src="../assets/brand-mark.svg" alt="" width="36" height="36">
            <span class="brand-copy"><strong>HireSpera</strong><small>Build teams. Build tomorrow.</small></span>
          </span>
          <p>${escape(company.name || 'Company')}</p>
        </div>
        <div>
          <h1>Monthly report</h1>
          <p>${escape(bounds.label)} · Generated ${escape(app.dateLabel(app.today()))}</p>
        </div>
      </header>

      <h2>Company summary</h2>
      <p>Attendance, leave and payroll as saved in this browser.</p>
      <div class="report-summary-grid">
        <div><span>Employees</span><strong>${employees.length}</strong></div>
        <div><span>Working days</span><strong>${workingDays}</strong></div>
        <div><span>Attendance records</span><strong>${attendance.length}</strong></div>
        <div><span>Approved leave days</span><strong>${approvedLeaveDays}</strong></div>
        <div><span>Net payroll</span><strong>${escape(app.money(totalNet))}</strong></div>
      </div>

      <h2>Attendance</h2>
      <p>Every saved check-in and check-out in ${escape(bounds.label)}.</p>
      <table>
        <thead><tr><th>Date</th><th>Employee</th><th>Department</th><th>In</th><th>Out</th><th>Hours</th><th>Status</th></tr></thead>
        <tbody>${attendanceBody}</tbody>
      </table>

      <h2>Leave</h2>
      <p>Requests that overlap the selected period, with working days counted inside it.</p>
      <table>
        <thead><tr><th>Employee</th><th>Type</th><th>Dates</th><th>Days in period</th><th>Status</th></tr></thead>
        <tbody>${leaveBody}</tbody>
      </table>

      <h2>Salary</h2>
      <p>Monthly salary less absence deductions. Approved leave is paid.</p>
      <table>
        <thead><tr><th>Employee</th><th>Monthly salary</th><th>Working days</th><th>Absent</th><th>Half days</th><th>Paid leave</th><th>Deduction</th><th>Net pay</th></tr></thead>
        <tbody>${salaryBody}</tbody>
      </table>

      <p class="report-note">Prepared by ${escape(app.auth.currentUser()?.name || 'Admin')} on ${escape(app.dateLabel(app.today()))}. Payroll uses the company’s saved working calendar and approved leave. For the current month, only working days before today are counted as absent. This report contains private employee information; handle and dispose of it carefully.</p>
    </article>`;
  }

  function printMonthlyReport() {
    const bounds = monthBounds(document.querySelector('#pay-period')?.value);
    if (!bounds) {
      app.ui.toast('Choose a valid pay period before printing the report.', 'error');
      return;
    }
    document.querySelector('[data-print-report]')?.remove();
    const section = document.createElement('section');
    section.className = 'print-report';
    section.dataset.printReport = '';
    section.innerHTML = reportMarkup(bounds);
    document.body.append(section);

    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      document.body.classList.remove('printing-report');
      section.remove();
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup, { once: true });
    document.body.classList.add('printing-report');
    window.requestAnimationFrame(() => {
      try {
        window.print();
      } catch {
        cleanup();
        app.ui.toast('The print dialog could not open. Try your browser’s print command.', 'error');
      }
      window.setTimeout(cleanup, 60000);
    });
  }

  function initReportSlot() {
    const slot = document.querySelector('[data-report-slot]');
    if (!slot) return;
    if (app.auth.currentUser()?.role !== 'admin') {
      slot.innerHTML = '';
      return;
    }
    if (slot.dataset.bonusBound === 'true') return;
    slot.dataset.bonusBound = 'true';
    slot.innerHTML = '<button class="button button-secondary" type="button" data-print-monthly-report><span data-icon="printer"></span>Monthly report</button>';
    app.ui.hydrateIcons(slot);
    slot.querySelector('[data-print-monthly-report]')?.addEventListener('click', printMonthlyReport);
  }

  /* ------------------------------------------------------------------------
     Optional camera + location verification
     ------------------------------------------------------------------------ */

  function hasCoordinates(company) {
    const latitude = company?.officeLatitude;
    const longitude = company?.officeLongitude;
    return latitude !== null && latitude !== undefined && latitude !== ''
      && longitude !== null && longitude !== undefined && longitude !== ''
      && Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude));
  }

  function todayRecord(employeeId) {
    return app.attendance.forEmployee(employeeId).find((record) => record.date === app.today()) || null;
  }

  function cameraState(user) {
    const company = app.read(keys.COMPANY, {});
    const working = app.attendance.isWorkingDay(app.today(), company);
    const record = todayRecord(user.id);
    const coordinates = hasCoordinates(company);
    const secure = Boolean(window.isSecureContext && navigator.mediaDevices?.getUserMedia);
    const location = Boolean(navigator.geolocation);
    return { company, working, record, coordinates, secure, location };
  }

  function cameraCardStatus(state) {
    if (state.record?.checkIn) {
      return { label: 'Already checked in', disabled: true, text: state.record.checkOut ? 'Your attendance for today is already complete.' : 'Your check-in is already saved for today.' };
    }
    if (!state.working) {
      return { label: 'Office closed', disabled: true, text: 'Today is not a configured working day. Normal check-in is also closed.' };
    }
    if (!state.coordinates) {
      return { label: 'Office point not set', disabled: true, text: 'Ask your Admin to add the office latitude and longitude in Company settings. Your normal check-in still works.' };
    }
    if (!state.secure) {
      return { label: 'Unavailable here', disabled: true, text: 'Camera verification needs HTTPS or localhost and a browser with camera support. Your normal check-in still works.' };
    }
    if (!state.location) {
      return { label: 'Location unavailable', disabled: true, text: 'This browser cannot read a location. Your normal check-in still works.' };
    }
    return { label: 'Verify presence', disabled: false, text: 'Optional: a face check plus a location within 100 m of the office point. Nothing is saved.' };
  }

  function renderCameraCard() {
    const slot = document.querySelector('[data-camera-slot]');
    if (!slot) return;
    const user = app.auth.currentUser();
    if (!user || user.role !== 'employee') {
      slot.innerHTML = '';
      return;
    }
    const state = cameraState(user);
    const status = cameraCardStatus(state);
    slot.innerHTML = `<div class="camera-card">
      <span class="camera-icon" data-icon="camera"></span>
      <div>
        <strong>Camera presence check</strong>
        <p>An optional extra check for check-in. Normal check-in is never blocked by it.</p>
        <span class="camera-status" id="camera-card-status">${escape(status.text)}</span>
        <button class="button button-secondary button-small" type="button" data-camera-open${status.disabled ? ' disabled' : ''}>${escape(status.label)}</button>
      </div>
    </div>`;
    app.ui.hydrateIcons(slot);
    slot.querySelector('[data-camera-open]')?.addEventListener('click', () => openCameraDialog(user));
  }

  function stopCameraStream() {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      cameraStream = null;
    }
    const video = cameraDialog?.querySelector('#camera-video');
    if (video) {
      video.pause();
      video.srcObject = null;
    }
  }

  function setCameraMessage(text, type = 'info') {
    app.ui.setFormMessage(cameraDialog?.querySelector('#camera-message'), text, type);
  }

  function resetCameraDialog() {
    cameraRun += 1;
    stopCameraStream();
    cameraUser = null;
    if (!cameraDialog) return;
    cameraDialog.dataset.busy = 'false';
    const consent = cameraDialog.querySelector('#camera-consent');
    const startButton = cameraDialog.querySelector('#camera-start');
    if (consent) {
      consent.checked = false;
      consent.disabled = false;
    }
    if (startButton) {
      app.ui.setButtonLoading(startButton, false);
      startButton.innerHTML = START_BUTTON_HTML;
      startButton.disabled = true;
      app.ui.hydrateIcons(startButton);
    }
    setCameraMessage('', 'info');
  }

  function ensureCameraDialog() {
    if (cameraDialog) return cameraDialog;
    cameraDialog = document.createElement('dialog');
    cameraDialog.id = 'camera-dialog';
    cameraDialog.className = 'modal camera-dialog';
    cameraDialog.setAttribute('aria-labelledby', 'camera-title');
    cameraDialog.innerHTML = `<div class="modal-body">
      <div class="modal-heading">
        <div>
          <span class="eyebrow">Optional verification</span>
          <h2 id="camera-title">Presence, checked in the moment</h2>
          <p>This optional check confirms a face is present and that you are close to the office. It does not identify you.</p>
        </div>
        <button class="icon-button" type="button" data-dialog-close aria-label="Close camera check" data-icon="x"></button>
      </div>
      <div class="camera-preview"><video id="camera-video" autoplay muted playsinline aria-label="Camera preview"></video></div>
      <ul class="rule-list">
        <li><span data-icon="mapPin"></span><span>Your device location must be within 100 m of the office point saved by your Admin.</span></li>
        <li><span data-icon="camera"></span><span>A face must be visible in the frame. This confirms presence, not identity.</span></li>
        <li><span data-icon="shield"></span><span>Camera frames and your location are used once and never saved.</span></li>
      </ul>
      <label class="camera-consent">
        <input type="checkbox" id="camera-consent">
        <span>I understand this optional check uses my camera and current location now.</span>
      </label>
      <p class="form-message hidden" id="camera-message" aria-live="polite"></p>
      <div class="modal-actions">
        <button class="button button-secondary" type="button" data-camera-cancel>Cancel</button>
        <button class="button button-primary" type="button" id="camera-start" disabled><span data-icon="camera"></span>Start verification</button>
      </div>
    </div>`;
    document.body.append(cameraDialog);
    app.ui.hydrateIcons(cameraDialog);

    const consent = cameraDialog.querySelector('#camera-consent');
    const startButton = cameraDialog.querySelector('#camera-start');
    consent.addEventListener('change', () => {
      startButton.disabled = !consent.checked;
    });
    cameraDialog.querySelector('[data-camera-cancel]')?.addEventListener('click', () => cameraDialog.close());
    startButton.addEventListener('click', startCameraVerification);
    cameraDialog.addEventListener('close', resetCameraDialog);
    return cameraDialog;
  }

  function openCameraDialog(user) {
    ensureCameraDialog();
    if (cameraDialog.open) return;
    resetCameraDialog();
    cameraUser = user;
    const state = cameraState(user);
    const status = cameraCardStatus(state);
    if (status.disabled) {
      setCameraMessage(status.text, 'error');
      const consent = cameraDialog.querySelector('#camera-consent');
      const startButton = cameraDialog.querySelector('#camera-start');
      if (consent) consent.disabled = true;
      if (startButton) startButton.disabled = true;
    } else {
      setCameraMessage('Tick the consent box, then start the check. It takes a few seconds.', 'info');
      const startButton = cameraDialog.querySelector('#camera-start');
      if (startButton) startButton.disabled = true;
    }
    cameraDialog.showModal();
    window.setTimeout(() => cameraDialog.querySelector('#camera-consent')?.focus({ preventScroll: true }), 80);
  }

  function getPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Location is not available in this browser.'));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 30000
      });
    });
  }

  function distanceInMetres(lat1, lon1, lat2, lon2) {
    const toRadians = (value) => (value * Math.PI) / 180;
    const earthRadius = 6371000;
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2
      + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
    return 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function cameraError(message) {
    const error = new Error(message);
    error.userMessage = message;
    return error;
  }

  function friendlyCameraError(error) {
    if (error?.userMessage) return error.userMessage;
    if (error?.code === 1 || error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError') {
      return 'Camera or location permission was blocked. Allow it in your browser, or use the normal check-in button.';
    }
    if (error?.code === 2) return 'Your location could not be determined. Move somewhere with a clearer signal, or use the normal check-in button.';
    if (error?.code === 3) return 'The location check timed out. Try again, or use the normal check-in button.';
    if (error?.name === 'NotFoundError' || error?.name === 'DevicesNotFoundError') return 'No camera was found on this device. The normal check-in button still works.';
    if (error?.name === 'NotReadableError' || error?.name === 'TrackStartError') return 'The camera is in use by another app. Close it and try again, or use the normal check-in button.';
    if (error?.name === 'OverconstrainedError') return 'This camera cannot provide a suitable picture. Try another camera, or use the normal check-in button.';
    return error?.message || 'Verification could not be completed. Check your permissions and connection, or use the normal check-in button.';
  }

  function waitForVideo(video) {
    if (video.readyState >= 2 && video.videoWidth) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const timer = window.setTimeout(() => {
        cleanup();
        reject(cameraError('The camera did not start in time. Close other camera apps and try again.'));
      }, 9000);
      const cleanup = () => {
        window.clearTimeout(timer);
        video.removeEventListener('loadedmetadata', check);
        video.removeEventListener('canplay', check);
      };
      const check = () => {
        if (video.readyState >= 2 && video.videoWidth) {
          cleanup();
          resolve();
        }
      };
      video.addEventListener('loadedmetadata', check);
      video.addEventListener('canplay', check);
    });
  }

  async function startCameraVerification() {
    if (!cameraDialog || cameraDialog.dataset.busy === 'true') return;
    const user = cameraUser || app.auth.currentUser();
    if (!user || user.role !== 'employee') {
      setCameraMessage('Your employee record could not be found. Sign in again.', 'error');
      return;
    }
    const state = cameraState(user);
    const blocked = cameraCardStatus(state);
    if (blocked.disabled) {
      setCameraMessage(blocked.text, 'error');
      return;
    }

    const runId = ++cameraRun;
    const consent = cameraDialog.querySelector('#camera-consent');
    const startButton = cameraDialog.querySelector('#camera-start');
    cameraDialog.dataset.busy = 'true';
    consent.disabled = true;
    app.ui.setButtonLoading(startButton, true, 'Checking…');
    setCameraMessage('Reading your location…', 'info');

    try {
      const position = await getPosition();
      if (runId !== cameraRun) return;
      const officeLatitude = Number(state.company.officeLatitude);
      const officeLongitude = Number(state.company.officeLongitude);
      const distance = distanceInMetres(
        position.coords.latitude,
        position.coords.longitude,
        officeLatitude,
        officeLongitude
      );
      if (!Number.isFinite(distance) || distance > 100) {
        throw cameraError(`You are about ${Math.max(1, Math.round(distance))} m from the office. Move within 100 m and try again.`);
      }

      setCameraMessage('Starting the camera…', 'info');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false
      });
      if (runId !== cameraRun) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      cameraStream = stream;
      const video = cameraDialog.querySelector('#camera-video');
      video.srcObject = stream;
      await waitForVideo(video);
      await video.play().catch(() => {});
      if (runId !== cameraRun) return;

      setCameraMessage('Loading the presence check…', 'info');
      const faceapi = await loadFaceApi();
      if (runId !== cameraRun) return;

      const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.45 });
      let detected = false;
      for (let attempt = 0; attempt < 16; attempt += 1) {
        if (runId !== cameraRun) return;
        if (video.readyState >= 2) {
          const detections = await faceapi.detectAllFaces(video, options);
          if (detections.length) {
            detected = true;
            break;
          }
        }
        setCameraMessage(attempt < 3 ? 'Looking for a face. Center your face inside the oval.' : 'Still looking… keep your face inside the frame.', 'info');
        await delay(450);
      }
      if (!detected) {
        throw cameraError('No face was detected. Center your face inside the oval and try again.');
      }

      setCameraMessage('Presence confirmed. Saving your check-in…', 'success');
      const record = app.attendance.checkIn(user.id);
      stopCameraStream();
      cameraDialog.close();
      app.ui.toast(record.status === 'Late'
        ? 'Presence and location verified. Your late check-in is saved.'
        : 'Presence and location verified. You are checked in.', record.status === 'Late' ? 'info' : 'success');
      window.dispatchEvent(new CustomEvent('hirespera:attendance-changed'));
    } catch (error) {
      if (runId !== cameraRun) return;
      stopCameraStream();
      setCameraMessage(friendlyCameraError(error), 'error');
    } finally {
      if (runId === cameraRun) {
        cameraDialog.dataset.busy = 'false';
        app.ui.setButtonLoading(startButton, false);
        startButton.disabled = !consent.checked;
        consent.disabled = false;
      }
    }
  }

  /* ------------------------------------------------------------------------
     Startup and refresh
     ------------------------------------------------------------------------ */

  function refreshAll() {
    initExports();
    initReportSlot();
    renderInsights();
    renderCameraCard();
  }

  function scheduleRefresh() {
    window.clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(refreshAll, 140);
  }

  window.addEventListener('hirespera:theme-change', scheduleRefresh);
  window.addEventListener('hirespera:attendance-changed', scheduleRefresh);
  window.addEventListener('hirespera:data-changed', scheduleRefresh);
  window.addEventListener('storage', (event) => {
    if (!event.key || [keys.COMPANY, keys.USERS, keys.ATTENDANCE, keys.LEAVES].includes(event.key)) scheduleRefresh();
  });

  refreshAll();

  app.bonus = { refresh: refreshAll };
})();
