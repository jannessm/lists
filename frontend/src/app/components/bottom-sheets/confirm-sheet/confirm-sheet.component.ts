import { Component, Inject } from '@angular/core';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { MaterialModule } from '../../../material.module';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-sheet',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule
  ],
  templateUrl: './confirm-sheet.component.html',
  styleUrls: ['./confirm-sheet.component.scss']
})
export class ConfirmSheetComponent {

  constructor(
    public bottomSheetRef: MatBottomSheetRef<ConfirmSheetComponent>,
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: string) { }

}
