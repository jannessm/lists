import { itemsConflictHandler, newItem, splitName } from "./list-item";

describe('itemsConflictHandler', () => {

    it('if only forkstate is given, return fork state', () => {
        const forkState = newItem({name: 'hi'});
        
        const result = itemsConflictHandler(forkState, undefined, undefined);

        expect(result).toEqual(forkState);
    });

    it('if no assumedMaster is given, return fork state', () => {
        const forkState = newItem({name: 'hi'});
        const assumedMaster = newItem({name: 'hi2'});
        
        const result = itemsConflictHandler(forkState, assumedMaster, undefined);

        expect(result).toEqual(forkState);
    });

    it('if no trueMasterState is given, return fork state', () => {
        const forkState = newItem({name: 'hi'});
        const trueMaster = newItem({name: 'hi2'});
        
        const result = itemsConflictHandler(forkState, undefined, trueMaster);

        expect(result).toEqual(forkState);
    });

    it('if ids differ, return fork state', () => {
        const forkState = newItem({name: 'hi'});
        const assumedMaster = newItem({name: 'hi2'});
        const trueMaster = newItem({name: 'hi3'});
        
        const result = itemsConflictHandler(forkState, assumedMaster, trueMaster);

        expect(result).toEqual(forkState);
    });

    it('if trueMaster if different than assumedMaster, overwrite assumedMaster for name, description, reminder, due, timezone, done, updatedAt, _deleted', () => {
        const forkState = {
            id: '1234',
            name: 'hi',
            description: 'you',
            createdBy: 'me',
            reminder: 'date1',
            due: 'date2',
            timezone: 'de',
            lists: 'a list id',
            done: false,
            createdAt: 'one day ago',
            updatedAt: 'now',
            _deleted: false};
        const assumedMaster = JSON.parse(JSON.stringify(forkState));
        assumedMaster.name = 'hallo';
        const trueMaster = {
            id: '1234',
            name: 'hi',
            description: 'me',
            createdBy: 'you',
            reminder: 'date3',
            due: 'date4',
            timezone: 'en',
            lists: 'another list id',
            done: true,
            createdAt: 'two days ago',
            updatedAt: 'just now',
            _deleted: true} as any;
        
        // cannot change createdAt, createdBy, and lists
        // id needs to be the same (see test before)
        const assumedResult = {
            id: '1234',
            name: 'hi',
            description: 'me',
            createdBy: 'me',
            reminder: 'date3',
            due: 'date4',
            timezone: 'en',
            lists: 'a list id',
            done: true,
            createdAt: 'one day ago',
            updatedAt: 'just now',
            _deleted: true} as any;

        const result = itemsConflictHandler(forkState, assumedMaster, trueMaster);

        expect(result).toEqual(assumedResult);
    });
});

describe('splitName', () => {

  it('should do nothing if name is smaller than 50 characters', () => {
    const testData = ['', 'test', '01234567890123456789012345678901234567890123456789'];

    testData.forEach((name) => {
      const state = newItem({ name: name, description: null });
      const result = splitName(state);
      expect(result.name).toEqual(name);
      expect(result.description).toBeNull();
    });
  });

  it('should move the name to description if the name is too long (more than 50 characters)', () => {
    const name = '012345678901234567890123456789012345678901234567891';
    const state = newItem({ name: name, description: null });
    const result = splitName(state);
    expect(result.name).toEqual('');
    expect(result.description).toEqual(name);
  });

  it('should move URL to description even if the URL is too short', () => {
    const testData = [
      { name: 'https://test.com', newName: 'test.com' },
    ];

    testData.forEach(({ name, newName }) => {
      const state = newItem({ name: name, description: null });
      const result = splitName(state);
      expect(result.name).toEqual(newName);
      expect(result.description).toEqual(name);
    });
  });

  it('should move URL to description without adding host to name', () => {
    const testData = [
      { name: 'a test https://test.com', newName: 'a test', newDescription: 'https://test.com' }
    ];

    testData.forEach(({ name, newName, newDescription }) => {
      const state = newItem({ name: name, description: null });
      const result = splitName(state);
      expect(result.name).toEqual(newName);
      expect(result.description).toEqual(newDescription);
    });
  });

  it('should add the old description at the bottom if there is a name and description', () => {
    const testData = [
      {
        name: '0123456789012345678901234567890123456789 0123456789',
        description: 'a test',
        newName: '0123456789012345678901234567890123456789',
        newDescription: '0123456789\n\na test'
      }
    ];

    testData.forEach(({ name, description, newName, newDescription }) => {
      const state = newItem({ name: name, description: description });
      const result = splitName(state);
      expect(result.name).toEqual(newName);
      expect(result.description).toEqual(newDescription);
    });
  });

  it('should do nothing if only description is given (name is empty)', () => {
    const testData = [
      { name: '', description: 'a test', newName: '', newDescription: 'a test' }
    ];

    testData.forEach(({ name, description, newName, newDescription }) => {
      const state = newItem({ name: name, description: description });
      const result = splitName(state);
      expect(result.name).toEqual(newName);
      expect(result.description).toEqual(newDescription);
    });
  });

});
