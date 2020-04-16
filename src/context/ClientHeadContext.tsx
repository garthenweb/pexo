import React, {
  createContext,
  FC,
  useContext,
  useState,
  useEffect,
  memo,
} from "react";
import { HeadChunkProps } from "../types/HeadChunkProps";
import {
  PX_IDENTIFIER_ATTRIBUTE,
  renderHeadToDOMNodes,
} from "../renderer/renderHead";

interface HeadContext {
  update: (data: HeadChunkProps) => void;
}

const Context = createContext<HeadContext>({
  update: () => {},
});

export const HeadConsumer = memo((props: HeadChunkProps) => {
  const ctx = useContext(Context);
  useEffect(() => ctx.update(props), [props]);
  return null;
});

export const HeadContextProvider: FC = ({ children }) => {
  const [data, update] = useState<HeadChunkProps | null>(null);
  return (
    <>
      {data && <HandleHeadUpdate data={data} />}
      <Context.Provider value={{ update }}>{children}</Context.Provider>
    </>
  );
};

const HandleHeadUpdate: FC<{ data: HeadChunkProps }> = ({ data }) => {
  useEffect(() => {
    const currentElements = [
      ...document.head.querySelectorAll(`[${PX_IDENTIFIER_ATTRIBUTE}]`),
    ];
    currentElements.forEach((el) => el.remove());
    const nodes = renderHeadToDOMNodes(data);
    nodes.forEach((node) => {
      document.head.appendChild(node);
    });
  }, [data]);
  return null;
};
