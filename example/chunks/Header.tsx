import React, { FC } from "react";
import { Link } from "../../src/components";

interface Props {
  items: { href: string; title: string }[];
}

export const View: FC<Props> = ({ items }) => (
  <>
    {items.map((item) => (
      <Link key={item.href} to={item.href}>
        {item.title}
      </Link>
    ))}
  </>
);

export const generateViewState = (): Promise<Props> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        items: [
          { href: "/", title: "Homepage" },
          { href: "/page1", title: "Page1" },
          { href: "/page2", title: "Page2" },
        ],
      });
    }, 100);
  });
};
