export const CookieServiceMock = jasmine.createSpyObj('CookieService', ['check', 'delete', 'set']);


/********* Angular ************/
export const HttpClientMock = jasmine.createSpyObj('HttpClient', ['get', 'post', 'put']);


/********* Material ***********/
export const MatBottomSheetMock = jasmine.createSpyObj('MatBottomSheet', ['open']);
export const MatSnackBarMock = jasmine.createSpyObj('MatSnackBar', ['open']);