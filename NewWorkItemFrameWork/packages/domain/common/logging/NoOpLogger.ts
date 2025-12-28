import { Logger } from './Logger';

export class NoOpLogger implements Logger {
  trace(): void {}
  debug(): void {}
  info(): void {}
  warn(): void {}
  error(): void {}
}
