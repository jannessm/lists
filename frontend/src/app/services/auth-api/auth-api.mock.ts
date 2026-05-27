import { of } from "rxjs";
import { AuthApiService } from "./auth-api.service";

export function getAuthApiMock() {
    const mock = jasmine.createSpyObj('AuthApiService',
        [
            'validateLogin',
            'login',
            'register',
            'logout',
            'verifyCode',
            'resendCode',
            'changeEmail',
            'shareLists',
            'unshareLists',
            'pushSubscribe',
            'refreshCSRF'
        ]) as jasmine.SpyObj<AuthApiService>;
    
    mock.refreshCSRF.and.returnValue(of());
    return mock;
}