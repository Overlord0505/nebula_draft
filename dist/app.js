const sectors = [
  { code: "NS-04", name: "North–South line", color: "#e5484d" },
  { code: "EW-12", name: "East–West line", color: "#24a36a" },
  { code: "CC-07", name: "Circle line", color: "#e39422" },
  { code: "DT-09", name: "Downtown line", color: "#3978f6" }
];

const minimumSafetyGap = 0.5;

const defaultRequests = [
  { id: "TRK-279", date: "2026-09-07", title: "Tunnel lighting inspection", sector: "DT-09", start: 1, end: 2.5, engineer: "Priya Nair", type: "Civil", priority: "standard" },
  { id: "TRK-284", date: "2026-09-08", title: "Rail grinding", sector: "NS-04", start: .5, end: 2.5, engineer: "Aaron Lim", type: "Track", priority: "critical" },
  { id: "TRK-291", date: "2026-09-08", title: "Signal testing", sector: "NS-04", start: 1.5, end: 3, engineer: "Maya Chen", type: "Signals", priority: "critical" },
  { id: "TRK-297", date: "2026-09-08", title: "Drainage inspection", sector: "EW-12", start: 0, end: 1.5, engineer: "Priya Nair", type: "Civil", priority: "standard" },
  { id: "TRK-302", date: "2026-09-08", title: "Power cable renewal", sector: "CC-07", start: 2, end: 4.5, engineer: "Aaron Lim", type: "Power", priority: "high" },
  { id: "TRK-311", date: "2026-09-08", title: "Track geometry scan", sector: "DT-09", start: 3, end: 4.5, engineer: "Daniel Koh", type: "Inspection", priority: "standard" },
  { id: "TRK-318", date: "2026-09-08", title: "Point machine replacement", sector: "EW-12", start: .75, end: 2.75, engineer: "Sofia Tan", type: "Signals", priority: "high" },
  { id: "TRK-325", date: "2026-09-09", title: "Ultrasonic rail scan", sector: "NS-04", start: .5, end: 2, engineer: "Daniel Koh", type: "Inspection", priority: "high" },
  { id: "TRK-326", date: "2026-09-10", title: "Traction power isolation test", sector: "CC-07", start: 1, end: 2.5, engineer: "Aaron Lim", type: "Power", priority: "critical" },
  { id: "TRK-327", date: "2026-09-11", title: "Tunnel drainage flush", sector: "EW-12", start: 0, end: 2, engineer: "Priya Nair", type: "Civil", priority: "standard" },
  { id: "TRK-328", date: "2026-09-12", title: "Signal relay test", sector: "DT-09", start: 2, end: 3.5, engineer: "Maya Chen", type: "Signals", priority: "high" },
  { id: "TRK-329", date: "2026-09-13", title: "Turnout lubrication", sector: "NS-04", start: .5, end: 1.5, engineer: "Sofia Tan", type: "Track", priority: "standard" }
];

const specialisations = {
  "Track Engineering": { color: "#d53f4b", description: "Inspects and repairs rails, sleepers, fastenings and track switches." },
  "Signalling & Communications": { color: "#7c4dcc", description: "Tests signals, point machines, train control and communication systems." },
  "Power & Electrical": { color: "#d88414", description: "Maintains traction power, cables, substations and electrical isolation." },
  "Civil & Drainage": { color: "#087a55", description: "Maintains tunnels, structures, drainage systems and station assets." },
  "Inspection & Measurement": { color: "#2266e3", description: "Performs track geometry, ultrasonic and condition-monitoring inspections." },
  "Possession & Safety": { color: "#526174", description: "Controls track access, worksite protection and engineering-hour safety." }
};

const capabilityChoices = [
  "Track inspection", "Rail and turnout repair", "Signal testing", "Point machine maintenance",
  "Power isolation", "Cable renewal", "Tunnel and drainage inspection",
  "Engineering vehicle operation", "Worksite protection", "Condition monitoring"
];

const defaultStaff = [
  { id: "STF-001", name: "Aaron Lim", specialisation: "Track Engineering", availability: "assigned", capabilities: ["Track inspection", "Rail and turnout repair", "Engineering vehicle operation"] },
  { id: "STF-002", name: "Maya Chen", specialisation: "Signalling & Communications", availability: "available", capabilities: ["Signal testing", "Point machine maintenance", "Worksite protection"] },
  { id: "STF-003", name: "Priya Nair", specialisation: "Civil & Drainage", availability: "assigned", capabilities: ["Tunnel and drainage inspection", "Worksite protection"] },
  { id: "STF-004", name: "Daniel Koh", specialisation: "Inspection & Measurement", availability: "available", capabilities: ["Track inspection", "Condition monitoring"] },
  { id: "STF-005", name: "Sofia Tan", specialisation: "Signalling & Communications", availability: "assigned", capabilities: ["Signal testing", "Point machine maintenance"] }
];

let requests = loadRequests();
let staff = loadStoredArray("trackflow_staff", defaultStaff);

let currentDate = new Date("2026-09-08T00:00:00");
let calendarWeekStart = startOfWeek(currentDate);
let view = "timeline";
let activeFilter = "all";
let activeManualConflictKey = null;
let activeStaffId = null;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function loadStoredArray(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return Array.isArray(value) ? value : JSON.parse(JSON.stringify(fallback));
  } catch {
    return JSON.parse(JSON.stringify(fallback));
  }
}

function loadRequests() {
  const loaded = loadStoredArray("trackflow_requests", defaultRequests);
  const needsDateMigration = loaded.some(request => !request.date);
  const migrated = loaded.map(request => ({ ...request, date: request.date || "2026-09-08" }));
  if (needsDateMigration) {
    const existingIds = new Set(migrated.map(request => request.id));
    defaultRequests.filter(request => request.date !== "2026-09-08" && !existingIds.has(request.id)).forEach(request => migrated.push({ ...request }));
    localStorage.setItem("trackflow_requests", JSON.stringify(migrated));
  }
  return migrated;
}

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateFromKey(key) {
  return new Date(`${key}T00:00:00`);
}

function addDays(date, amount) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

function startOfWeek(date) {
  const result = new Date(date);
  const mondayOffset = (result.getDay() + 6) % 7;
  result.setDate(result.getDate() - mondayOffset);
  result.setHours(0, 0, 0, 0);
  return result;
}

function getCurrentRequests() {
  const selectedDate = dateKey(currentDate);
  return requests.filter(request => request.date === selectedDate);
}

function persistState() {
  localStorage.setItem("trackflow_requests", JSON.stringify(requests));
  localStorage.setItem("trackflow_staff", JSON.stringify(staff));
}

function overlaps(a, b) {
  return a.start < b.end && b.start < a.end;
}

function violatesSafetyGap(a, b) {
  return a.start < b.end + minimumSafetyGap && b.start < a.end + minimumSafetyGap;
}

function getConflicts(sourceRequests = getCurrentRequests()) {
  const conflicts = [];
  for (let i = 0; i < sourceRequests.length; i++) {
    for (let j = i + 1; j < sourceRequests.length; j++) {
      const a = sourceRequests[i];
      const b = sourceRequests[j];
      const sameSector = a.sector === b.sector;
      const sameEngineer = a.engineer === b.engineer;
      if ((!sameSector && !sameEngineer) || !violatesSafetyGap(a, b)) continue;
      const kind = overlaps(a, b) ? "overlap" : "buffer";
      if (sameSector) {
        const reason = kind === "overlap" ? `${a.sector} is occupied by both requests.` : `${a.sector} has less than the required 30-minute safety interval between jobs.`;
        conflicts.push({ key: `${a.id}-${b.id}-sector`, a, b, type: "sector", kind, reason });
      } else if (sameEngineer) {
        const reason = kind === "overlap" ? `${a.engineer} is assigned to both jobs.` : `${a.engineer} has less than 30 minutes to move between the two jobs.`;
        conflicts.push({ key: `${a.id}-${b.id}-engineer`, a, b, type: "engineer", kind, reason });
      }
    }
  }
  return conflicts;
}

function getConflictIds(sourceRequests = getCurrentRequests()) {
  return new Set(getConflicts(sourceRequests).flatMap(c => [c.a.id, c.b.id]));
}

function formatTime(value) {
  const hours = Math.floor(value);
  const minutes = Math.round((value - hours) * 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function formatRange(item) {
  return `${formatTime(item.start)}–${formatTime(item.end)}`;
}

function priorityColor(priority) {
  return priority === "critical" ? "#e5484d" : priority === "high" ? "#e39422" : "#3978f6";
}

function candidateFor(target) {
  const duration = target.end - target.start;
  const slots = [];
  for (let start = 0; start + duration <= 5; start += .5) slots.push(start);
  const sorted = slots.sort((a, b) => Math.abs(a - target.start) - Math.abs(b - target.start));
  for (const start of sorted) {
    const trial = { ...target, start, end: start + duration };
    const blocked = requests.some(r => r.id !== target.id && r.date === target.date && violatesSafetyGap(trial, r) && (r.sector === trial.sector || r.engineer === trial.engineer));
    if (!blocked) return { start, end: start + duration };
  }
  return null;
}

function moveOptionsForConflict(conflict) {
  const rank = { critical: 3, high: 2, standard: 1, routine: 1 };
  const aRank = rank[conflict.a.priority] || 1;
  const bRank = rank[conflict.b.priority] || 1;

  if (aRank < bRank) return [conflict.a, conflict.b];
  if (bRank < aRank) return [conflict.b, conflict.a];

  // When priorities match, preserve the request that was booked first.
  return [conflict.b, conflict.a];
}

function findMoveForConflict(conflict) {
  for (const target of moveOptionsForConflict(conflict)) {
    const candidate = candidateFor(target);
    if (candidate) return { target, candidate };
  }
  return null;
}

function renderTimeline() {
  const currentRequests = getCurrentRequests();
  const heading = $("#timeHeading");
  heading.innerHTML = ["00:00", "01:00", "02:00", "03:00", "04:00", "05:00"].map(t => `<span>${t}</span>`).join("");
  const conflictIds = getConflictIds();
  const shownSectors = activeFilter === "all" ? sectors : sectors.filter(s => s.code === activeFilter);
  $("#timelineBody").innerHTML = shownSectors.map(sector => {
    const blocks = currentRequests.filter(r => r.sector === sector.code).map(item => {
      const left = (item.start / 5) * 100;
      const width = ((item.end - item.start) / 5) * 100;
      const conflict = conflictIds.has(item.id);
      return `<button class="work-block ${conflict ? "conflict" : ""}" style="left:${left}%;width:${width}%;--block-color:${priorityColor(item.priority)}" data-request-id="${item.id}" type="button" aria-label="${item.title}, ${formatRange(item)}${conflict ? ", conflict" : ""}">
        <strong>${item.title}</strong><small>${formatRange(item)} · ${item.id}</small>${conflict ? '<span class="block-alert">!</span>' : ""}
      </button>`;
    }).join("");
    return `<div class="timeline-row"><div class="sector-label"><span class="sector-code"><i style="--sector-color:${sector.color}"></i>${sector.code}</span><small class="sector-name">${sector.name}</small></div><div class="track-lane">${blocks}</div></div>`;
  }).join("");
  $$(".work-block").forEach(button => button.addEventListener("click", () => showRequestToast(button.dataset.requestId)));
}

function renderList() {
  const currentRequests = getCurrentRequests();
  const conflictIds = getConflictIds();
  const filtered = activeFilter === "all" ? currentRequests : currentRequests.filter(r => r.sector === activeFilter);
  $("#requestTableBody").innerHTML = filtered.map(item => `<tr>
    <td>${item.title}<span class="table-id">${item.id} · ${item.type}</span></td><td>${item.sector}</td><td>${formatRange(item)}</td><td>${item.engineer}</td>
    <td><span class="priority-chip ${item.priority}">${item.priority}</span></td><td><span class="status-chip ${conflictIds.has(item.id) ? "conflict" : "clear"}">${conflictIds.has(item.id) ? "Conflict" : "Clear"}</span></td>
  </tr>`).join("");
}

function renderConflicts() {
  const conflicts = getConflicts();
  const list = $("#conflictList");
  const resolved = $("#resolvedState");
  if (!conflicts.length) {
    list.classList.add("hidden");
    resolved.classList.remove("hidden");
  } else {
    list.classList.remove("hidden");
    resolved.classList.add("hidden");
    list.innerHTML = conflicts.map((conflict, index) => {
      const move = findMoveForConflict(conflict);
      const target = move?.target;
      const candidate = move?.candidate;
      const suggestionText = candidate ? `${formatTime(candidate.start)}–${formatTime(candidate.end)} · ${target.sector}` : "No safe slot available";
      return `<article class="conflict-card" style="animation-delay:${index * 40}ms">
        <div class="conflict-card-top"><h3>${conflict.a.id} × ${conflict.b.id}</h3><span class="severity">${conflict.kind === "buffer" ? "30-min gap" : conflict.type === "sector" ? "Track clash" : "Resource clash"}</span></div>
        <div class="conflict-reason"><b>!</b><span>${conflict.reason}</span></div>
        <div class="suggestion">
          <span>${target ? `Move ${target.id}` : "Manual decision needed"}<strong>${suggestionText}</strong></span>
          <div class="suggestion-actions">
            ${candidate ? `<button class="apply-button" type="button" data-move-id="${target.id}" data-start="${candidate.start}">Apply</button>` : ""}
            <button class="review-button" type="button" data-conflict-key="${conflict.key}">Review</button>
          </div>
        </div>
      </article>`;
    }).join("");
    $$(".apply-button").forEach(button => button.addEventListener("click", () => applySuggestion(button.dataset.moveId, Number(button.dataset.start))));
    $$(".review-button").forEach(button => button.addEventListener("click", () => openManualReview(button.dataset.conflictKey)));
  }
}

function updateSummary() {
  const currentRequests = getCurrentRequests();
  const conflicts = getConflicts();
  const conflictIds = getConflictIds();
  const clearCount = currentRequests.filter(r => !conflictIds.has(r.id)).length;
  const readiness = currentRequests.length ? Math.round((clearCount / currentRequests.length) * 100) : 100;
  $("#totalCount").textContent = `${currentRequests.length} request${currentRequests.length === 1 ? "" : "s"}`;
  $("#requestCountBadge").textContent = requests.length;
  $("#conflictCount").textContent = `${conflicts.length} conflict${conflicts.length === 1 ? "" : "s"}`;
  $("#panelConflictCount").textContent = conflicts.length;
  $("#coverageCount").textContent = `${new Set(currentRequests.map(r => r.sector)).size} sectors`;
  $("#readinessValue").textContent = `${readiness}%`;
  $("#readinessBar").style.width = `${readiness}%`;
  $("#autoScheduleBtn").disabled = conflicts.length === 0;

  const notice = $("#scheduleNotice");
  if (conflicts.length) {
    notice.classList.remove("clear");
    $("#scheduleNoticeTitle").textContent = `${conflicts.length} scheduling conflict${conflicts.length === 1 ? "" : "s"} need attention`;
    $("#scheduleNoticeText").textContent = "Review the conflict queue or run the auto-scheduler to find safe alternative times.";
    $("#noticeAutoBtn").disabled = false;
  } else {
    notice.classList.add("clear");
    $("#scheduleNoticeTitle").textContent = "Schedule is ready to issue";
    $("#scheduleNoticeText").textContent = "All requests fit the track windows and engineer availability.";
    $("#noticeAutoBtn").disabled = true;
  }
}

function renderWeekCalendar() {
  const dates = Array.from({ length: 7 }, (_, index) => addDays(calendarWeekStart, index));
  const dateKeys = new Set(dates.map(dateKey));
  const weekRequests = requests.filter(request => dateKeys.has(request.date));
  const weeklyConflicts = dates.flatMap(date => getConflicts(weekRequests.filter(request => request.date === dateKey(date))));
  const weekConflictIds = new Set(weeklyConflicts.flatMap(conflict => [conflict.a.id, conflict.b.id]));
  const weekEnd = dates[6];
  const sameMonth = calendarWeekStart.getMonth() === weekEnd.getMonth();
  const startLabel = calendarWeekStart.toLocaleDateString("en-SG", { day: "numeric", ...(sameMonth ? {} : { month: "short" }) });
  const endLabel = weekEnd.toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });

  $("#weekRangeLabel").textContent = `${startLabel}–${endLabel}`;
  $("#weekJobCount").textContent = weekRequests.length;
  $("#weekConflictCount").textContent = weeklyConflicts.length;
  $("#weekSectorCount").textContent = new Set(weekRequests.map(request => request.sector)).size;

  const todayKey = dateKey(new Date());
  const selectedKey = dateKey(currentDate);
  $("#weekGrid").innerHTML = dates.map(date => {
    const key = dateKey(date);
    const dayJobs = weekRequests.filter(request => request.date === key).sort((a, b) => a.start - b.start);
    const jobsMarkup = dayJobs.length ? dayJobs.map(job => {
      const hasConflict = weekConflictIds.has(job.id);
      return `<button class="week-job ${hasConflict ? "has-conflict" : ""}" style="--job-color:${priorityColor(job.priority)}" type="button" data-calendar-date="${key}" aria-label="Open ${escapeHtml(job.title)} on ${date.toLocaleDateString("en-SG")}">
        <span class="week-job-time">${formatRange(job)}</span><strong>${escapeHtml(job.title)}</strong><span class="week-job-meta">${escapeHtml(job.sector)} · ${escapeHtml(job.engineer)}</span>${hasConflict ? '<span class="calendar-alert" aria-label="Conflict">!</span>' : ""}
      </button>`;
    }).join("") : '<div class="empty-day">No work scheduled</div>';

    return `<article class="week-day ${key === todayKey ? "today" : ""} ${key === selectedKey ? "selected" : ""}">
      <div class="week-day-head"><div><span class="week-day-name">${date.toLocaleDateString("en-SG", { weekday: "short" })}</span><strong class="week-day-date">${date.toLocaleDateString("en-SG", { day: "numeric", month: "short" })}</strong></div><span class="day-count">${dayJobs.length}</span></div>
      <div class="week-job-list">${jobsMarkup}</div>
      <button class="open-day" type="button" data-open-date="${key}">Open day schedule</button>
    </article>`;
  }).join("");

  $$('[data-calendar-date]').forEach(button => button.addEventListener("click", () => openCalendarDay(button.dataset.calendarDate)));
  $$('[data-open-date]').forEach(button => button.addEventListener("click", () => openCalendarDay(button.dataset.openDate)));
}

function openCalendarDay(key) {
  currentDate = dateFromKey(key);
  updateDateLabel();
  renderAll();
  $("[data-nav='plan']").click();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}

function initials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase();
}

function refreshEngineerSelectors() {
  const select = $("#requestEngineerSelect");
  const previous = select.value;
  const assignable = staff.filter(person => person.availability !== "unavailable");
  select.innerHTML = assignable.length
    ? assignable.map(person => `<option value="${escapeHtml(person.name)}">${escapeHtml(person.name)} · ${escapeHtml(person.specialisation)}</option>`).join("")
    : '<option value="" disabled selected>No available staff</option>';
  if (assignable.some(person => person.name === previous)) select.value = previous;
}

function renderStaffPage() {
  const filter = $("#staffSpecialisationFilter");
  const previousFilter = filter.value || "all";
  filter.innerHTML = '<option value="all">All specialisations</option>' + Object.keys(specialisations).map(name => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join("");
  filter.value = Object.hasOwn(specialisations, previousFilter) ? previousFilter : "all";

  const visibleStaff = filter.value === "all" ? staff : staff.filter(person => person.specialisation === filter.value);
  $("#totalStaffCount").textContent = staff.length;
  $("#availableStaffCount").textContent = staff.filter(person => person.availability === "available").length;
  $("#staffSkillsCount").textContent = new Set(staff.map(person => person.specialisation)).size;
  $("#staffCountBadge").textContent = staff.length;

  const list = $("#staffList");
  const empty = $("#emptyStaff");
  if (!visibleStaff.length) {
    list.classList.add("hidden");
    empty.classList.remove("hidden");
  } else {
    list.classList.remove("hidden");
    empty.classList.add("hidden");
    list.innerHTML = visibleStaff.map(person => {
      const jobCount = requests.filter(request => request.engineer === person.name).length;
      const chips = person.capabilities?.length
        ? person.capabilities.map(capability => `<span class="capability-chip">${escapeHtml(capability)}</span>`).join("")
        : '<span class="capability-chip">No capabilities recorded</span>';
      const statusLabel = person.availability === "available" ? "Available tonight" : person.availability === "assigned" ? "Already assigned" : "Unavailable";
      return `<article class="staff-item">
        <span class="staff-person-avatar">${escapeHtml(initials(person.name))}</span>
        <div><strong class="staff-name">${escapeHtml(person.name)}</strong><span class="staff-specialisation">${escapeHtml(person.specialisation)} · ${jobCount} scheduled job${jobCount === 1 ? "" : "s"}</span><span class="staff-status ${person.availability}">${statusLabel}</span></div>
        <div class="staff-capabilities">${chips}</div>
        <div class="staff-actions"><button class="staff-action edit-staff" type="button" data-staff-id="${person.id}">Edit</button><button class="staff-action remove remove-staff" type="button" data-staff-id="${person.id}">Remove</button></div>
      </article>`;
    }).join("");
    $$(".edit-staff").forEach(button => button.addEventListener("click", () => openStaffModal(button.dataset.staffId)));
    $$(".remove-staff").forEach(button => button.addEventListener("click", () => removeStaffMember(button.dataset.staffId)));
  }

  $("#specialisationGuide").innerHTML = Object.entries(specialisations).map(([name, detail]) => `<article class="guide-item" style="--guide-color:${detail.color}"><strong>${escapeHtml(name)}</strong><p>${escapeHtml(detail.description)}</p></article>`).join("");
  refreshEngineerSelectors();
}

function openStaffModal(staffId = null) {
  activeStaffId = staffId;
  const person = staff.find(item => item.id === staffId);
  $("#staffModalTitle").textContent = person ? "Edit staff member" : "Add staff member";
  $("#staffNameInput").value = person?.name || "";
  $("#staffSpecialisationSelect").innerHTML = Object.keys(specialisations).map(name => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join("");
  $("#staffSpecialisationSelect").value = person?.specialisation || Object.keys(specialisations)[0];
  $("#staffAvailabilitySelect").value = person?.availability || "available";
  $("#staffCapabilityOptions").innerHTML = capabilityChoices.map(capability => `<label class="capability-option"><input type="checkbox" name="staffCapability" value="${escapeHtml(capability)}" ${person?.capabilities?.includes(capability) ? "checked" : ""}><span>${escapeHtml(capability)}</span></label>`).join("");
  $("#staffValidation").classList.add("hidden");
  $("#staffModal").classList.remove("hidden");
  setTimeout(() => $("#staffNameInput").focus(), 30);
}

function closeStaffModal() {
  $("#staffModal").classList.add("hidden");
  activeStaffId = null;
  $("#staffForm").reset();
  $("#staffValidation").classList.add("hidden");
}

function showStaffValidation(message) {
  $("#staffValidation").textContent = message;
  $("#staffValidation").classList.remove("hidden");
}

function saveStaffMember(event) {
  event.preventDefault();
  const name = $("#staffNameInput").value.trim();
  const capabilities = $$('#staffCapabilityOptions input[name="staffCapability"]:checked').map(input => input.value);
  const duplicate = staff.some(person => person.id !== activeStaffId && person.name.toLowerCase() === name.toLowerCase());
  if (duplicate) {
    showStaffValidation("A staff member with this name already exists.");
    return;
  }
  if (!capabilities.length) {
    showStaffValidation("Select at least one capability for this staff member.");
    return;
  }

  const record = { name, specialisation: $("#staffSpecialisationSelect").value, availability: $("#staffAvailabilitySelect").value, capabilities };
  if (activeStaffId) {
    const person = staff.find(item => item.id === activeStaffId);
    const previousName = person.name;
    Object.assign(person, record);
    if (previousName !== name) requests.forEach(request => { if (request.engineer === previousName) request.engineer = name; });
    toast(`${name}'s staff record has been updated.`, "success");
  } else {
    const nextNumber = Math.max(0, ...staff.map(person => Number(person.id.split("-")[1]) || 0)) + 1;
    staff.push({ id: `STF-${String(nextNumber).padStart(3, "0")}`, ...record });
    toast(`${name} has been added to the maintenance roster.`, "success");
  }
  persistState();
  closeStaffModal();
  renderAll();
}

function removeStaffMember(staffId) {
  const person = staff.find(item => item.id === staffId);
  if (!person) return;
  const assignedJobs = requests.filter(request => request.engineer === person.name);
  if (assignedJobs.length) {
    toast(`${person.name} is assigned to ${assignedJobs.length} job${assignedJobs.length === 1 ? "" : "s"}. Reassign those jobs before removing this staff member.`, "warning");
    return;
  }
  if (!window.confirm(`Remove ${person.name} from the staff roster?`)) return;
  staff = staff.filter(item => item.id !== staffId);
  persistState();
  renderAll();
  toast(`${person.name} has been removed from the roster.`, "warning");
}

function renderAll() {
  renderTimeline();
  renderList();
  renderConflicts();
  updateSummary();
  renderWeekCalendar();
  renderStaffPage();
}

function applySuggestion(id, start, quiet = false) {
  const item = requests.find(r => r.id === id);
  if (!item) return;
  const duration = item.end - item.start;
  item.start = start;
  item.end = start + duration;
  persistState();
  renderAll();
  if (!quiet) toast(`${id} moved to ${formatRange(item)}. Conflict rechecked.`, "success");
}

function conflictsForAssignment(item, start, engineer) {
  const duration = item.end - item.start;
  const trial = { ...item, start, end: start + duration, engineer };
  const otherJobs = requests.filter(request => request.date === item.date && request.id !== item.id);
  return getConflicts([...otherJobs, trial]).filter(conflict => conflict.a.id === item.id || conflict.b.id === item.id);
}

function buildManualRecommendations(conflict) {
  const priorityWeight = { critical: 12, high: 7, standard: 3, routine: 3 };
  const eligibleEngineers = staff.filter(person => person.availability !== "unavailable").map(person => person.name);
  const options = [];

  [conflict.a, conflict.b].forEach(item => {
    const duration = item.end - item.start;
    const engineers = [...new Set([item.engineer, ...eligibleEngineers])];
    const startOptions = [item.start];
    for (let start = 0; start + duration <= 5; start += .5) if (!startOptions.includes(start)) startOptions.push(start);
    for (const start of startOptions) {
      engineers.forEach(engineer => {
        const timeChanged = start !== item.start;
        const engineerChanged = engineer !== item.engineer;
        if (!timeChanged && !engineerChanged) return;
        if (conflictsForAssignment(item, start, engineer).length) return;

        const shiftMinutes = Math.round(Math.abs(start - item.start) * 60);
        const method = timeChanged && engineerChanged ? "Time + engineer" : timeChanged ? "Time change" : "Engineer change";
        const score = (priorityWeight[item.priority] || 3) + shiftMinutes / 6 + (engineerChanged ? 4 : 0) + (timeChanged && engineerChanged ? 3 : 0);
        const impact = !timeChanged
          ? `Keeps ${formatRange(item)} and assigns ${engineer}`
          : !engineerChanged
            ? `Keeps ${item.engineer} and shifts the job by ${shiftMinutes} minutes`
            : `Shifts by ${shiftMinutes} minutes and assigns ${engineer}`;
        options.push({ targetId: item.id, start, engineer, method, score, impact, range: `${formatTime(start)}–${formatTime(start + duration)}` });
      });
    }
  });

  options.sort((a, b) => a.score - b.score || a.targetId.localeCompare(b.targetId));
  const selected = [];
  for (const option of options) {
    if (!selected.some(chosen => chosen.method === option.method)) selected.push(option);
    if (selected.length === 3) break;
  }
  for (const option of options) {
    if (selected.length === 3) break;
    if (!selected.includes(option)) selected.push(option);
  }
  return selected;
}

function renderManualRecommendations(conflict) {
  const options = buildManualRecommendations(conflict);
  const list = $("#manualRecommendationList");
  if (!options.length) {
    list.innerHTML = '<div class="no-recommendation"><strong>No safe option fits this engineering window.</strong><span>Move one job to another night using the weekly calendar.</span></div>';
    return;
  }

  list.innerHTML = options.map((option, index) => `<article class="recommendation-option ${index === 0 ? "best" : ""}">
    <div class="recommendation-copy"><span class="recommendation-rank">${index === 0 ? "Best option" : `Option ${index + 1}`}</span><strong>${option.method}: ${option.targetId}</strong><small>${option.range} · ${escapeHtml(option.engineer)}</small><p>${escapeHtml(option.impact)}</p></div>
    <button class="recommendation-apply" type="button" data-rec-target="${option.targetId}" data-rec-start="${option.start}" data-rec-engineer="${escapeHtml(option.engineer)}">Apply option</button>
  </article>`).join("");
  $$(".recommendation-apply").forEach(button => button.addEventListener("click", () => applyRecommendedResolution(button.dataset.recTarget, Number(button.dataset.recStart), button.dataset.recEngineer)));
}

function applyRecommendedResolution(targetId, start, engineer) {
  const item = requests.find(request => request.id === targetId);
  if (!item) return;
  const duration = item.end - item.start;
  if (conflictsForAssignment(item, start, engineer).length) {
    showManualValidation("This option is no longer conflict-free. Refresh the review and choose another recommendation.");
    return;
  }
  item.start = start;
  item.end = start + duration;
  item.engineer = engineer;
  persistState();
  closeManualReview();
  renderAll();
  const remainingCount = getConflicts().length;
  const nextStep = remainingCount ? ` ${remainingCount} conflict${remainingCount === 1 ? "" : "s"} remain in the queue.` : " The engineering night is now conflict-free.";
  toast(`${item.id} optimised to ${formatRange(item)} with ${item.engineer}.${nextStep}`, "success");
}

function openManualReview(conflictKey) {
  const conflict = getConflicts().find(item => item.key === conflictKey);
  if (!conflict) {
    toast("That conflict has already been resolved.", "success");
    return;
  }

  activeManualConflictKey = conflictKey;
  const move = findMoveForConflict(conflict);
  const timingDetail = conflict.kind === "overlap"
    ? `Their current windows overlap between ${formatTime(Math.max(conflict.a.start, conflict.b.start))} and ${formatTime(Math.min(conflict.a.end, conflict.b.end))}.`
    : "Leave at least 30 minutes between the end of one job and the start of the other.";
  $("#manualConflictSummary").innerHTML = `<strong>${conflict.a.id} × ${conflict.b.id}</strong><p>${conflict.reason} ${timingDetail}</p>`;
  renderManualRecommendations(conflict);
  $("#manualTargetSelect").innerHTML = [conflict.a, conflict.b].map(item => `<option value="${item.id}">${item.id} · ${item.title}</option>`).join("");
  $("#manualTargetSelect").value = move?.target.id || conflict.b.id;
  updateManualReviewFields();
  clearManualValidation();
  $("#manualReviewModal").classList.remove("hidden");
  setTimeout(() => $("#manualTargetSelect").focus(), 30);
}

function updateManualReviewFields() {
  const item = requests.find(request => request.id === $("#manualTargetSelect").value);
  if (!item) return;

  const duration = item.end - item.start;
  const timeOptions = ['<option value="keep">Keep current time</option>'];
  for (let start = 0; start + duration <= 5; start += .5) {
    if (start !== item.start) timeOptions.push(`<option value="${start}">${formatTime(start)}–${formatTime(start + duration)}</option>`);
  }
  $("#manualStartSelect").innerHTML = timeOptions.join("");
  // Specialisation is advisory during manual review: any rostered engineer who is not unavailable may be selected.
  const availableEngineers = staff.filter(person => person.availability !== "unavailable" && person.name !== item.engineer);
  $("#manualEngineerSelect").innerHTML = ['<option value="keep">Keep current engineer</option>', ...availableEngineers.map(person => `<option value="${escapeHtml(person.name)}">${escapeHtml(person.name)} · ${person.availability === "available" ? "Available" : "Assigned elsewhere"}</option>`)].join("");
  $("#manualCurrentDetails").innerHTML = `<strong>Current assignment:</strong> ${item.sector} · ${formatRange(item)} · ${item.engineer} · ${item.priority} priority`;
  $("#removeManualBtn").textContent = `Remove ${item.id} from tonight`;
  clearManualValidation();
}

function showManualValidation(message, success = false) {
  const box = $("#manualValidation");
  box.textContent = message;
  box.classList.remove("hidden");
  box.classList.toggle("success", success);
}

function clearManualValidation() {
  $("#manualValidation").classList.add("hidden");
  $("#manualValidation").classList.remove("success");
}

function previewManualDecision() {
  const item = requests.find(request => request.id === $("#manualTargetSelect").value);
  if (!item) return;
  const selectedStart = $("#manualStartSelect").value;
  const selectedEngineer = $("#manualEngineerSelect").value;
  if (selectedStart === "keep" && selectedEngineer === "keep") {
    clearManualValidation();
    return;
  }
  const start = selectedStart === "keep" ? item.start : Number(selectedStart);
  const engineer = selectedEngineer === "keep" ? item.engineer : selectedEngineer;
  const remaining = conflictsForAssignment(item, start, engineer);
  if (remaining.length) showManualValidation(`Still conflicting: ${remaining[0].reason}`);
  else showManualValidation(`Conflict-free preview: ${formatTime(start)}–${formatTime(start + item.end - item.start)} with ${engineer}.`, true);
}

function closeManualReview() {
  $("#manualReviewModal").classList.add("hidden");
  activeManualConflictKey = null;
  clearManualValidation();
}

function applyManualDecision(event) {
  event.preventDefault();
  const item = requests.find(request => request.id === $("#manualTargetSelect").value);
  if (!item) return;

  const newStart = $("#manualStartSelect").value;
  const newEngineer = $("#manualEngineerSelect").value;
  if (newStart === "keep" && newEngineer === "keep") {
    showManualValidation("Choose a different time, a different engineer, or remove the job from tonight.");
    return;
  }

  const previous = { start: item.start, end: item.end, engineer: item.engineer };
  const duration = item.end - item.start;
  if (newStart !== "keep") {
    item.start = Number(newStart);
    item.end = item.start + duration;
  }
  if (newEngineer !== "keep") item.engineer = newEngineer;

  const remaining = getConflicts().filter(conflict => conflict.a.id === item.id || conflict.b.id === item.id);
  if (remaining.length) {
    item.start = previous.start;
    item.end = previous.end;
    item.engineer = previous.engineer;
    showManualValidation(`This decision still conflicts: ${remaining[0].reason} Choose another option.`);
    return;
  }

  const updatedId = item.id;
  const updatedDetails = `${formatRange(item)} with ${item.engineer}`;
  persistState();
  closeManualReview();
  renderAll();
  toast(`${updatedId} updated to ${updatedDetails}. The conflict is resolved.`, "success");
}

function removeManualRequest() {
  const id = $("#manualTargetSelect").value;
  if (!requests.some(request => request.id === id)) return;
  requests = requests.filter(request => request.id !== id);
  persistState();
  closeManualReview();
  renderAll();
  toast(`${id} removed from tonight's plan and returned for rescheduling.`, "warning");
}

function runAutoSchedule() {
  const button = $("#autoScheduleBtn");
  if (!getConflicts().length) return;
  button.classList.add("loading");
  button.innerHTML = `<span>Finding best windows…</span><i>↻</i>`;
  setTimeout(() => {
    let safety = 0;
    while (getConflicts().length && safety < 20) {
      const move = getConflicts().map(findMoveForConflict).find(Boolean);
      if (!move) break;
      const { target, candidate } = move;
      const duration = target.end - target.start;
      target.start = candidate.start;
      target.end = candidate.start + duration;
      safety++;
    }
    persistState();
    button.classList.remove("loading");
    button.innerHTML = `<span>Run auto-scheduler</span><i>→</i>`;
    renderAll();
    const left = getConflicts().length;
    toast(left ? `${left} conflict${left === 1 ? "" : "s"} still require manual review.` : "Schedule optimised. All conflicts are resolved.", left ? "warning" : "success");
  }, 900);
}

function showRequestToast(id) {
  const item = requests.find(r => r.id === id);
  if (item) {
    const conflictIds = getConflictIds(requests.filter(request => request.date === item.date));
    toast(`${item.id} · ${item.title} · ${item.engineer} · ${formatRange(item)}`, conflictIds.has(id) ? "warning" : "success");
  }
}

function toast(message, type = "success") {
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${type === "success" ? "✓" : "!"}</span><div>${message}</div>`;
  $("#toastRegion").appendChild(el);
  setTimeout(() => el.remove(), 3800);
}

function setDate(delta) {
  currentDate.setDate(currentDate.getDate() + delta);
  calendarWeekStart = startOfWeek(currentDate);
  updateDateLabel();
  renderAll();
  toast(delta > 0 ? "Showing the next engineering night." : "Showing the previous engineering night.");
}

function updateDateLabel() {
  $("#displayDate").textContent = currentDate.toLocaleDateString("en-SG", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function openModal() {
  $("#requestDateInput").value = dateKey(currentDate);
  $("#requestModal").classList.remove("hidden");
  setTimeout(() => $("#requestForm input").focus(), 30);
}

function closeModal() {
  $("#requestModal").classList.add("hidden");
  $("#requestForm").reset();
}

function addRequest(event) {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const start = Number(data.get("start"));
  const duration = Number(data.get("duration"));
  const nextNumber = Math.max(...requests.map(r => Number(r.id.split("-")[1])), 320) + 1;
  const item = { id: `TRK-${nextNumber}`, date: data.get("date"), title: data.get("title").trim(), sector: data.get("sector"), start, end: start + duration, engineer: data.get("engineer"), type: data.get("type"), priority: data.get("priority") };
  requests.push(item);
  persistState();
  closeModal();
  renderAll();
  const conflictIds = getConflictIds(requests.filter(request => request.date === item.date));
  toast(conflictIds.has(item.id) ? `${item.id} added and flagged for conflict review.` : `${item.id} added with no conflicts.`, conflictIds.has(item.id) ? "warning" : "success");
}

function exportPlan() {
  const currentRequests = getCurrentRequests();
  const conflicts = getConflicts().length;
  const rows = ["Date,Request,Sector,Start,End,Engineer,Priority,Status", ...currentRequests.map(r => `${r.date},"${r.id} - ${r.title}",${r.sector},${formatTime(r.start)},${formatTime(r.end)},"${r.engineer}",${r.priority},${getConflictIds().has(r.id) ? "Conflict" : "Clear"}`)];
  const blob = new Blob([rows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `trackflow-plan-${dateKey(currentDate)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  toast(`Plan exported${conflicts ? ` with ${conflicts} open conflict${conflicts === 1 ? "" : "s"}` : " and ready to issue"}.`, conflicts ? "warning" : "success");
}

$("#autoScheduleBtn").addEventListener("click", runAutoSchedule);
$("#noticeAutoBtn").addEventListener("click", runAutoSchedule);
$("#sectorFilter").addEventListener("change", event => { activeFilter = event.target.value; renderAll(); });
$("#prevDate").addEventListener("click", () => setDate(-1));
$("#nextDate").addEventListener("click", () => setDate(1));
$("#dateButton").addEventListener("click", () => {
  calendarWeekStart = startOfWeek(currentDate);
  renderWeekCalendar();
  $("[data-nav='calendar']").click();
});
$("#prevWeekBtn").addEventListener("click", () => { calendarWeekStart = addDays(calendarWeekStart, -7); renderWeekCalendar(); });
$("#nextWeekBtn").addEventListener("click", () => { calendarWeekStart = addDays(calendarWeekStart, 7); renderWeekCalendar(); });
$("#thisWeekBtn").addEventListener("click", () => { calendarWeekStart = startOfWeek(new Date()); renderWeekCalendar(); });
$("#newRequestBtn").addEventListener("click", openModal);
$("#closeModalBtn").addEventListener("click", closeModal);
$("#cancelModalBtn").addEventListener("click", closeModal);
$("#requestForm").addEventListener("submit", addRequest);
$("#requestModal").addEventListener("click", event => { if (event.target === $("#requestModal")) closeModal(); });
$("#closeManualBtn").addEventListener("click", closeManualReview);
$("#cancelManualBtn").addEventListener("click", closeManualReview);
$("#manualTargetSelect").addEventListener("change", updateManualReviewFields);
$("#manualStartSelect").addEventListener("change", previewManualDecision);
$("#manualEngineerSelect").addEventListener("change", previewManualDecision);
$("#manualReviewForm").addEventListener("submit", applyManualDecision);
$("#removeManualBtn").addEventListener("click", removeManualRequest);
$("#manualReviewModal").addEventListener("click", event => { if (event.target === $("#manualReviewModal")) closeManualReview(); });
$("#addStaffBtn").addEventListener("click", () => openStaffModal());
$("#closeStaffModalBtn").addEventListener("click", closeStaffModal);
$("#cancelStaffModalBtn").addEventListener("click", closeStaffModal);
$("#staffForm").addEventListener("submit", saveStaffMember);
$("#staffModal").addEventListener("click", event => { if (event.target === $("#staffModal")) closeStaffModal(); });
$("#staffSpecialisationFilter").addEventListener("change", renderStaffPage);
$("#exportBtn").addEventListener("click", exportPlan);
$(".mobile-menu").addEventListener("click", () => $(".sidebar").classList.toggle("open"));
document.addEventListener("keydown", event => { if (event.key === "Escape") { closeModal(); closeManualReview(); closeStaffModal(); } });

$$("[data-view]").forEach(button => button.addEventListener("click", () => {
  view = button.dataset.view;
  $$("[data-view]").forEach(b => b.classList.toggle("active", b === button));
  $("#timelineView").classList.toggle("hidden", view !== "timeline");
  $("#listView").classList.toggle("hidden", view !== "list");
}));

$$("[data-nav]").forEach(button => button.addEventListener("click", () => {
  $$("[data-nav]").forEach(b => b.classList.remove("active"));
  button.classList.add("active");
  const destination = button.dataset.nav;
  const staffMode = destination === "staff";
  const calendarMode = destination === "calendar";
  $("#schedulePage").classList.toggle("hidden", staffMode || calendarMode);
  $("#calendarPage").classList.toggle("hidden", !calendarMode);
  $("#staffPage").classList.toggle("hidden", !staffMode);
  $$(".schedule-action").forEach(action => action.classList.toggle("hidden", staffMode));
  $("#addStaffBtn").classList.toggle("hidden", !staffMode);
  $("#pageEyebrow").textContent = staffMode ? "People and maintenance capability" : calendarMode ? "Seven-night planning view" : "Overnight engineering hours";
  $("#pageTitle").textContent = staffMode ? "Staff & skills" : calendarMode ? "Weekly calendar" : "Maintenance schedule";
  if (destination === "requests") $("[data-view='list']").click();
  else if (destination === "plan") $("[data-view='timeline']").click();
  else if (calendarMode) renderWeekCalendar();
  else renderStaffPage();
  $(".sidebar").classList.remove("open");
}));

updateDateLabel();
renderAll();
