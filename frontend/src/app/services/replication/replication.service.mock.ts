export class ReplicationServiceMock {
    replications = {};
    streamSubjects = {};
    lastPusherState = false;

    setupReplication = jasmine.createSpy('setupReplication').and.returnValue(Promise.resolve());
    initStream = jasmine.createSpy('initStream').and.returnValue(Promise.resolve());
  }