export const cleanRuntime = (container: Element) => {
  [
    ...container.querySelectorAll<HTMLScriptElement>("[data-px-runtime]"),
  ].forEach((el) => el.remove());
};
