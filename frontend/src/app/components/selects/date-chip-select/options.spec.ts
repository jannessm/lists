import { getDueDate, getReminderDate, DueOption, ReminderOption } from './options';

describe('getDueDate', () => {
  it('should return null for SOMETIME', () => {
    expect(getDueDate(DueOption.SOMETIME)).toBeNull();
  });

  it('should return an ISO string for TODAY', () => {
    const result = getDueDate(DueOption.TODAY);
    expect(result).toBeTruthy();
    expect(new Date(result!).valueOf()).not.toBeNaN();
  });

  it('should return an ISO string for TOMORROW', () => {
    const result = getDueDate(DueOption.TOMORROW);
    expect(result).toBeTruthy();
    expect(new Date(result!).valueOf()).not.toBeNaN();
  });

  it('should return the raw string for unknown values (Bug A propagation)', () => {
    // getDueDate passes through unknown strings unchanged.
    // This test documents the current behaviour — the caller must
    // validate the result before using it as a date.
    const result = getDueDate('different');
    expect(result).toEqual('different');
  });

  it('should return a valid ISO string for a valid ISO input', () => {
    const iso = new Date(2024, 5, 1).toISOString();
    expect(getDueDate(iso)).toEqual(iso);
  });
});

describe('getReminderDate', () => {
  const due = new Date(2024, 5, 1, 9, 0, 0, 0);

  it('should return null for NO_REMINDER', () => {
    expect(getReminderDate(due, ReminderOption.NO_REMINDER)).toBeNull();
  });

  it('should return a valid ISO string for MIN_30', () => {
    const result = getReminderDate(due, ReminderOption.MIN_30);
    expect(result).toBeTruthy();
    expect(new Date(result!).valueOf()).not.toBeNaN();
  });

  // Bug E: calling getReminderDate with an Invalid Date throws because
  // Date arithmetic on NaN yields NaN, and toISOString() throws RangeError.
  // Callers must validate the date before calling getReminderDate.
  it('should throw when given an Invalid Date (Bug E scenario)', () => {
    const invalidDate = new Date('different');
    expect(() => getReminderDate(invalidDate, ReminderOption.MIN_30)).toThrow();
  });
});
