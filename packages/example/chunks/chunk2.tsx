import React, { FC } from "react";

interface Props {
  title: string;
  subTitle?: string;
  even: boolean;
  actions: {
    countUp: () => void;
  };
}

export const View: FC<Props> = ({ title, subTitle, even, actions }) => (
  <div>
    Second Chunk: {title}
    <div>
      <button onClick={actions.countUp}>
        value is {even ? "even" : "odd"}
      </button>
    </div>
    {subTitle && <div>On page {subTitle}</div>}
  </div>
);

interface InputProps {
  page?: string;
  value: number;
}

export const generateViewState = async function* (inputProps: InputProps) {
  await new Promise((resolve) => setTimeout(resolve, 200));
  yield {
    title: "Super awesome data, but a bit slower",
    even: inputProps.value % 2 === 0,
  };
  await new Promise((resolve) => setTimeout(resolve, 500));
  yield {
    title: "Super awesome data, but a bit slower",
    subTitle: inputProps.page,
    even: inputProps.value % 2 === 0,
  };
};

export const ErrorView = () => {
  return <div>:(</div>;
};
