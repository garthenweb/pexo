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

export const generateViewState = (inputProps: InputProps): Promise<Props> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        title: "Super awesome data, but a bit slower",
        subTitle: inputProps.page,
      });
    }, 700);
  });
};
