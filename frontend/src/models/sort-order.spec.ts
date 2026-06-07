import { needsRebalance, rebalance } from './sort-order';

describe('needsRebalance', () => {
    it('returns false for an empty array', () => {
        expect(needsRebalance([])).toBeFalse();
    });

    it('returns false for a single-element array', () => {
        expect(needsRebalance([1])).toBeFalse();
    });

    it('returns false when all gaps are well above the threshold', () => {
        expect(needsRebalance([1, 2, 3, 4])).toBeFalse();
    });

    it('returns false for gap equal to 1e-9 (not strictly less than)', () => {
        expect(needsRebalance([0, 1e-9])).toBeFalse();
    });

    it('returns true when any gap is smaller than 1e-9', () => {
        expect(needsRebalance([0, 5e-10])).toBeTrue();
    });

    it('returns true even if the tiny gap is not between the first two elements', () => {
        expect(needsRebalance([1, 2, 3, 3 + 1e-10])).toBeTrue();
    });

    it('ignores order of the input (sorts internally)', () => {
        // Provides values in descending order — should still detect the tiny gap
        expect(needsRebalance([3 + 1e-10, 3, 2, 1])).toBeTrue();
    });
});

describe('rebalance', () => {
    it('returns an empty array for empty input', () => {
        expect(rebalance([])).toEqual([]);
    });

    it('assigns 1 to the single element', () => {
        expect(rebalance([42])).toEqual([1]);
    });

    it('assigns sequential integers preserving relative order', () => {
        // Input: [3, 1, 2] → relative order 1<2<3 → indices 1,2,0
        // result[0] = 3 (was largest), result[1] = 1 (was smallest), result[2] = 2
        expect(rebalance([3, 1, 2])).toEqual([3, 1, 2]);
    });

    it('assigns 1,2,3,... for already-sorted input', () => {
        expect(rebalance([1, 2, 3])).toEqual([1, 2, 3]);
    });

    it('handles fractional values correctly', () => {
        // [1.5, 0.5, 1.0] → sorted order: 0.5, 1.0, 1.5 → ranks 1, 2, 3
        // index 0 has value 1.5 → rank 3
        // index 1 has value 0.5 → rank 1
        // index 2 has value 1.0 → rank 2
        expect(rebalance([1.5, 0.5, 1.0])).toEqual([3, 1, 2]);
    });

    it('produces the same number of elements as the input', () => {
        const input = [10, 5, 8, 1, 3];
        expect(rebalance(input).length).toBe(input.length);
    });

    it('output values are sequential starting from 1', () => {
        const input = [10, 5, 8, 1, 3];
        const result = rebalance(input);
        const sorted = [...result].sort((a, b) => a - b);
        expect(sorted).toEqual([1, 2, 3, 4, 5]);
    });
});
