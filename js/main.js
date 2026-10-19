const content = document.querySelector(".content");
const toc = document.querySelector(".toc");

document.querySelector(".eyebrow").textContent = "AMI SYSTEM";
document.querySelector(".hero h1").textContent = "AMI-System Deployment Guide";

content.querySelectorAll(".page-marker").forEach((marker) => marker.remove());
const openingTitle = content.querySelector(".manual-title");
if (openingTitle) openingTitle.textContent = "AMI-System Deployment Guide";

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/&amp;|&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const repairText = (value) =>
  value
    .replace(/â€“|â€”/g, "–")
    .replace(/â€¦/g, "...")
    .replace(/â€™/g, "’")
    .replace(/â€œ|â€/g, '"')
    .replace(/ïƒ°/g, "•")
    .replace(/Â¼/g, "¼")
    .replace(/â/g, "");
const cleanLabel = (value) =>
  repairText(value)
    .replace(/^#+\s*/, "")
    .replace(/\s*\.{3,}\s*(?:\d+|Error!.*)?\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();

content
  .querySelectorAll("#page-2, #page-3")
  .forEach((section) => section.remove());
content.querySelectorAll("h2, h3, .manual-list-item").forEach((heading) => {
  heading.textContent = cleanLabel(heading.textContent);
});

const majorHeadings = [
  [/^1\.\s*AMI Assembly/i, "assembly"],
  [/^2\.\s*AMI Set-up/i, "setup"],
  [/^4\.\s*Maintenance/i, "maintenance"],
  [/^6\.\s*Take-down/i, "takedown"],
  [/^7\.\s*Troubleshooting/i, "troubleshooting"],
  [/^8\.\s*Data transfer/i, "data-transfer"],
];
content.querySelectorAll(".manual-list-item").forEach((item) => {
  const match = majorHeadings.find(([pattern]) =>
    pattern.test(item.textContent.trim()),
  );
  if (!match) return;
  const heading = document.createElement("h2");
  heading.className = "manual-section-heading";
  heading.id = match[1];
  heading.textContent = cleanLabel(item.textContent)
    .replace(/^1\.\s*AMI\s+/i, "1. ")
    .replace(/^2\.\s*AMI\s+/i, "2. ");
  item.replaceWith(heading);
});

content.querySelectorAll(".manual-text").forEach((paragraph) => {
  const text = cleanLabel(paragraph.textContent);
  if (/^(?:1\.1|2\.1|2\.5|4\.2|8\.[12])\s/.test(text) && text.length < 120) {
    const heading = document.createElement("h3");
    heading.textContent = text;
    paragraph.replaceWith(heading);
  }
});

content.querySelectorAll(".manual-text").forEach((paragraph) => {
  const text = repairText(paragraph.textContent).trim();
  if (/^FIGURE\s+\d+\s*:/i.test(text) || /^FIGURE\s+\d+\s+/i.test(text)) {
    paragraph.classList.add("figure-caption");
    paragraph.textContent = text.replace(/\s+/g, " ");
  }
});
content.querySelectorAll(".figure-caption").forEach((caption) => {
  let next = caption.nextElementSibling;
  while (next && !next.classList.contains("figure-grid"))
    next = next.nextElementSibling;
  if (next) next.after(caption);
});

const sections = [
  ["1. Assembly", "assembly"],
  ["2. Set-up", "setup"],
  ["4. Maintenance", "maintenance"],
  ["6. Take-down", "takedown"],
  ["7. Troubleshooting", "troubleshooting"],
  ["8. Data transfer & upload", "data-transfer"],
];

content.querySelectorAll(".manual-list-item").forEach((item) => {
  const label = item.textContent.trim().replace(/\s+/g, " ");
  const match = sections.find(([title]) => label.startsWith(title));
  if (match && !document.getElementById(match[1])) item.id = match[1];
});

const usedIds = new Set();
content
  .querySelectorAll(".chapter:not(#page-2):not(#page-3) h3")
  .forEach((heading) => {
    let id = slugify(heading.textContent);
    if (!id || usedIds.has(id)) id = `${id || "section"}-${usedIds.size}`;
    usedIds.add(id);
    heading.id = id;
  });

const tocList = document.createElement("ul");
const tocGroups = new Map();
const tocItems = new Map();
sections.forEach(([label, id]) => {
  const major = document.createElement("li");
  major.className = "toc-major";
  const details = document.createElement("details");
  const summary = document.createElement("summary");
  summary.innerHTML = `<a href="#${id}">${label}</a>`;
  details.appendChild(summary);
  const children = document.createElement("ul");
  details.appendChild(children);
  major.appendChild(details);
  tocList.appendChild(major);
  tocGroups.set(label.charAt(0), children);
  tocItems.set(label.charAt(0), details);
});
content
  .querySelectorAll(".chapter:not(#page-2):not(#page-3) h3")
  .forEach((heading) => {
    const label = cleanLabel(heading.textContent);
    const number = label.match(/^(\d+(?:\.\d+){1,2})\b/);
    if (!number || !tocGroups.has(number[1].split(".")[0])) return;
    const child = document.createElement("li");
    const depth = number[1].split(".").length;
    child.className = depth === 3 ? "toc-detail" : "toc-sub";
    const parentNumber = number[1].split(".").slice(0, -1).join(".");
    if (depth === 3 && tocItems.has(parentNumber)) {
      const parent = tocItems.get(parentNumber);
      const nested = parent.querySelector(":scope > ul");
      child.innerHTML = `<a href="#${heading.id}">${label}</a>`;
      nested.appendChild(child);
    } else {
      const details = document.createElement("details");
      const summary = document.createElement("summary");
      summary.innerHTML = `<a href="#${heading.id}">${label}</a>`;
      details.append(summary);
      details.appendChild(document.createElement("ul"));
      child.appendChild(details);
      tocGroups.get(number[1].split(".")[0]).appendChild(child);
      tocItems.set(number[1], details);
    }
  });
toc.innerHTML = "<strong>Contents</strong>";
toc.appendChild(tocList);

// Leaf entries are links rather than empty disclosure controls.
[...toc.querySelectorAll("details")].reverse().forEach((details) => {
  const children = details.querySelector(":scope > ul");
  if (children && children.children.length === 0) {
    const link = details.querySelector(":scope > summary > a");
    link.classList.add("toc-leaf");
    details.replaceWith(link);
  }
});

content.querySelectorAll(".manual-list-item").forEach((item) => {
  if (!/^(?:\d+|[a-z])[\.)]\s/i.test(item.textContent.trim())) return;
  item.textContent = item.textContent
    .trim()
    .replace(/^(?:\d+|[a-z])[\.)]\s*/i, "");
  const previous = item.previousElementSibling;
  if (previous && previous.matches("ol, ul")) {
    previous.appendChild(item);
    return;
  }
  const list = document.createElement(
    /^\d+[\.)]/.test(item.textContent.trim()) ? "ol" : "ul",
  );
  list.className = "manual-list";
  item.replaceWith(list);
  list.appendChild(item);
});
