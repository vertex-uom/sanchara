import { type ArgumentsHost, HttpStatus, NotFoundException } from '@nestjs/common';
import { AppException } from '../errors/app-exception.js';
import { AllExceptionsFilter } from './all-exceptions.filter.js';

function hostFor(response: { status: ReturnType<typeof vi.fn>; json: ReturnType<typeof vi.fn>; setHeader: ReturnType<typeof vi.fn> }) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ method: 'GET', path: '/x', id: 'req-1' }),
      getResponse: () => response,
    }),
  } as unknown as ArgumentsHost;
}

function run(exception: unknown) {
  const response = { status: vi.fn(), json: vi.fn(), setHeader: vi.fn() };
  response.status.mockReturnValue(response);
  new AllExceptionsFilter().catch(exception, hostFor(response));
  return response;
}

describe('AllExceptionsFilter', () => {
  it('keeps AppException code, field errors and headers', () => {
    const response = run(
      new AppException(HttpStatus.TOO_MANY_REQUESTS, 'TOO_MANY_ATTEMPTS', 'Slow down.', { email: ['x'] }, { 'Retry-After': '60' }),
    );
    expect(response.status).toHaveBeenCalledWith(429);
    expect(response.setHeader).toHaveBeenCalledWith('Retry-After', '60');
    expect(response.json).toHaveBeenCalledWith({
      status: 429,
      code: 'TOO_MANY_ATTEMPTS',
      message: 'Slow down.',
      fieldErrors: { email: ['x'] },
    });
  });

  it('maps built-in HTTP exceptions to a stable code', () => {
    const response = run(new NotFoundException());
    expect(response.json).toHaveBeenCalledWith({ status: 404, code: 'NOT_FOUND', message: 'Not Found' });
  });

  it('hides details of unexpected errors', () => {
    const response = run(new Error('db password is hunter2'));
    expect(response.json).toHaveBeenCalledWith({ status: 500, code: 'INTERNAL_ERROR', message: 'Something went wrong.' });
  });
});
