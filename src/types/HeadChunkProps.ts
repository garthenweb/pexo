export interface HeadChunkProps {
  title?: string;
  base?: React.DetailedHTMLProps<
    React.BaseHTMLAttributes<HTMLBaseElement>,
    HTMLBaseElement
  >;
  // bodyAttributes?: React.DetailedHTMLProps<
  //   React.HTMLAttributes<HTMLElement>,
  //   HTMLBaseElement
  // >;
  // htmlAttributes?: React.DetailedHTMLProps<
  //   React.HTMLAttributes<HTMLElement>,
  //   HTMLBaseElement
  // >;
  link?: React.DetailedHTMLProps<
    React.LinkHTMLAttributes<HTMLLinkElement>,
    HTMLLinkElement
  >[];
  meta?: React.DetailedHTMLProps<
    React.MetaHTMLAttributes<HTMLMetaElement>,
    HTMLMetaElement
  >[];
  noscript?: React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLElement>,
    HTMLElement
  >[];
  script?: React.DetailedHTMLProps<
    React.ScriptHTMLAttributes<HTMLScriptElement>,
    HTMLScriptElement
  >[];
  style?: React.DetailedHTMLProps<
    React.StyleHTMLAttributes<HTMLStyleElement>,
    HTMLStyleElement
  >[];
}
