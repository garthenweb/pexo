type Pathname = string;
export type RedirectStatusCode =
  | 300
  | 301
  | 302
  | 303
  | 304
  | 305
  | 306
  | 307
  | 308;

export class Redirect {
  pathname: Pathname;
  status: RedirectStatusCode;
  constructor({
    pathname,
    status,
  }: {
    pathname: Pathname;
    status?: RedirectStatusCode;
  }) {
    this.pathname = pathname;
    this.status = status || 301;
  }
}
