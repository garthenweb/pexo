import React from "react";
import { render, cleanup, act, fireEvent } from "@testing-library/react";
import { createRequestResource, apply } from "@pexo/request";
import BaseChunk from "../BaseChunk";
import { awaiter } from "../../../__tests__/utils";
import { useRequest } from "../../context/ClientRequestContext";

describe("ClientBaseChunk", () => {
  beforeEach(() => {
    process.browser = true;
  });
  afterEach(() => {
    cleanup();
    delete process.browser;
  });

  it("should render a view", async () => {
    const { findByText } = render(
      <BaseChunk
        $$name={String(performance.now())}
        loader={() => ({
          View: () => <div>Test</div>,
        })}
      />
    );

    expect(await findByText("Test")).not.toBeNull();
  });

  it("should render async module view", async () => {
    const { findByText } = render(
      <BaseChunk
        $$name={String(performance.now())}
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
      <BaseChunk
        $$name={String(performance.now())}
        loader={() =>
          Promise.resolve({
            generateViewState: async () => {
              await promise;
              return {};
            },
            View: () => <div>Test</div>,
            LoadingView: () => <div>Loading</div>,
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
      <BaseChunk
        $$name={String(performance.now())}
        loader={() =>
          Promise.resolve({
            generateViewState: async () => {
              await promise;
              return {};
            },
            View: () => <div>Test</div>,
            LoadingView: () => <div>Loading</div>,
            ErrorView: () => <div>Error</div>,
          })
        }
      />
    );

    expect(await findByText("Loading")).not.toBeNull();
    expect(queryByText("Test")).toBeNull();
    act(() => reject());
    expect(await findByText("Error")).not.toBeNull();
    expect(queryByText("Loading")).toBeNull();
    expect(queryByText("Test")).toBeNull();
  });
  it("should pass the reason for an error to the error component", async () => {
    const { reject, promise } = awaiter();
    const { findByText, queryByText } = render(
      <BaseChunk
        $$name={String(performance.now())}
        loader={() =>
          Promise.resolve({
            generateViewState: async () => {
              await promise;
              return {};
            },
            View: () => <div>Test</div>,
            LoadingView: () => <div>Loading</div>,
            ErrorView: ({ error }: { error: string }) => <div>{error}</div>,
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
    const { findByText } = render(
      <BaseChunk
        $$name={String(performance.now())}
        actions={{ fire }}
        loader={() => ({
          View: ({ actions }: { actions: { fire: () => void } }) => (
            <div onClick={actions.fire}>Test</div>
          ),
        })}
      />
    );

    fireEvent.click(await findByText("Test"));
    expect(fire).toHaveBeenCalledTimes(1);
  });

  it("should update view as soon as input props change", async () => {
    const name = String(performance.now());
    const { queryByText, findByText, rerender } = render(
      <BaseChunk
        $$name={name}
        value={1}
        loader={() => ({
          View: ({ value }: { value: number }) => <div>{value}</div>,
          generateViewState: ({ value }: { value: number }) => ({ value }),
        })}
      />
    );

    expect(await findByText("1")).not.toBeNull();
    rerender(
      <BaseChunk
        $$name={name}
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
      <BaseChunk
        $$name={name}
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
      <BaseChunk
        $$name={name}
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
      const resource = createRequestResource("test_resource_name", {
        read: () => Promise.resolve(++readCallCount),
        update: () => Promise.resolve(),
      });
      const { findByText, getByText } = render(
        <BaseChunk
          $$name={name}
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
    it("should rerender if resource was mutated but the update was handled", async () => {
      const name = String(performance.now());
      let readCallCount = 0;
      const read = jest.fn(() => Promise.resolve(++readCallCount));
      const resource = createRequestResource(
        "test_resource_name",
        {
          read,
          update: async function* () {
            await Promise.resolve();
            yield apply(resource(), (prev: number) => prev + 1);
          },
        },
        {
          cacheable: true,
          ttl: 10000,
        }
      );
      const { findByText, getByText } = render(
        <BaseChunk
          $$name={name}
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
      expect(read).toHaveBeenCalledTimes(1);
      fireEvent.click(getByText("1"));
      expect(await findByText("2")).not.toBeNull();
      expect(read).toHaveBeenCalledTimes(1);
      fireEvent.click(getByText("2"));
      expect(await findByText("3")).not.toBeNull();
      expect(read).toHaveBeenCalledTimes(1);
    });
  });
});
