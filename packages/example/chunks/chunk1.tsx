import React, { FC } from "react";
import styled from "styled-components";
import { GenerateViewStateUtils } from "@pexo/core";
import { createRequestResource } from "@pexo/request";

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

export const generateViewState = (
  inputProps: InputProps,
  { request }: GenerateViewStateUtils
): Promise<Props> => {
  return request(getResourceWithSubTitle(inputProps.page));
};

const getResourceWithSubTitle = createRequestResource(
  (subTitle?: string) =>
    new Promise<Props>((resolve) => {
      setTimeout(() => {
        resolve({
          title: "Super awesome data",
          subTitle,
        });
      }, 400);
    }),
  { cacheable: true }
);
