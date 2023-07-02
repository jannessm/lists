import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { List, ListItem } from 'src/app/models/lists';

@Component({
  selector: 'app-update-item-sheet',
  templateUrl: './update-item-sheet.component.html',
  styleUrls: ['./update-item-sheet.component.scss']
})
export class UpdateItemSheetComponent {
  form: FormGroup;
  list: List;
  timezone: string | undefined;

  constructor(
    public bottomSheetRef: MatBottomSheetRef<UpdateItemSheetComponent>,
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: {list:List, item: ListItem},
    private fb: FormBuilder
  ) {
    this.list = data.list;
    this.form = fb.group({
      'name': [data.item.name, Validators.required],
      'hasDate': [!!data.item.time],
      'time': [{value: data.item.time?.toISOString().slice(0,16), disabled: !data.item.time}]
    });

    this.form.get('hasDate')?.valueChanges.subscribe(val => {
      const timeControl = this.form.get('time');
      if (timeControl && !val) {
        timeControl.disable();
      } else if (timeControl) {
        timeControl.enable();

        if (!timeControl.value) {
          const now = new Date();
          now.setDate(now.getDate() + 1);

          const month = ("0" + (now.getMonth() + 1)).slice(-2);
          const day = ("0" + now.getDate()).slice(-2);
          const hour = ("0" + now.getHours()).slice(-2);
          const minute = ("0" + now.getMinutes()).slice(-2);
          
          const today = now.getFullYear()+'-'+month+'-'+day+'T'+hour+':'+minute;

          timeControl.setValue(today);
        }
      }
    })

    if (data.item.time) {
      this.timezone = data.item.time.toISOString().slice(16);
    }
  }

  returnFormContent() {
    let time_val = this.form.controls['time'].value;
    if (this.timezone) {
      time_val += this.timezone;
    }

    this.bottomSheetRef.dismiss({
      'name': this.form.controls['name'].value.trim(),
      'time': time_val,
      'remind': this.form.controls['hasDate'].value
    });
  }
}
