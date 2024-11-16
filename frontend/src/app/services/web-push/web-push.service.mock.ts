export class WebPushServiceSpy {
    subscribeChallenged = false;

    settings = jasmine.createSpy('settings').and.returnValue({});
    sub = jasmine.createSpy('sub').and.returnValue({});
    subscribe = jasmine.createSpy('subscribe').and.returnValue({});
    patchSettings = jasmine.createSpy('patchSettings').and.returnValue({});
}