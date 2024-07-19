import { Component } from '@angular/core';
import { MaterialModule } from '../../../material.module';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';

@Component({
  selector: 'app-verify-mail',
  standalone: true,
  imports: [
    MaterialModule
  ],
  templateUrl: './verify-mail.component.html',
  styleUrls: ['./verify-mail.component.scss', '../styles.scss']
})
export class VerifyMailComponent {

  constructor(public bottomSheetRef: MatBottomSheetRef<VerifyMailComponent>) {}
}