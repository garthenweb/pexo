import { HeadChunkProps } from "../types/HeadChunkProps";

interface Attributes {
  [key: string]: string | boolean;
}

export const PX_IDENTIFIER_ATTRIBUTE = `data-px-head-tag`;

export const renderHeadToString = (headConfig: HeadChunkProps) => {
  const tags = renderHeadByMethod(headConfig, buildTagAsString);
  return tags.join("");
};

export const renderHeadToDOMNodes = (headConfig: HeadChunkProps) => {
  return renderHeadByMethod(headConfig, buildTagAsNode);
};

const renderHeadByMethod = <T,>(
  headConfig: HeadChunkProps,
  method: (tagName: string, attr: Attributes, content?: string) => T
): T[] => {
  let head = [];
  if (headConfig.title) {
    head.push(method("title", {}, headConfig.title));
  }

  if (headConfig.base) {
    head.push(method("base", headConfig.base));
  }

  if (headConfig.link) {
    headConfig.link.forEach((attrs) => {
      head.push(method("link", attrs));
    });
  }

  if (headConfig.meta) {
    headConfig.meta.forEach((attrs) => {
      head.push(method("meta", attrs));
    });
  }

  if (headConfig.noscript) {
    headConfig.noscript.forEach((attrs) => {
      head.push(method("noscript", attrs));
    });
  }

  if (headConfig.script) {
    headConfig.script.forEach((attrs) => {
      head.push(method("script", attrs));
    });
  }

  if (headConfig.style) {
    headConfig.style.forEach((attrs) => {
      head.push(method("style", attrs));
    });
  }

  return head;
};

const renderAttributesToString = (attrs: Attributes) => {
  return Object.entries(attrs)
    .reduce((str, [key, value]) => {
      return `${str} ${key}="${encodeSpecialCharacters(value)}"`;
    }, "")
    .trim();
};

const buildTagAsString = (
  tagName: string,
  attr: Attributes,
  content?: string
) => {
  const list = [
    tagName,
    PX_IDENTIFIER_ATTRIBUTE,
    renderAttributesToString(attr),
  ].filter(Boolean);
  if (typeof content === "string") {
    return `<${list.join(" ")}>${content}</${tagName}>`;
  }
  return `<${list.join(" ")} />`;
};

const buildTagAsNode = (
  tagName: string,
  attr: Attributes,
  content?: string
) => {
  const node = document.createElement(tagName);
  if (content) {
    node.innerText = content;
  }
  node.setAttribute(PX_IDENTIFIER_ATTRIBUTE, "");
  Object.entries(attr).forEach(([key, value]) => {
    if (value) {
      node.setAttribute(key, encodeSpecialCharacters(value));
    }
  });
  return node;
};

// from https://github.com/nfl/react-helmet/blob/master/src/HelmetUtils.js
const encodeSpecialCharacters = (value: string | boolean) => {
  if (typeof value === "boolean") {
    return String(value);
  }
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
};
