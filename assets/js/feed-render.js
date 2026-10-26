import { formatDate, safeUrl } from "./events.js";

export function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text != null) node.textContent = text;
  if (className) node.className = className;
  return node;
}

export function link(label, href, className) {
  const node = element("a", label, className);
  node.href = href;
  return node;
}

export function dateRange(event) {
  const container = element("span");
  for (const value of [event.date.start, event.date.end].filter(Boolean)) {
    if (container.childNodes.length) container.append(" – ");
    const time = element("time", formatDate(value, event.date.timeZone));
    time.dateTime = value;
    container.append(time);
  }
  return container;
}

function richText(parent, runs) {
  runs.forEach((run) => {
    let node = document.createTextNode(run.text);
    for (const [flag, tag] of [["bold", "strong"], ["italic", "em"], ["strikethrough", "s"], ["underline", "u"], ["code", "code"]]) {
      if (run[flag]) {
        const wrapper = element(tag);
        wrapper.append(node);
        node = wrapper;
      }
    }
    if (run.href) {
      const anchor = link("", safeUrl(run.href));
      anchor.append(node);
      node = anchor;
    }
    parent.append(node);
  });
}

export function renderContent(parent, blocks) {
  let list = null;
  let listType = null;
  blocks.forEach((block) => {
    const isList = ["bulleted_list_item", "numbered_list_item"].includes(block.type);
    if (!isList) { list = null; listType = null; }
    let node;
    if (isList) {
      if (listType !== block.type) {
        list = element(block.type === "numbered_list_item" ? "ol" : "ul");
        parent.append(list);
        listType = block.type;
      }
      node = element("li");
      richText(node, block.text);
      list.append(node);
    } else {
      if (block.type === "divider") node = element("hr");
      else if (block.type === "image") {
        node = element("figure");
        const image = element("img");
        image.src = safeUrl(block.url);
        image.alt = block.caption.map((run) => run.text).join("");
        image.loading = "lazy";
        image.addEventListener("error", () => {
          console.error("Published image failed to load.");
          image.replaceWith(element("p", "Image unavailable. Reload this page to refresh the image link.", "feed-error"));
        });
        node.append(image);
        if (block.caption.length) {
          const caption = element("figcaption");
          richText(caption, block.caption);
          node.append(caption);
        }
      } else if (block.type === "link") {
        node = element("p");
        const anchor = link("", safeUrl(block.url));
        if (block.caption.length) richText(anchor, block.caption.map((run) => ({ ...run, href: null })));
        else anchor.textContent = block.url;
        node.append(anchor);
      } else if (block.type === "code") {
        node = element("pre");
        const code = element("code", block.text.map((run) => run.text).join(""));
        node.append(code);
      } else {
        const tags = { paragraph: "p", heading_1: "h2", heading_2: "h3", heading_3: "h4", quote: "blockquote", callout: "aside" };
        node = element(tags[block.type]);
        richText(node, block.text);
      }
      parent.append(node);
    }
    if (block.children?.length) renderContent(node, block.children);
  });
}

export function showError(container, error, headingId) {
  console.error("Notion feed could not be displayed.", error);
  const heading = element("h2", "Content unavailable");
  if (headingId) heading.id = headingId;
  const message = element("p", "We couldn't load the published Notion content. Please try again.", "feed-error");
  message.setAttribute("role", "alert");
  const retry = element("button", "Retry", "button button--quiet");
  retry.type = "button";
  retry.addEventListener("click", () => window.location.reload());
  container.replaceChildren(heading, message, retry);
}
