import { Component, Inject } from '@angular/core';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';

@Component({
  selector: 'app-confirm-delete',
  templateUrl: './confirm-delete-sheet.component.html',
  styleUrls: ['./confirm-delete-sheet.component.scss']
})
export class ConfirmDeleteSheetComponent {

  constructor(
    public bottomSheetRef: MatBottomSheetRef<ConfirmDeleteSheetComponent>,
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: string,
  ) { }

}
