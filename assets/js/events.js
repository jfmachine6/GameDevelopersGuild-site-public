export const FEED_URL = "https://gdg-notion.jfedders6.workers.dev";
export const SITE_TIME_ZONE = "America/New_York";
const dateOnly = /^\d{4}-\d{2}-\d{2}$/;

export function localDateKey(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: SITE_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(now);
  const value = (type) => parts.find((part) => part.type === type).value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}

export function timestamp(value, timeZone = null) {
  if (dateOnly.test(value) || /(?:Z|[+-]\d{2}:\d{2})$/i.test(value)) {
    return Date.parse(value);
  }
  if (!timeZone) throw new Error("An event timestamp is missing its time zone.");
  // Notion may supply a wall-clock timestamp with a separate IANA time zone.
  const wallTime = Date.parse(`${value}Z`);
  const milliseconds = ((wallTime % 1000) + 1000) % 1000;
  const wholeSeconds = wallTime - milliseconds;
  let instant = wholeSeconds;
  for (let attempt = 0; attempt < 3; attempt++) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23"
    }).formatToParts(new Date(instant));
    const part = (type) => parts.find((item) => item.type === type).value;
    const displayed = Date.parse(`${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}:${part("second")}Z`);
    instant += wholeSeconds - displayed;
  }
  return instant + milliseconds;
}

export function eventDay(value, timeZone) {
  return dateOnly.test(value) ? value : localDateKey(new Date(timestamp(value, timeZone)));
}

export function eventStatus(event, now = new Date()) {
  const end = event.date.end || event.date.start;
  const past = dateOnly.test(end)
    ? localDateKey(now) > end
    : now.getTime() > timestamp(end, event.date.timeZone);
  if (past) return "Past event";
  const started = dateOnly.test(event.date.start)
    ? localDateKey(now) >= event.date.start
    : now.getTime() >= timestamp(event.date.start, event.date.timeZone);
  return started ? "Current event" : "Upcoming event";
}

export function featuredEvent(events, now = new Date()) {
  return events.filter((event) => eventStatus(event, now) !== "Past event")
    .sort((a, b) => timestamp(a.date.start, a.date.timeZone) - timestamp(b.date.start, b.date.timeZone))[0];
}

export function formatDate(value, timeZone = null) {
  const allDay = dateOnly.test(value);
  return new Intl.DateTimeFormat("en-US", {
    month: "long", day: "numeric", year: "numeric",
    timeZone: allDay ? "UTC" : SITE_TIME_ZONE,
    ...(allDay ? {} : { hour: "numeric", minute: "2-digit", timeZoneName: "short" })
  }).format(new Date(timestamp(value, timeZone)));
}

export function eventLink(event) {
  return `./event.html?id=${encodeURIComponent(event.id)}`;
}

export function safeUrl(value) {
  const url = new URL(value);
  if (!["https:", "http:"].includes(url.protocol)) throw new Error("Unsupported content URL.");
  return url.href;
}

function validateContent(blocks, depth = 0) {
  if (!Array.isArray(blocks) || depth > 10) throw new Error("Invalid feed content.");
  for (const block of blocks) {
    if (["paragraph", "heading_1", "heading_2", "heading_3", "bulleted_list_item",
      "numbered_list_item", "quote", "callout", "code"].includes(block.type)) {
      validateRuns(block.text);
    } else if (block.type === "image" || block.type === "link") {
      safeUrl(block.url);
      validateRuns(block.caption);
    } else if (block.type !== "divider") {
      throw new Error("Unsupported feed content.");
    }
    if (block.children) validateContent(block.children, depth + 1);
  }
}

function validateRuns(runs) {
  if (!Array.isArray(runs)) throw new Error("Invalid feed text.");
  runs.forEach((run) => {
    if (typeof run.text !== "string") throw new Error("Invalid feed text.");
    if (run.href) safeUrl(run.href);
  });
}

export async function loadFeed(kind) {
  if (!["events", "history", "members"].includes(kind)) throw new Error("Unknown feed.");
  const response = await fetch(`${FEED_URL}/${kind}`, {
    cache: "no-store", signal: AbortSignal.timeout(20000)
  });
  if (!response.ok) throw new Error(`The ${kind} feed returned HTTP ${response.status}.`);
  const payload = await response.json();
  if (!Array.isArray(payload[kind])) throw new Error("Invalid feed response.");
  const ids = new Set();
  for (const record of payload[kind]) {
    if (typeof record.id !== "string" || !record.id || ids.has(record.id) ||
        typeof record.title !== "string" || !record.title.trim()) {
      throw new Error("Invalid feed entry.");
    }
    ids.add(record.id);
    validateContent(record.content);
    if (kind === "events") {
      if (!record.date || typeof record.date.start !== "string" ||
          (record.date.end != null && typeof record.date.end !== "string") ||
          (record.date.timeZone != null && typeof record.date.timeZone !== "string") ||
          (record.type != null && typeof record.type !== "string")) throw new Error("Invalid event.");
      const start = timestamp(record.date.start, record.date.timeZone);
      const end = timestamp(record.date.end || record.date.start, record.date.timeZone);
      if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) throw new Error("Invalid event dates.");
    } else if (kind === "history") {
      if (!Array.isArray(record.eventIds) || !record.eventIds.every((id) => typeof id === "string") ||
          !Array.isArray(record.thumbnails)) throw new Error("Invalid history entry.");
      record.thumbnails.forEach((image) => safeUrl(image.url));
    } else {
      if (!Array.isArray(record.photos) || !Array.isArray(record.roles) ||
          !record.roles.every((role) => typeof role === "string") ||
          (record.graduationSemester !== null && typeof record.graduationSemester !== "string")) {
        throw new Error("Invalid member profile.");
      }
      record.photos.forEach((photo) => safeUrl(photo.url));
    }
  }
  return kind === "events"
    ? payload.events.sort((a, b) => timestamp(a.date.start, a.date.timeZone) - timestamp(b.date.start, b.date.timeZone))
    : [...payload[kind]].sort((a, b) => a.title.localeCompare(b.title));
}
