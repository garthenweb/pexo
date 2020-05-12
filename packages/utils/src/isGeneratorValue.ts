import { exists } from "./exists";

export const isGeneratorValue = <T extends {}>(
  val: T | AsyncGenerator<T>
): val is AsyncGenerator<T> => {
  return (
    exists(val) &&
    typeof (val as any).next === "function" &&
    typeof (val as any).return === "function" &&
    typeof (val as any).throw === "function"
  );
};
