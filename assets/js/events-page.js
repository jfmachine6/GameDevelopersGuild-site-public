import { semester, events, localDateKey, eventStatus, featuredEvent, formatDate, eventLink, dateRange } from "./events.js";

const today = localDateKey();
const current = document.querySelector("#current-event");
const calendar = document.querySelector("#semester-calendar");
const agenda = document.querySelector("#semester-agenda");
const detail = document.querySelector("#event-detail");

if (current) {
  const event = featuredEvent(today);
  current.innerHTML = event
    ? `<p class="eyebrow">${eventStatus(event, today)}</p>
       <h2 id="current-event-title"><a href="${eventLink(event)}">${event.title}</a></h2>
       <p>${event.description}</p><p>${event.participation}</p>
       <dl class="event-facts"><div><dt>Dates</dt><dd>${dateRange(event)}</dd></div>
       <div><dt>Location</dt><dd>${event.location}</dd></div></dl>
       <div class="hero__links"><a class="button button--gold" href="${eventLink(event)}">Event details</a>
       <a class="button button--quiet" href="./calendar.html">View calendar</a></div>`
    : `<p class="eyebrow">Events</p><h2 id="current-event-title">No upcoming events listed</h2>
       <p>Check the calendar for updates.</p><a class="button button--quiet" href="./calendar.html">View calendar</a>`;
}

if (calendar && agenda) {
  calendar.innerHTML = semester.months.map((month) => {
    const monthName = new Date(semester.year, month, 1).toLocaleDateString("en-US", { month: "long" });
    const firstDay = new Date(semester.year, month, 1).getDay();
    const days = new Date(semester.year, month + 1, 0).getDate();
    const cells = Array.from({ length: firstDay }, () => '<div class="calendar-day calendar-day--empty" aria-hidden="true"></div>');
    for (let day = 1; day <= days; day++) {
      const date = `${semester.year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const dayEvents = events.filter((event) => event.start <= date && event.end >= date);
      cells.push(`<div class="calendar-day${date === today ? " calendar-day--today" : ""}">
        <time datetime="${date}" aria-label="${formatDate(date)}"${date === today ? ' aria-current="date"' : ""}>${day}</time>
        ${dayEvents.map((event) => `<a class="calendar-event" href="${eventLink(event)}">${event.title}
          <small>${date === event.start ? "Starts" : date === event.end ? "Submission deadline" : "In progress"}</small></a>`).join("")}</div>`);
    }
    while (cells.length % 7) cells.push('<div class="calendar-day calendar-day--empty" aria-hidden="true"></div>');
    return `<section class="calendar-month"><h2>${monthName} ${semester.year}</h2>
      <div class="calendar-scroll" tabindex="0" role="region" aria-label="${monthName} calendar, scroll horizontally on small screens">
      <div class="calendar-weekdays" aria-hidden="true">${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => `<span>${day}</span>`).join("")}</div>
      <div class="calendar-grid">${cells.join("")}</div></div></section>`;
  }).join("");

  agenda.innerHTML = semester.months.map((month) => {
    const monthName = new Date(semester.year, month, 1).toLocaleDateString("en-US", { month: "long" });
    const prefix = `${semester.year}-${String(month + 1).padStart(2, "0")}`;
    const monthEvents = events.filter((event) => event.start.slice(0, 7) <= prefix && event.end.slice(0, 7) >= prefix);
    return `<section class="agenda-month"><h2>${monthName}</h2>${monthEvents.length
      ? monthEvents.map((event) => `<article class="agenda-event"><div class="event-status">${eventStatus(event, today)}</div>
        <h3><a href="${eventLink(event)}">${event.title}</a></h3><p>${dateRange(event)}</p>
        <p>${event.participation}</p><a href="${eventLink(event)}">View event details</a></article>`).join("")
      : '<p class="events-note">No events announced.</p>'}</section>`;
  }).join("");

  const controls = document.querySelectorAll("[data-view]");
  controls.forEach((button) => button.addEventListener("click", () => {
    const calendarView = button.dataset.view === "calendar";
    calendar.hidden = !calendarView;
    agenda.hidden = calendarView;
    controls.forEach((control) => control.setAttribute("aria-pressed", String(control === button)));
  }));
}

if (detail) {
  const event = events.find((item) => item.id === new URLSearchParams(window.location.search).get("id"));
  if (event) {
    document.title = `${event.title} | Game Developers Guild`;
    document.querySelector('meta[name="description"]').content = event.description;
    detail.innerHTML = `<header><p class="eyebrow">${semester.name} / Game Developers Guild</p>
      <p class="event-status">${eventStatus(event, today)}</p><h1 id="event-title">${event.title}</h1></header>
      <div class="event-detail__body"><div><h2>About the Game Jam</h2><p>${event.description}</p>
      <h2>Guild participation</h2><p class="participation-note">${event.participation}</p>
      <h2>Jam details</h2><ul>${event.notes.map((note) => `<li>${note}</li>`).join("")}</ul>
      <a class="button button--gold" href="${event.officialUrl}">Official jam page &amp; rules</a></div>
      <dl class="event-facts"><div><dt>Submission period</dt><dd>${dateRange(event)}</dd></div>
      <div><dt>Location</dt><dd>${event.location}</dd></div>
      <div><dt>Club schedule</dt><dd>Details coming soon</dd></div></dl></div>`;
  } else {
    document.title = "Event not found | Game Developers Guild";
    detail.innerHTML = '<h1 id="event-title">Event not found</h1><p>This event is not listed. <a href="./calendar.html">Browse the calendar</a>.</p>';
    console.warn("Event not found:", new URLSearchParams(window.location.search).get("id"));
  }
}
