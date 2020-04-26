import React from "react";
import { render, cleanup, act, fireEvent } from "@testing-library/react";
import ClientBaseChunk from "../ClientBaseChunk";
import { awaiter, wait, nextTick } from "../../__tests__/utils";
import { createRequestResource } from "../../request";
import { useRequest } from "../../context/ClientRequestContext";

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

  it("should allow to pass actions into the view", async () => {
    const fire = jest.fn();
    const { getByText } = render(
      <ClientBaseChunk
        name={String(performance.now())}
        actions={{ fire }}
        loader={() => ({
          View: ({ actions }: { actions: { fire: () => void } }) => (
            <div onClick={actions.fire}>Test</div>
          ),
        })}
      />
    );

    fireEvent.click(getByText("Test"));
    expect(fire).toHaveBeenCalledTimes(1);
  });

  it("should update view as soon as input props change", async () => {
    const name = String(performance.now());
    const { queryByText, findByText, rerender } = render(
      <ClientBaseChunk
        name={name}
        value={1}
        loader={() => ({
          View: ({ value }: { value: number }) => <div>{value}</div>,
          generateViewState: ({ value }: { value: number }) => ({ value }),
        })}
      />
    );

    expect(await findByText("1")).not.toBeNull();
    rerender(
      <ClientBaseChunk
        name={name}
        value={2}
        loader={() => ({
          View: ({ value }: { value: number }) => <div>{value}</div>,
          generateViewState: ({ value }: { value: number }) => ({ value }),
        })}
      />
    );
    expect(await findByText("2")).not.toBeNull();
    expect(queryByText("1")).toBeNull();
  });

  it("should not regenerate the view state on mount if already cached", async () => {
    const name = String(performance.now());
    const generateViewState = jest.fn(() => ({ value: "Chunk" }));
    const { findByText, rerender } = render(
      <ClientBaseChunk
        name={name}
        loader={() => ({
          View: ({ value }: { value: string }) => <div>{value}</div>,
          generateViewState,
        })}
      />
    );
    expect(await findByText("Chunk")).not.toBeNull();

    rerender(<div>reset</div>);
    expect(await findByText("reset")).not.toBeNull();

    rerender(
      <ClientBaseChunk
        name={name}
        loader={() => ({
          View: ({ value }: { value: string }) => <div>{value}</div>,
          generateViewState,
        })}
      />
    );
    expect(await findByText("Chunk")).not.toBeNull();
    expect(generateViewState).toHaveBeenCalledTimes(1);
  });

  describe("if used with resources", () => {
    it("should invalidate and rerender the view when a mutating action was fired", async () => {
      const name = String(performance.now());
      let readCallCount = 0;
      const resource = createRequestResource({
        read: () => Promise.resolve(++readCallCount),
        update: () => Promise.resolve(),
      });
      const { findByText, getByText } = render(
        <ClientBaseChunk
          name={name}
          loader={() => ({
            View: ({ state }: { state: number }) => {
              const request = useRequest();
              return (
                <div onClick={() => request(resource.update())}>{state}</div>
              );
            },
            generateViewState: async (_, { request }) => {
              return {
                state: await request(resource()),
              };
            },
          })}
        />
      );

      expect(await findByText("1")).not.toBeNull();
      fireEvent.click(getByText("1"));
      expect(await findByText("2")).not.toBeNull();
    });
  });
});
