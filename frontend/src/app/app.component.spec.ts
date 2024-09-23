import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AppComponent } from './app.component';
import { MockPusherService } from './services/pusher/pusher.service.mock';
import { PusherService } from './services/pusher/pusher.service';
import { AuthService } from './services/auth/auth.service';
import { DataService } from './services/data/data.service';
import { Router } from '@angular/router';
import { ThemeService } from './services/theme/theme.service';
import { CookieService } from 'ngx-cookie-service';
import { SwUpdate } from '@angular/service-worker';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { WebPushService } from './services/web-push/web-push.service';
import { IosService } from './services/ios/ios.service';
import { of } from 'rxjs';

let mockThemeService: jasmine.SpyObj<ThemeService>;
let mockCookieService: jasmine.SpyObj<CookieService>;
let mockSwUpdate: jasmine.SpyObj<SwUpdate>;
let mockBottomSheet: jasmine.SpyObj<MatBottomSheet>;


describe('AppComponent', () => {
  beforeEach(async () => {
    const MockThemeService = jasmine.createSpyObj('ThemeService', ['isDark']);
    const MockCookieService = jasmine.createSpyObj('CookieService', ['check', 'set']);
    const MockSwUpdate = jasmine.createSpyObj('SwUpdate', [], {isEnabled: false, versionUpdates: of({type: 'blub'})});
    const MockBottomSheet = jasmine.createSpyObj('MatBottomSheet', ['open']);


    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        { provide: PusherService, useClass: {} },
        { provide: AuthService, useClass: {} },
        { provide: DataService, useClass: {} },
        { provide: Router, useClass: {} },
        { provide: WebPushService, useClass: {} },
        { provide: IosService, useClass: {} },
        { provide: ThemeService, useClass: MockThemeService },
        { provide: CookieService, useClass: MockCookieService },
        { provide: SwUpdate, useClass: MockSwUpdate },
        { provide: MatBottomSheet, useClass: MockBottomSheet },
      ]
    }).compileComponents();

    mockThemeService = TestBed.inject(ThemeService) as jasmine.SpyObj<ThemeService>;
    mockCookieService = TestBed.inject(CookieService) as jasmine.SpyObj<CookieService>;
    mockSwUpdate = TestBed.inject(SwUpdate) as jasmine.SpyObj<SwUpdate>;
    mockBottomSheet = TestBed.inject(MatBottomSheet) as jasmine.SpyObj<MatBottomSheet>;
  });

  it('should create the app', () => {
    mockThemeService.isDark.and.returnValue(true);
    mockCookieService.check.and.returnValue(false);
    
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have the 'Lists' title`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('Lists');
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Hello, frontend');
  });
});
