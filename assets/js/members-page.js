import { loadFeed, safeUrl } from "./events.js";
import { element, link, renderContent, showError } from "./feed-render.js";

const container = document.querySelector("#members-content");
const selectedId = new URLSearchParams(window.location.search).get("id");

function profilePhoto(member) {
  const frame = element("div", null, "member-photo");
  const placeholder = () => {
    const initials = member.title.trim().split(/\s+/u).slice(0, 2)
      .map((part) => [...part][0]).join("").toLocaleUpperCase();
    const fallback = element("span", initials, "member-initials");
    fallback.setAttribute("aria-hidden", "true");
    frame.replaceChildren(fallback);
  };
  if (member.photos.length) {
    const photo = element("img");
    photo.src = safeUrl(member.photos[0].url);
    photo.alt = `Profile photo of ${member.title}`;
    photo.loading = "lazy";
    photo.width = 320;
    photo.height = 320;
    photo.addEventListener("error", () => {
      console.error("Member profile photo failed to load.");
      placeholder();
      frame.append(element("p", "Photo unavailable. Reload to refresh.", "member-photo-error"));
    });
    frame.append(photo);
  } else {
    placeholder();
  }
  return frame;
}

function profileFacts(member) {
  const facts = element("div", null, "member-facts");
  if (member.roles.length) {
    const roles = element("ul", null, "member-roles");
    roles.setAttribute("aria-label", "Roles");
    member.roles.forEach((role) => roles.append(element("li", role)));
    facts.append(roles);
  }
  if (member.graduationSemester) {
    facts.append(element("p", `Graduation: ${member.graduationSemester}`, "member-graduation"));
  }
  return facts;
}

loadFeed("members").then((members) => {
  container.replaceChildren();
  if (selectedId) {
    document.querySelector("#all-members").hidden = false;
    const member = members.find((item) => item.id === selectedId);
    if (!member) {
      document.title = "Profile not found | Game Developers Guild";
      document.querySelector("#members-title").textContent = "Profile not found";
      container.append(element("p", "This member profile is not currently published."));
      return;
    }
    document.title = `${member.title} | Game Developers Guild`;
    document.querySelector("#members-title").textContent = member.title;
    const article = element("article", null, "member-profile");
    article.setAttribute("aria-labelledby", "members-title");
    const sidebar = element("div", null, "member-sidebar");
    sidebar.append(profilePhoto(member), profileFacts(member));
    const body = element("div", null, "published-content member-bio");
    renderContent(body, member.content);
    if (!member.content.length) body.append(element("p", "No biography published yet."));
    article.append(sidebar, body);
    container.append(article);
    return;
  }
  if (!members.length) {
    container.append(element("p", "No member profiles are currently published."));
    return;
  }
  const grid = element("div", null, "member-grid");
  members.forEach((member) => {
    const card = element("article", null, "member-card");
    const heading = element("h2");
    heading.append(link(member.title, `./members.html?id=${encodeURIComponent(member.id)}`));
    card.append(profilePhoto(member), heading, profileFacts(member),
      link("View profile", `./members.html?id=${encodeURIComponent(member.id)}`, "button button--quiet"));
    grid.append(card);
  });
  container.append(grid);
}).catch((error) => showError(container, error));
