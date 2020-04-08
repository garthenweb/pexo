import React from "react";
import { act } from "react-dom/test-utils";
import { mount, unmount } from "../client";
import { TestingViewChunk } from "../components";

describe("The client", () => {
  const createRendererWithComponent = (Component: React.ComponentType) =>
    new Promise<{ app: ReturnType<typeof mount>; container: HTMLDivElement }>(
      async (resolve) => {
        let app: ReturnType<typeof mount>;
        const container = document.createElement("div");
        const ReactApp = () => <Component />;
        await act(async () => {
          app = await mount({
            container,
            createApp: () => <ReactApp />,
          });
        });

        resolve({
          // @ts-ignore
          app,
          container,
        });
      }
    );

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
