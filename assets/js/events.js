export const semester = { name: "Fall 2026", year: 2026, months: [8, 9, 10, 11] };

export const events = [
  {
    id: "scream-jam-2026",
    title: "SCREAM JAM 2026",
    start: "2026-10-16",
    end: "2026-10-23",
    description: "A week-long horror-themed Game Jam hosted by SCREAM ZONE. Beginners and experienced developers are welcome, with no required theme beyond the open-ended horror direction.",
    participation: "The Game Developers Guild plans to participate. Team arrangements, club meeting times, and other participation details are coming soon.",
    location: "Online on itch.io; club arrangements coming soon",
    officialUrl: "https://itch.io/jam/scream-jam-2026",
    notes: [
      "Submissions are open Friday, October 16 through Friday, October 23, 2026. Check the official page for the deadline in your time zone.",
      "Most development should happen during the jam week. Any game engine may be used.",
      "Follow the organizer's rules and asset permissions. The official rules prohibit generative AI content.",
      "Participant voting continues after submissions close, through October 30."
    ]
  }
];

export function localDateKey(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(now);
  const value = (type) => parts.find((part) => part.type === type).value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}

export function eventStatus(event, today = localDateKey()) {
  if (today > event.end) return "Past event";
  return today >= event.start ? "Current event" : "Upcoming event";
}

export function featuredEvent(today = localDateKey()) {
  return events.filter((event) => event.end >= today)
    .sort((first, second) => first.start.localeCompare(second.start))[0];
}

export function formatDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long", day: "numeric", year: "numeric", timeZone: "UTC"
  }).format(new Date(`${date}T12:00:00Z`));
}

export function eventLink(event) {
  return `./event.html?id=${encodeURIComponent(event.id)}`;
}

export function dateRange(event) {
  return `<time datetime="${event.start}">${formatDate(event.start)}</time> – <time datetime="${event.end}">${formatDate(event.end)}</time>`;
}
