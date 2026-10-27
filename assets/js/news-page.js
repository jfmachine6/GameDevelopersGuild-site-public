import { loadFeed, formatDate } from "./events.js";
import { element, link, renderContent, showError } from "./feed-render.js";

const container = document.querySelector("#news-content");
const title = document.querySelector("#news-title");
const selectedId = new URLSearchParams(window.location.search).get("id");

function articleFacts(article) {
  const facts = element("div", null, "news-facts");
  if (article.date) {
    const time = element("time", formatDate(article.date.start, article.date.timeZone));
    time.dateTime = article.date.start;
    facts.append(time);
  }
  if (article.authors.length) facts.append(element("p", `By ${article.authors.join(", ")}`));
  return facts;
}

loadFeed("news").then((news) => {
  container.replaceChildren();
  if (selectedId) {
    document.querySelector("#all-news").hidden = false;
    const article = news.find((item) => item.id === selectedId);
    if (!article) {
      title.textContent = "Article not found";
      document.title = "Article not found | Game Developers Guild";
      container.append(element("p", "This news article is not currently published."));
      return;
    }
    title.textContent = article.title;
    document.title = `${article.title} | Game Developers Guild`;
    const detail = element("article", null, "news-article");
    detail.setAttribute("aria-labelledby", "news-title");
    const body = element("div", null, "published-content");
    renderContent(body, article.content);
    if (!article.content.length) body.append(element("p", "No article content published yet."));
    detail.append(articleFacts(article), body);
    container.append(detail);
    return;
  }
  if (!news.length) {
    container.append(element("p", "No news articles are currently published."));
    return;
  }
  const grid = element("div", null, "news-grid");
  news.forEach((article) => {
    const card = element("article", null, "news-card");
    const href = `./news.html?id=${encodeURIComponent(article.id)}`;
    const heading = element("h2");
    heading.append(link(article.title, href));
    card.append(heading, articleFacts(article));
    const paragraph = article.content.find((block) =>
      block.type === "paragraph" && block.text.some((run) => run.text.trim()));
    if (paragraph) {
      const text = paragraph.text.map((run) => run.text).join("");
      card.append(element("p", text.length > 240 ? `${text.slice(0, 237)}...` : text, "news-summary"));
    }
    card.append(link("Read article", href, "button button--quiet"));
    grid.append(card);
  });
  container.append(grid);
}).catch((error) => showError(container, error));
