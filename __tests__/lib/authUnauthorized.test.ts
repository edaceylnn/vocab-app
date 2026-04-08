import { notifyAuthUnauthorized, setAuthUnauthorizedHandler } from '@/lib/authUnauthorized';

describe('authUnauthorized', () => {
  it('invokes handler when set', () => {
    const fn = jest.fn();
    setAuthUnauthorizedHandler(fn);
    notifyAuthUnauthorized();
    expect(fn).toHaveBeenCalledTimes(1);
    setAuthUnauthorizedHandler(null);
  });
});
