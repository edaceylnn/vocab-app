import { getDailyGoal } from '@/lib/dailyGoalStorage';

describe('dailyGoalStorage', () => {
  it('defaults to 30 when unset', async () => {
    await expect(getDailyGoal()).resolves.toBe(30);
  });
});
