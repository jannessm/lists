import { of } from "rxjs";
import { AuthApiService } from "./auth-api.service";

export function getAuthApiMock() {
    const mock = jasmine.createSpyObj('AuthApiService',
        [
            'validateLogin',
            'login',
            'register',
            'logout',
            'verifyEmail',
            'changeEmail',
            'changePwd',
            'forgotPwd',
            'resetPwd',
            'shareLists',
            'unshareLists',
            'pushSubscribe',
            'resendVerificationMail',
            'refreshCSRF'
        ]) as jasmine.SpyObj<AuthApiService>;
    
    mock.refreshCSRF.and.returnValue(of());
    return mock;
}