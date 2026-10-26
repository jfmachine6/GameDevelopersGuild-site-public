import { loadFeed, localDateKey, eventDay, eventStatus, featuredEvent, formatDate, eventLink } from "./events.js";
import { element, link, dateRange, renderContent, showError } from "./feed-render.js";

const current = document.querySelector("#current-event");
const calendar = document.querySelector("#semester-calendar");
const agenda = document.querySelector("#semester-agenda");
const detail = document.querySelector("#event-detail");
const feedStatus = document.querySelector("#feed-status");

function summary(event) {
  const card = element("article", null, "agenda-event");
  card.append(element("p", eventStatus(event), "event-status"));
  const heading = element("h3");
  heading.append(link(event.title, eventLink(event)));
  card.append(heading, dateRange(event));
  if (event.type) card.append(element("p", event.type));
  card.append(link("View event details", eventLink(event)));
  return card;
}

function renderFeatured(events) {
  const event = featuredEvent(events);
  const heading = element("h2");
  heading.id = "current-event-title";
  current.replaceChildren();
  if (event) {
    heading.append(link(event.title, eventLink(event)));
    current.append(element("p", eventStatus(event), "eyebrow"), heading, dateRange(event));
    if (event.type) current.append(element("p", event.type));
    current.append(link("Event details", eventLink(event), "button button--gold"));
  } else {
    heading.textContent = "No upcoming events listed";
    current.append(heading, element("p", "Check the calendar for updates."));
  }
  current.append(link("Calendar & Events", "./calendar.html", "button button--quiet"));
}

function renderCalendar(events) {
  const today = localDateKey();
  const months = new Set();
  // Keep the current semester visible, including months without published events.
  const year = Number(today.slice(0, 4));
  const month = Number(today.slice(5, 7)) - 1;
  const start = month < 5 ? 0 : month < 8 ? 5 : 8;
  const end = start === 0 ? 4 : start === 5 ? 7 : 11;
  for (let index = start; index <= end; index++) months.add(`${year}-${String(index + 1).padStart(2, "0")}`);
  events.forEach((event) => {
    const first = eventDay(event.date.start, event.date.timeZone).slice(0, 7);
    const last = eventDay(event.date.end || event.date.start, event.date.timeZone).slice(0, 7);
    const cursor = new Date(`${first}-01T12:00:00Z`);
    while (cursor.toISOString().slice(0, 7) <= last) {
      months.add(cursor.toISOString().slice(0, 7));
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }
  });
  calendar.replaceChildren();
  agenda.replaceChildren();
  [...months].sort().forEach((prefix) => {
    const [year, month] = prefix.split("-").map(Number);
    const monthName = new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
    const monthEvents = events.filter((event) =>
      eventDay(event.date.start, event.date.timeZone).slice(0, 7) <= prefix &&
      eventDay(event.date.end || event.date.start, event.date.timeZone).slice(0, 7) >= prefix);
    const agendaMonth = element("section", null, "agenda-month");
    agendaMonth.append(element("h2", monthName));
    if (!monthEvents.length) agendaMonth.append(element("p", "No events announced.", "events-note"));
    monthEvents.forEach((event) => agendaMonth.append(summary(event)));
    agenda.append(agendaMonth);

    const calendarMonth = element("section", null, "calendar-month");
    calendarMonth.append(element("h2", monthName));
    const scroll = element("div", null, "calendar-scroll");
    scroll.tabIndex = 0;
    scroll.setAttribute("role", "region");
    scroll.setAttribute("aria-label", `${monthName} calendar, scroll horizontally on small screens`);
    const weekdays = element("div", null, "calendar-weekdays");
    weekdays.setAttribute("aria-hidden", "true");
    ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].forEach((day) => weekdays.append(element("span", day)));
    const grid = element("div", null, "calendar-grid");
    const blank = () => {
      const cell = element("div", null, "calendar-day calendar-day--empty");
      cell.setAttribute("aria-hidden", "true");
      grid.append(cell);
    };
    for (let index = 0; index < new Date(Date.UTC(year, month - 1, 1)).getUTCDay(); index++) blank();
    const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
    for (let day = 1; day <= days; day++) {
      const date = `${prefix}-${String(day).padStart(2, "0")}`;
      const cell = element("div", null, `calendar-day${date === today ? " calendar-day--today" : ""}`);
      const time = element("time", String(day));
      time.dateTime = date;
      time.setAttribute("aria-label", formatDate(date));
      if (date === today) time.setAttribute("aria-current", "date");
      cell.append(time);
      monthEvents.filter((event) => eventDay(event.date.start, event.date.timeZone) <= date &&
        eventDay(event.date.end || event.date.start, event.date.timeZone) >= date)
        .forEach((event) => cell.append(link(event.title, eventLink(event), "calendar-event")));
      grid.append(cell);
    }
    while (grid.children.length % 7) blank();
    scroll.append(weekdays, grid);
    calendarMonth.append(scroll);
    calendar.append(calendarMonth);
  });
}

function renderDetail(events) {
  const id = new URLSearchParams(window.location.search).get("id");
  // Preserve links shared before the Notion feed was connected.
  const event = events.find((item) => item.id === (id === "scream-jam-2026" ? "405b81b5-eea9-80a5-9eef-d042be47aa0a" : id));
  if (!event) {
    document.title = "Event not found | Game Developers Guild";
    const heading = element("h1", "Event not found");
    heading.id = "event-title";
    detail.replaceChildren(heading, element("p", "This event is not currently published."), link("Browse the calendar", "./calendar.html"));
    return;
  }
  document.title = `${event.title} | Game Developers Guild`;
  const heading = element("h1", event.title);
  heading.id = "event-title";
  const body = element("div", null, "published-content");
  renderContent(body, event.content);
  if (!event.content.length) body.append(element("p", "More event details will be posted here."));
  detail.replaceChildren(element("p", eventStatus(event), "event-status"), heading, dateRange(event));
  if (event.type) detail.append(element("p", event.type));
  detail.append(body);
  const related = element("section");
  related.append(element("h2", "Event history"), element("p", "Loading related entries…", "events-note"));
  detail.append(related);
  loadFeed("history").then((history) => {
    related.replaceChildren(element("h2", "Event history"));
    const entries = history.filter((entry) => entry.eventIds.includes(event.id));
    if (!entries.length) related.append(element("p", "No published history entries yet."));
    entries.forEach((entry) => related.append(link(entry.title, `./history.html?id=${encodeURIComponent(entry.id)}`, "history-link")));
  }).catch((error) => showError(related, error));
}

const controls = document.querySelectorAll("[data-view]");
controls.forEach((button) => button.addEventListener("click", () => {
  const calendarView = button.dataset.view === "calendar";
  calendar.hidden = !calendarView;
  agenda.hidden = calendarView;
  controls.forEach((control) => control.setAttribute("aria-pressed", String(control === button)));
}));

if (current || calendar || detail) {
  loadFeed("events").then((events) => {
    if (current) renderFeatured(events);
    if (calendar && agenda) renderCalendar(events);
    if (detail) renderDetail(events);
    if (feedStatus) feedStatus.textContent = events.length ? "Published events. Times shown in NKU's Eastern time zone." : "No events are currently published.";
  }).catch((error) => {
    if (current) showError(current, error, "current-event-title");
    if (detail) showError(detail, error, "event-title");
    if (feedStatus) showError(feedStatus, error);
  });
}
