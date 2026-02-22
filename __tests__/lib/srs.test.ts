import { getNextBoxAndDate } from '@/lib/srs';

const REAL_DATE = Date;

function mockToday(isoDate: string) {
  const [y, m, d] = isoDate.split('-').map(Number);
  const utcMs = REAL_DATE.UTC(y, m - 1, d, 12, 0, 0, 0);
  (global as unknown as { Date: typeof Date }).Date = class extends REAL_DATE {
    constructor(...args: unknown[]) {
      if (args.length === 0) {
        super(utcMs);
      } else {
        super(...(args as [number, number, number]));
      }
    }
    static now() {
      return utcMs;
    }
  } as unknown as DateConstructor;
}

function restoreDate() {
  (global as unknown as { Date: typeof Date }).Date = REAL_DATE;
}

describe('lib/srs getNextBoxAndDate', () => {
  afterEach(restoreDate);

  beforeEach(() => mockToday('2025-06-15'));

  it('resets to box 1 and today for forgot', () => {
    const r = getNextBoxAndDate(3, 'forgot');
    expect(r.newBox).toBe(1);
    expect(r.nextReviewAt).toBe('2025-06-15');
  });

  it('increments by 1 for good from box 1', () => {
    const r = getNextBoxAndDate(1, 'good');
    expect(r.newBox).toBe(2);
    expect(r.nextReviewAt).toBe('2025-06-17');
  });

  it('stays in same box for hard', () => {
    const r = getNextBoxAndDate(2, 'hard');
    expect(r.newBox).toBe(2);
    expect(r.nextReviewAt).toBe('2025-06-17');
  });

  it('increments by 2 for easy from box 1', () => {
    const r = getNextBoxAndDate(1, 'easy');
    expect(r.newBox).toBe(3);
    expect(r.nextReviewAt).toBe('2025-06-19');
  });

  it('caps at MAX_BOX', () => {
    const r = getNextBoxAndDate(5, 'easy');
    expect(r.newBox).toBe(5);
    expect(r.nextReviewAt).toBe('2025-06-29');
  });
});
