import React from "react";
import { unmount } from "../client";
import { TestingViewChunk } from "../components";
import { createRendererWithComponent } from "./utils";

describe("The client", () => {
  beforeEach(() => {
    process.browser = true;
  });

  afterEach(() => {
    process.browser = void 0;
  });

  it("should render a simple application in the client", async () => {
    const { container, app } = await createRendererWithComponent(() => (
      <div>Hello World</div>
    ));
    expect(container.innerHTML).toContain("Hello World");
    unmount(app);
  });

  it("should render sync chunks", async () => {
    const { container, app } = await createRendererWithComponent(() => (
      <>
        <TestingViewChunk loader={() => ({ View: () => "Hello" })} />
        <TestingViewChunk loader={() => ({ View: () => " World" })} />
      </>
    ));
    expect(container.innerHTML).toContain("Hello World");
    unmount(app);
  });

  it("should render sync chunks with properties", async () => {
    const { container, app } = await createRendererWithComponent(() => (
      <TestingViewChunk
        input="World"
        loader={() => ({
          View: ({ value }: { value: string }) => `Hello ${value}`,
          generateViewState: ({ input }: { input: string }) => ({
            value: input,
          }),
        })}
      />
    ));
    expect(container.innerHTML).toContain("Hello World");
    unmount(app);
  });

  it("should render async chunks", async () => {
    const { container, app } = await createRendererWithComponent(() => (
      <>
        <TestingViewChunk
          loader={() => Promise.resolve({ View: () => "Hello" })}
        />
        <TestingViewChunk
          loader={() => Promise.resolve({ View: () => " World" })}
        />
      </>
    ));
    expect(container.innerHTML).toContain("Hello World");
    unmount(app);
  });

  it("should render async chunks with properties", async () => {
    const { container, app } = await createRendererWithComponent(() => (
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
    ));
    expect(container.innerHTML).toContain("Hello World");
    unmount(app);
  });

  it("should render async chunks with async properties", async () => {
    const { container, app } = await createRendererWithComponent(() => (
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
    ));
    expect(container.innerHTML).toContain("Hello World");
    unmount(app);
  });
});
