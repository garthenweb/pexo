import React, { FC } from "react";

interface Props {
  title: string;
  subTitle?: string;
}

export const View: FC<Props> = ({ title, subTitle }) => (
  <div>
    Second Chunk: {title}
    {subTitle && <div>On page {subTitle}</div>}
  </div>
);

interface InputProps {
  page?: string;
}

export const generateViewState = async function* (inputProps: InputProps) {
  await new Promise((resolve) => setTimeout(resolve, 200));
  yield {
    title: "Super awesome data, but a bit slower",
  };
  await new Promise((resolve) => setTimeout(resolve, 500));
  yield {
    title: "Super awesome data, but a bit slower",
    subTitle: inputProps.page,
  };
};
