type Handler = () => void | Promise<void>;

let handler: Handler | null = null;

export function setAuthUnauthorizedHandler(fn: Handler | null): void {
  handler = fn;
}

export function notifyAuthUnauthorized(): void {
  void handler?.();
}
