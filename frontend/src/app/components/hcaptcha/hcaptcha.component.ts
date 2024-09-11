import { Component, ElementRef, EventEmitter, Input, Output, Signal, ViewChild, effect } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable, Subscriber } from 'rxjs';

declare const window: any;

@Component({
  selector: 'app-hcaptcha',
  standalone: true,
  imports: [

  ],
  templateUrl: './hcaptcha.component.html',
  styleUrl: './hcaptcha.component.scss'
})
export class HCaptchaComponent {

  @ViewChild('captcha', {static: true}) captcha!: ElementRef;
  
  @Input() init!: Signal<boolean>;
  @Output() verify = new EventEmitter<string>();
  @Output() expired = new EventEmitter<any>();
  @Output() error = new EventEmitter<any>();

  private widgetId?: string;

  constructor() {
    effect(() => {
      if (this.init() && this.captcha.nativeElement) {
        this.loadHCaptcha().subscribe(() => {
          // Configure hCaptcha
          const options = {
            sitekey: environment.hcaptcha,
            callback: (res: string) => { this.verify.emit(res) },
            'expired-callback': (res: any) => { this.expired.emit(res) },
            'error-callback': (err: any) => { this.error.emit(err) }
          };
      
          // Render hCaptcha using the defined options
          this.widgetId = window.hcaptcha.render(this.captcha.nativeElement, options);
        });
      }
    });
  }

  /**
   * Load the hCaptcha script by appending a script element to the head element.
   * The script won't be loaded again if it has already been loaded.
   * Async and defer are set to prevent blocking the renderer while loading hCaptcha.
   */
  loadHCaptcha(languageCode?: string): Observable<void> {
    return new Observable<void>((observer: Subscriber<void>) => {
      // No window object (ssr)
      if (!window) {
        return;
      }

      // The hCaptcha script has already been loaded
      if (typeof window.hcaptcha !== 'undefined') {
        observer.next();
        observer.complete();
        return;
      }

      let src = 'https://hcaptcha.com/1/api.js?render=explicit';

      // Set language code
      if (languageCode) {
        src += `&hl=${languageCode}`;
      }

      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.defer = true;
      script.onerror = (e) => observer.error(e);
      script.onload = () => {
        observer.next();
        observer.complete();
      };
      document.head.appendChild(script);
    });
  }
}
