import { Component, ElementRef, EventEmitter, Input, Output, Signal, ViewChild, effect } from '@angular/core';
import { environment } from '../../../environments/environment';

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
        // Configure hCaptcha
        const options = {
          sitekey: environment.hcaptcha,
          callback: (res: string) => { this.verify.emit(res) },
          'expired-callback': (res: any) => { this.expired.emit(res) },
          'error-callback': (err: any) => { this.error.emit(err) }
        };

        // Render hCaptcha using the defined options
        this.widgetId = window.hcaptcha.render(this.captcha.nativeElement, options);
      }
    });
  }
}
