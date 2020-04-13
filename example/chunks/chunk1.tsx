import React, { FC } from "react";
import styled from "styled-components";

interface Props {
  title: string;
  subTitle?: string;
}

const Wrapper = styled.div`
  padding: 50px;
`;

const Title = styled.div`
  font-weight: bold;
`;

export const View: FC<Props> = ({ title, subTitle }) => (
  <Wrapper>
    First Chunk: <Title>{title}</Title>
    {subTitle && <div>On page {subTitle}</div>}
  </Wrapper>
);

interface InputProps {
  page?: string;
}

export const generateViewState = (inputProps: InputProps): Promise<Props> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        title: "Super awesome data",
        subTitle: inputProps.page,
      });
    }, 400);
  });
};
