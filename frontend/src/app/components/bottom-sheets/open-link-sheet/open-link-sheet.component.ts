import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-open-link-sheet',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule
  ],
  templateUrl: './open-link-sheet.component.html',
  styleUrls: ['./open-link-sheet.component.scss', '../styles.scss']
})
export class OpenLinkSheetComponent {
  links: string[] = [];

  constructor(
    public bottomSheetRef: MatBottomSheetRef<OpenLinkSheetComponent>,
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: string[]) { }

  openLink(link: string) {
    window.open(link, '_blank');
  }

}
