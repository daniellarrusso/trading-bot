export class Notification {
  type: string;
  notify: () => boolean;
  clear: () => boolean;
  canNotify?: boolean = true;
}
