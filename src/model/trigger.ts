export interface Trigger {
  active: boolean;
  set(cb: any): void;
  unset(cb: any): void;
}
