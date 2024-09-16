import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBarRef } from '@angular/material/snack-bar';

@Component({
  selector: 'app-ios-installer-push',
  standalone: true,
  imports: [
    MatIconModule,
    MatSnackBarModule,
    MatButtonModule
  ],
  templateUrl: './ios-installer-push.component.html',
  styleUrl: './ios-installer-push.component.scss'
})
export class IosInstallerPushComponent {
  snackBarRef = inject(MatSnackBarRef);
}
