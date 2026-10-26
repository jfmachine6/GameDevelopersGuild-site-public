import { loadFeed, safeUrl } from "./events.js";
import { element, link, renderContent, showError } from "./feed-render.js";

const container = document.querySelector("#history-content");
const selectedId = new URLSearchParams(window.location.search).get("id");

loadFeed("history").then((history) => {
  container.replaceChildren();
  const entries = selectedId ? history.filter((entry) => entry.id === selectedId) : history;
  if (!entries.length) {
    container.append(element("p", selectedId ? "This history entry is not currently published." : "No history entries are currently published."));
    return;
  }
  entries.forEach((entry) => {
    const article = element("article", null, "history-entry");
    const heading = element("h2");
    heading.append(link(entry.title, `./history.html?id=${encodeURIComponent(entry.id)}`));
    article.append(heading);
    if (selectedId) document.title = `${entry.title} | Game Developers Guild`;
    const gallery = element("div", null, "history-thumbnails");
    entry.thumbnails.forEach((thumbnail, index) => {
      const image = element("img");
      image.src = safeUrl(thumbnail.url);
      image.alt = `${entry.title} — image ${index + 1}`;
      image.loading = "lazy";
      image.addEventListener("error", () => {
        console.error("History thumbnail failed to load.");
        image.replaceWith(element("p", "Image unavailable. Reload to refresh the image link.", "feed-error"));
      });
      gallery.append(image);
    });
    article.append(gallery);
    const body = element("div", null, "published-content");
    renderContent(body, entry.content);
    if (!entry.content.length) body.append(element("p", "No additional details published yet."));
    article.append(body);
    if (entry.eventIds.length) {
      article.append(element("h3", "Related events"));
      entry.eventIds.forEach((id) => article.append(link("View related event", `./event.html?id=${encodeURIComponent(id)}`, "history-link")));
    }
    container.append(article);
  });
}).catch((error) => showError(container, error));
