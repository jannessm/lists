/**
 * Fractional-index rebalance utilities for list-item sort_order.
 *
 * `sort_order` is a floating-point field stored on each item representing
 * its stable position within a list.  New items are appended at
 * `maxSortOrder + 1.0`.  When two items are inserted between each other the
 * gap halves on every operation.  `needsRebalance` detects when the minimum
 * gap has become too small and `rebalance` reassigns sequential integers.
 */

const REBALANCE_THRESHOLD = 1e-9;

/**
 * Returns true when the minimum gap between consecutive sort_order values
 * has dropped below REBALANCE_THRESHOLD and a rebalance should be triggered.
 */
export function needsRebalance(sortOrders: number[]): boolean {
    if (sortOrders.length < 2) {
        return false;
    }
    const sorted = [...sortOrders].sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i++) {
        if (sorted[i] - sorted[i - 1] < REBALANCE_THRESHOLD) {
            return true;
        }
    }
    return false;
}

/**
 * Returns a new array of sort_order values in the same relative order as the
 * input, replaced with sequential integers starting from 1.
 *
 * The caller is responsible for mapping these back to the corresponding items
 * and persisting them.
 */
export function rebalance(sortOrders: number[]): number[] {
    const indexed = sortOrders.map((v, i) => ({ v, i }));
    indexed.sort((a, b) => a.v - b.v);

    const result = new Array<number>(sortOrders.length);
    indexed.forEach(({ i }, rank) => {
        result[i] = rank + 1;
    });
    return result;
}
