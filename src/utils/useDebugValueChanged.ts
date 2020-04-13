import { useEffect } from "react";

interface Props {
  [key: string]: unknown;
}

export const useDebugValueChanged = (props: Props, prefix = "") => {
  Object.keys(props).forEach((key) => {
    useEffect(
      () =>
        console.log(
          `${
            prefix ? `[${prefix}]` : ""
          } value with name \`${key}\` changed to`,
          props[key]
        ),
      [props[key]]
    );
  });
};
