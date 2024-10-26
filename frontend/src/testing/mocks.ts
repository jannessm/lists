export const CookieServiceMock = jasmine.createSpyObj('CookieService', ['check', 'delete', 'set']);


/********* Angular ************/
export const HttpClientMock = jasmine.createSpyObj('HttpClient', ['get', 'post', 'put']);


/********* Material ***********/
export class MatBottomSheetMock {
    open = jasmine.createSpy('open').and.returnValue(MatBottomSheetRefMock)
};
export const MatBottomSheetRefMock = jasmine.createSpyObj('MatBottomSheetRef', ['afterDissmissed', 'dismiss']);

export const MatSnackBarMock = jasmine.createSpyObj('MatSnackBar', ['open']);
export const MatSnackBarRefMock = jasmine.createSpyObj('MatSnackBarRefMock', ['dismiss']);