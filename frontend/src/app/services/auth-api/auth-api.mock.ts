import { AuthApiService } from "./auth-api.service";

export function getAuthApiMock() {
    return jasmine.createSpyObj('AuthApiService',
        ['validateLogin', 'login', 'register', 'logout', 'verifyEmail', 'changeEmail', 'changePwd', 'forgotPwd', 'resetPwd', 'shareLists', 'unshareLists', 'pushSubscribe', 'resendVerificationMail']) as jasmine.SpyObj<AuthApiService>;
}