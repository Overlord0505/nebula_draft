# TrackFlow Maintenance Planner

TrackFlow is a browser-based maintenance scheduling prototype. It detects overlapping track-sector and engineer assignments, explains each conflict, suggests alternative time slots and can automatically reschedule conflicting jobs.

## Run in VS Code

1. Extract the source ZIP and open the extracted folder in VS Code.
2. Open the VS Code terminal.
3. Run:

   ```powershell
   cd dist
   python -m http.server 5500
   ```

   On Windows, if `python` is not recognised, use:

   ```powershell
   py -m http.server 5500
   ```

4. Open `http://localhost:5500` in your browser.
5. Press `Ctrl + C` in the terminal to stop the server.

No packages or installation steps are required.

## Main files

- `dist/index.html` contains the page structure.
- `dist/styles.css` contains the complete responsive design.
- `dist/app.js` contains the maintenance data, conflict detection and auto-scheduling logic.

## Features

- Timeline and table views
- Seven-day calendar with previous/next week navigation
- Daily job, conflict and active-sector totals for the selected week
- Click any calendar job or day to open its detailed overnight schedule
- Date-specific maintenance requests and conflict checks
- Track-sector filtering
- Sector and engineer conflict detection
- Alternative time suggestions
- Automatic rescheduling
- Manual conflict review with validated time and engineer changes
- Remove-and-return option when a job cannot fit that night
- Staff headcount and availability dashboard
- Add, edit and remove maintenance staff
- MRT specialisations and individual capability records
- Staff roster connected to request and reassignment forms
- New-request form
- CSV export
- Responsive desktop and mobile layout

Staff and schedule changes are stored in the browser on the current device so they remain available after a refresh.
