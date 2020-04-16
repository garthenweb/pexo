import React from "react";
import { render, cleanup, act } from "@testing-library/react";
import ClientBaseChunk from "../ClientBaseChunk";
import { wait, awaiter } from "../../__tests__/utils";

describe("ClientBaseChunk", () => {
  afterEach(() => {
    cleanup();
  });

  it("should render a view", () => {
    const { getByText } = render(
      <ClientBaseChunk
        name={String(performance.now())}
        loader={() => ({
          View: () => <div>Test</div>,
        })}
      />
    );

    expect(getByText("Test")).not.toBeNull();
  });

  it("should render async module view", async () => {
    const { findByText } = render(
      <ClientBaseChunk
        name={String(performance.now())}
        loader={() =>
          Promise.resolve({
            View: () => <div>Test</div>,
          })
        }
      />
    );

    expect(await findByText("Test")).not.toBeNull();
  });

  it("should render loader for async generate view state", async () => {
    const { resolve, promise } = awaiter();
    const { findByText, queryByText } = render(
      <ClientBaseChunk
        name={String(performance.now())}
        loader={() =>
          Promise.resolve({
            generateViewState: async () => {
              await promise;
              return {};
            },
            View: () => <div>Test</div>,
            Loading: () => <div>Loading</div>,
          })
        }
      />
    );

    expect(queryByText("Test")).toBeNull();
    expect(await findByText("Loading")).not.toBeNull();
    act(() => resolve());
    expect(await findByText("Test")).not.toBeNull();
    expect(queryByText("Loading")).toBeNull();
  });

  it("should render error for async generate view state that fails", async () => {
    const { reject, promise } = awaiter();
    const { findByText, queryByText } = render(
      <ClientBaseChunk
        name={String(performance.now())}
        loader={() =>
          Promise.resolve({
            generateViewState: async () => {
              await promise;
              return {};
            },
            View: () => <div>Test</div>,
            Loading: () => <div>Loading</div>,
            Error: () => <div>Error</div>,
          })
        }
      />
    );

    expect(queryByText("Test")).toBeNull();
    expect(await findByText("Loading")).not.toBeNull();
    act(() => reject());
    expect(await findByText("Error")).not.toBeNull();
    expect(queryByText("Loading")).toBeNull();
    expect(queryByText("Test")).toBeNull();
  });
  it("should pass the reason for an error to the error component", async () => {
    const { reject, promise } = awaiter();
    const { findByText, queryByText } = render(
      <ClientBaseChunk
        name={String(performance.now())}
        loader={() =>
          Promise.resolve({
            generateViewState: async () => {
              await promise;
              return {};
            },
            View: () => <div>Test</div>,
            Loading: () => <div>Loading</div>,
            Error: ({ error }: { error: string }) => <div>{error}</div>,
          })
        }
      />
    );

    expect(queryByText("Test")).toBeNull();
    expect(await findByText("Loading")).not.toBeNull();
    act(() => reject("Reason of the error"));
    expect(await findByText("Reason of the error")).not.toBeNull();
    expect(queryByText("Loading")).toBeNull();
    expect(queryByText("Test")).toBeNull();
  });
});
