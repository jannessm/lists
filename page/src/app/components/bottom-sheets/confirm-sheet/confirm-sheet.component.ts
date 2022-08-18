import { Component, Inject, OnInit } from '@angular/core';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';

@Component({
  selector: 'app-confirm-sheet',
  templateUrl: './confirm-sheet.component.html',
  styleUrls: ['./confirm-sheet.component.scss']
})
export class ConfirmSheetComponent {

  constructor(
    public bottomSheetRef: MatBottomSheetRef<ConfirmSheetComponent>,
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: string) { }

}
