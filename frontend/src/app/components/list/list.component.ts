import { Component, ElementRef, Input, OnDestroy, Signal, ViewChild, WritableSignal, computed, effect, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DataService } from '../../services/data/data.service';
import { AuthService } from '../../services/auth/auth.service';
import { MyListsDocument } from '../../mydb/types/lists';
import { Slot, groupItems } from '../../../models/categories';
import { MyItemDocument, newItem } from '../../mydb/types/list-item';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material.module';
import { NameBadgePipe } from '../../pipes/name-badge.pipe';
import { ListItemComponent } from './list-item/list-item.component';
import { MyMeDocument } from '../../mydb/types/me';
import { Subscription } from 'rxjs';
import { MyUsersDocument } from '../../mydb/types/users';
import { UsersService } from '../../services/users/users.service';
import { DueOption, DueOptionLabels, getDueDate } from '../selects/date-chip-select/options';
import { DateChipSelectComponent } from '../selects/date-chip-select/date-chip-select.component';
import { ListHeaderComponent } from './list-header/list-header.component';

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MaterialModule,
    RouterModule,
    ReactiveFormsModule,
    NameBadgePipe,
    ListItemComponent,
    DateChipSelectComponent,
    ListHeaderComponent
  ],
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent implements OnDestroy {
  @ViewChild('addInput') addInput!: ElementRef;

  @Input()
  set id(id: string) {
    if (!!id) {
      this.list = this.dataService.db.lists.findOne({
        selector: { id }
      }).$$ as Signal<MyListsDocument>;

      this.listItems = this.dataService.db.items.find({
        selector: {lists: id }
      }).$$ as Signal<MyItemDocument[]>;
    } else {
      this.router.navigateByUrl('/user/lists');
    }
  }
  
  me: Signal<MyMeDocument>;
  list!: Signal<MyListsDocument>;
  listItems!: Signal<MyItemDocument[]>;

  users$?: Subscription;
  users: WritableSignal<MyUsersDocument[]> = signal([]);

  newItem = new FormControl('');
  focusInput: boolean = false;
  newItemDue = new FormControl<string>(DueOption.SOMETIME);
  dueOptions = DueOptionLabels;
  initialized = false;
  pickerOpen = false;

  slots: Signal<Slot[]> = computed(() => {
    if (this.listItems() && this.list()) {
      return this.groupItems(this.list(), this.listItems());
    }
    return [];
  });
  slotCollapseStates: {[key: string]: boolean} = {};

  constructor(
    private router: Router,
    private authService: AuthService,
    private snackbar: MatSnackBar,
    private dataService: DataService,
    private usersService: UsersService
  ) {
    this.me = this.authService.me;

    effect(() => {
      // handle if a list gets deleted while the list is opened
      if(this.initialized && (!this.list() || this.list()._deleted)) {
        const snackbar = this.snackbar.open('Liste wurde gelöscht', 'Ok');
        snackbar.afterDismissed().subscribe(() => {
          this.router.navigateByUrl('/user/lists');
        });
      
      // make sure a list was loaded before
      } else if (!this.initialized && !!this.list()) {
        this.initialized = true;
        const users = this.usersService.getMany(this.list().users());
        this.users$ = users.subscribe(u => this.users.set(u));
      }
    });
  }

  ngOnDestroy() {
    this.users$?.unsubscribe();
  }

  groupItems(list: MyListsDocument, items: MyItemDocument[]): Slot[] {
    if (items && list) {
      const slots = groupItems(items, list.isShoppingList, this.dataService.groceryCategories);

      slots.forEach(s => {
        if (!(s.name in this.slotCollapseStates)) {
          this.slotCollapseStates[s.name] = true;
        }
      });

      return slots;
    }

    return [];
  }
  
  addItem() {
    if (this.list && this.list() &&
        this.me && this.me() &&
        this.newItem.value !== ''
      ) {
      const due = getDueDate(this.newItemDue.value || '');

      const item = {
        name: this.newItem.value,
        due: due,
        createdBy: {id: this.me().id, name: this.me.name},
        lists: this.list().id
      };

      this.dataService.db.items.insert(
        newItem(item, this.me().defaultReminder)
      ).then(() => {
        this.newItem.reset();
        this.focusInput = false;
        this.newItemDue.setValue(DueOption.SOMETIME);
      });
    }
  }

  openFocusInput(event: Event) {
    event.stopPropagation();
    this.focusInput = true;
    
    if (!this.pickerOpen) {
      this.addInput.nativeElement.focus();
    }
  }

  closeFocusInput(event: Event) {
    // picker was open && add form is in focus
    //    => focus input and set pickerOpen to false
    // picker was not open && add form is in focus
    //    => remove focus on add form
    // some click occured on the add form
    //    => focus add input

    if (this.pickerOpen && this.focusInput) {
      event.stopPropagation();
      this.addInput.nativeElement.focus();
      this.pickerOpen = false;

    } else if (!this.pickerOpen && this.focusInput) {
      event.stopPropagation();
      this.focusInput = false;

    } else {
      event.stopPropagation();
      this.addInput.nativeElement.focus();
    }
  }

  listToText() {
    const done = '✓';
    const open = '☐';
    const indent = '  ';

    if (this.list()) {
      let listStr = this.list().name + '\n\n';
      this.slots().forEach(slot => {
        if (slot.items.length > 0) {
          
          listStr += indent + slot.name + '\n\n';
          
          slot.items.forEach(item => {
            const mark = item.done ? done : open;
            listStr += indent + indent + mark + ' ' + item.name + '\n';
          });
          
          listStr += '\n';
        }
        
      });

      // check if mobile
      if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && !!navigator.share) {
        navigator.share({text: listStr, title: this.list().name});
      } else {
        navigator.clipboard.writeText(this.list().name + '\n\n' + listStr);
        this.snackbar.open('Liste in die Zwischenablage kopiert!', 'Ok');
      }
    }
  }

  userIsAdmin() {
    return !!this.me()?.id && this.me()?.id === this.list()?.createdBy;
  }
}
