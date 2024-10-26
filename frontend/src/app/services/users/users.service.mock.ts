import { of } from "rxjs";

export class UsersServiceSpy {
  get = jasmine.createSpy('get').and.callFake(() => of(undefined));
  getMany = jasmine.createSpy('getMany').and.callFake(() => of([]));
  byIds = jasmine.createSpy('byIds').and.callFake(() => of([]));
}