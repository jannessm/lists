import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { IosInstallerComponent } from '../../components/snackbars/ios-installer/ios-installer.component';

@Injectable({
  providedIn: 'root'
})
export class IosService {
  isInstalled: boolean = false;
  isIos: boolean = false;

  constructor(snackBar: MatSnackBar) {
    this.isInstalled = window.matchMedia('(display-mode: standalone)').matches || document.referrer.startsWith('android-app://');
    this.isIos = this.iOS();

    if (!this.isInstalled && this.isIos) {
      snackBar.openFromComponent(IosInstallerComponent);
    }
  }

  iOS() {
    return [
      'iPad Simulator',
      'iPhone Simulator',
      'iPod Simulator',
      'iPad',
      'iPhone',
      'iPod'
    ].includes(navigator.platform)
    // iPad on iOS 13 detection
    || (navigator.userAgent.includes("Mac") && "ontouchend" in document)
  }
}
