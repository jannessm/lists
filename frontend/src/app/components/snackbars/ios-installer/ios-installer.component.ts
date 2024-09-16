import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBarRef } from '@angular/material/snack-bar';

@Component({
  selector: 'app-ios-installer',
  standalone: true,
  imports: [
    MatIconModule,
    MatSnackBarModule,
    MatButtonModule
  ],
  templateUrl: './ios-installer.component.html',
  styleUrl: './ios-installer.component.scss'
})
export class IosInstallerComponent {
  snackBarRef = inject(MatSnackBarRef);
}
