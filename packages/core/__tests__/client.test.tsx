import React from "react";
import { TestingViewChunk } from "../src/components";
import { createRendererWithComponent } from "./utils";

describe("The client", () => {
  let container: HTMLElement, clean: () => void;
  beforeEach(() => {
    process.browser = true;
  });

  afterEach(() => {
    process.browser = void 0;
    if (clean) {
      clean();
    }
  });

  it("should render a simple application in the client", async () => {
    ({ container, clean } = await createRendererWithComponent(() => (
      <div>Hello World</div>
    )));
    expect(container.innerHTML).toContain("Hello World");
  });

  it("should render sync chunks", async () => {
    ({ container, clean } = await createRendererWithComponent(() => (
      <>
        <TestingViewChunk loader={() => ({ View: () => "Hello" })} />
        <TestingViewChunk loader={() => ({ View: () => " World" })} />
      </>
    )));
    expect(container.innerHTML).toContain("Hello World");
  });

  it("should render sync chunks with properties", async () => {
    ({ container, clean } = await createRendererWithComponent(() => (
      <TestingViewChunk
        input="World"
        loader={() => ({
          View: ({ value }: { value: string }) => `Hello ${value}`,
          generateViewState: ({ input }: { input: string }) => ({
            value: input,
          }),
        })}
      />
    )));
    expect(container.innerHTML).toContain("Hello World");
  });

  it("should render async chunks", async () => {
    ({ container, clean } = await createRendererWithComponent(() => (
      <>
        <TestingViewChunk
          loader={() => Promise.resolve({ View: () => "Hello" })}
        />
        <TestingViewChunk
          loader={() => Promise.resolve({ View: () => " World" })}
        />
      </>
    )));
    expect(container.innerHTML).toContain("Hello World");
  });

  it("should render async chunks with properties", async () => {
    ({ container, clean } = await createRendererWithComponent(() => (
      <TestingViewChunk
        input="World"
        loader={() =>
          Promise.resolve({
            View: ({ value }: { value: string }) => `Hello ${value}`,
            generateViewState: ({ input }: { input: string }) => ({
              value: input,
            }),
          })
        }
      />
    )));
    expect(container.innerHTML).toContain("Hello World");
  });

  it("should render async chunks with async properties", async () => {
    ({ container, clean } = await createRendererWithComponent(() => (
      <TestingViewChunk
        input="World"
        loader={() =>
          Promise.resolve({
            View: ({ value }: { value: string }) => `Hello ${value}`,
            generateViewState: ({ input }: { input: string }) =>
              Promise.resolve({
                value: input,
              }),
          })
        }
      />
    )));
    expect(container.innerHTML).toContain("Hello World");
  });

  describe("partial data fetching", () => {
    it("should allow generator functions", async () => {
      ({ container, clean } = await createRendererWithComponent(() => (
        <TestingViewChunk
          start={5}
          loader={() => ({
            View: ({ value }: { value: number }) => <div>{value}</div>,
            generateViewState: async function* ({ start }: { start: number }) {
              yield { value: start + 1 };
              await new Promise((resolve) => setTimeout(resolve, 100));
              yield { value: start + 2 };
              await new Promise((resolve) => setTimeout(resolve, 100));
              yield { value: start + 3 };
            }
          })}
        />
      )));
      await new Promise((resolve) => setTimeout(resolve, 300));
      expect(container.innerHTML).toContain("<div>8</div>");
    });
  });
});
