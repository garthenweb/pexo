type Pathname = string;
type Status = 301 | 302;

export class Redirect {
  pathname: Pathname;
  status: Status;
  constructor({ pathname, status }: { pathname: Pathname; status: Status }) {
    this.pathname = pathname;
    this.status = status;
  }
}
