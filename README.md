# HireSpera

**Build Teams. Build Tomorrow.**

HireSpera is a Human Capital Management Lite app for the Saylani Hackathon Beginner Track. It supports company setup, Admin and Employee accounts, employee records, attendance, leave, announcements, and monthly payslips.

The interface is a responsive, local-first people workspace: a quiet navy/violet visual system in dark mode, a warm paper-light theme, shared SVG iconography, accessible dialogs and toasts, and print-ready payroll documents.

## Technologies

- HTML5, CSS3, and vanilla JavaScript
- Browser `localStorage`
- Optional Chart.js and face-api.js CDN assets for the listed bonus ideas

There is no application backend or database. The app starts empty and uses records created through its UI.

## Project Structure

```text
HireSpera/
├── index.html
├── pages/
│   ├── admin.html
│   ├── employees.html
│   ├── leaves.html
│   ├── settings.html
│   ├── employee.html
│   └── payslip.html
├── assets/brand-mark.svg
├── css/style.css
├── js/
│   ├── storage.js
│   ├── auth.js
│   ├── employees.js
│   ├── attendance.js
│   ├── leave.js
│   ├── helper.js
│   ├── ui.js
│   └── bonus.js
├── README.md
└── architecture.md
```

`js/ui.js` owns the shared app shell, icons, theme mount, navigation, password dialog, confirmation dialog, toasts, and field-level validation helpers. `js/bonus.js` owns the optional charts, CSV exports, printable company report, and camera/GPS check-in.

## Run and First Setup

Open `index.html` in a modern browser. For camera and geolocation, use `localhost` or deploy the static folder to an HTTPS host such as GitHub Pages, Netlify, or Vercel. CDN-based charts and face detection need internet access.

On the first visit, create the company and Admin account. The Admin then adds employees and gives each employee their login credentials. Employees sign in to use only their own attendance, leave, announcements, and payslip pages.

The demo starts with no records. Every dashboard figure is derived from saved actions; no employee, attendance, leave, or payroll data is seeded.

## Required Rules

- Late means check-in is later than the office start time plus the configured grace minutes.
- An employee can check in once per working day; check-out requires a check-in.
- Work under five hours is Half Day. Missing attendance on a configured working day is Absent.
- Leave must have valid ordered dates, counts configured working days only, cannot overlap, and cannot exceed the yearly quota. Only approved leave reduces the balance.
- Per-day salary = monthly salary / working days in that month.
- Deduction = per-day salary × (absent days + 0.5 × half days).
- Net salary = monthly salary - deduction.

## Smart Helper

The required helper uses JavaScript keyword matching and saved application data. Admin answers use company data; employee answers are limited to that employee's records. It works without an external AI service.

The assignment lists an OpenRouter call as an optional bonus. This repository does not call an LLM because a key embedded in a static browser app is visible to users, while hiding the key requires a backend and would violate the no-backend constraint. Do not commit or paste API keys. The key previously shared during development should be revoked.

## Optional Browser Bonuses

- Dark/light theme preference, saved as `hcm_theme`. Dark is the default; the switch is available on the landing page and in the workspace topbar.
- Admin attendance charts: attendance by department, status distribution, and a seven-day trend. Chart.js loads from a CDN, with accessible data tables and an honest table fallback if the chart engine cannot load.
- Admin CSV exports for attendance and employees. The employee export follows the current search and department filter, and passwords are excluded.
- Printable monthly report for the selected pay period, covering attendance, leave, and salary. The Admin opens it from the payslip page; the report is generated from saved records at print time.
- Camera face-presence and GPS check-in. Face detection is not identity recognition; image frames and employee location are not saved. Configure office coordinates in Company settings. Camera/location require user permission and HTTPS or localhost. Normal check-in remains available at all times and is never blocked by camera verification.
- Static hosting with application data in browser `localStorage`.

## Storage

Application records use the assignment's keys: `hcm_company`, `hcm_users`, `hcm_attendance`, `hcm_leaves`, and `hcm_session`. Theme preference is stored separately as `hcm_theme`. Data is local to the current browser and is not synchronized across devices.

## Hosting

The seven-page app is static and can be hosted from this repository with GitHub Pages, Netlify, or Vercel. Submit both the repository URL and hosted URL to the Saylani LMS. Test the hosted HTTPS version before demoing camera/GPS features.
