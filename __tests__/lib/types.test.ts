import {
  LEITNER_INTERVAL_DAYS,
  MAX_BOX,
} from '@/lib/types';

describe('lib/types', () => {
  describe('LEITNER_INTERVAL_DAYS', () => {
    it('has interval 1 for box 1', () => {
      expect(LEITNER_INTERVAL_DAYS[1]).toBe(1);
    });
    it('has interval 2 for box 2', () => {
      expect(LEITNER_INTERVAL_DAYS[2]).toBe(2);
    });
    it('has interval 4 for box 3', () => {
      expect(LEITNER_INTERVAL_DAYS[3]).toBe(4);
    });
    it('has interval 7 for box 4', () => {
      expect(LEITNER_INTERVAL_DAYS[4]).toBe(7);
    });
    it('has interval 14 for box 5', () => {
      expect(LEITNER_INTERVAL_DAYS[5]).toBe(14);
    });
  });

  describe('MAX_BOX', () => {
    it('is 5', () => {
      expect(MAX_BOX).toBe(5);
    });
  });
});
