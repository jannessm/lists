export function datesAreEqual(a: string | null, b: string | null) {
    if (a === null && b === null) {
        return true;
    }
    if (!a || !b) {
        return false;
    }

    const aDate = new Date(a);
    const bDate = new Date(b);

    if (isNaN(aDate.valueOf()) || isNaN(bDate.valueOf())) {
        throw Error('invalid Date cannot be compared');
    }

    return aDate.valueOf() - bDate.valueOf() === 0;
}