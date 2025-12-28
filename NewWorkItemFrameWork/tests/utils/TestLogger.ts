import { Logger } from '../../packages/domain/common/logging';

export const TestLogger: Logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  trace: jest.fn()
};
