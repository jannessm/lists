import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';

@NgModule({
  declarations: [],
  imports: [
    MatButtonModule,
    MatFormFieldModule,
  ],
  exports: [
    MatButtonModule,
    MatFormFieldModule
  ],
})
export class MaterialModule {}