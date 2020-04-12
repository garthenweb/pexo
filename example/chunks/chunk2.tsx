import React, { FC } from "react";

interface Props {
  dataLoaded: string;
}

export const View: FC<Props> = ({ dataLoaded }) => (
  <div>Second Chunk {dataLoaded}</div>
);

export const generateViewState = (): Promise<Props> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        dataLoaded: "Super awesome data, but a bit slower",
      });
    }, 2000);
  });
};
