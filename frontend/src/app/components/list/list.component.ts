import { AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, Signal, ViewChild, WritableSignal, computed, effect, signal } from '@angular/core';
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
import { DueOption, DueOptionLabels, getDueDate, getReminderDate } from '../selects/date-chip-select/options';
import { DateChipSelectComponent } from '../selects/date-chip-select/date-chip-select.component';
import { ListHeaderComponent } from './list-header/list-header.component';
import { DATA_TYPE } from '../../mydb/types/graphql-types';

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
export class ListComponent implements AfterViewInit, OnDestroy {
  @ViewChild('addInput') addInput!: ElementRef;
  @ViewChild('overlay') overlay!: ElementRef;

  @Input()
  set id(id: string) {
    if (!!id) {
      this.listSub = this.dataService.db.lists.findOne({
        selector: { id }
      }).$.subscribe((list: unknown) => {
        if (!!list) {
          this.list.set(list as MyListsDocument);
        }
      });

      this.listItemsSub = this.dataService.db.items.find({
        selector: { lists: id },
      }).$.subscribe((items: unknown[]) => {
        if (Array.isArray(items)) {
          this.listItems.set(items as MyItemDocument[]);
        }
      });
    } else {
      this.router.navigateByUrl('/user/lists');
    }
  }
  
  me: Signal<MyMeDocument | undefined>;
  list: WritableSignal<MyListsDocument | undefined> = signal(undefined);
  listItems: WritableSignal<MyItemDocument[]> = signal([]);
  listSub?: Subscription;
  listItemsSub?: Subscription;

  users$?: Subscription;
  users: WritableSignal<MyUsersDocument[]> = signal([]);

  newItem = new FormControl('');
  focusInput: boolean = false;
  newItemDue = new FormControl<string>(DueOption.SOMETIME);
  dueOptions = DueOptionLabels;
  dueDefault = DueOption.SOMETIME;
  initialized = false;
  pickerOpen = false;
  ignoreNext = false;

  slots: Signal<Slot[]> = computed(() => {
    const list = this.list();
    if (this.listItems() && !!list) {
      return this.groupItems(list, this.listItems());
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
      const me = this.me();
      const list = this.list();
      // handle if a list gets deleted while the list is opened
      if(!!list && !!me && !me.hasLists(list.id)) {
        const snackbar = this.snackbar.open('Liste wurde gelöscht', 'Ok');
        snackbar.afterDismissed().subscribe(() => {
          this.router.navigateByUrl('/user/lists');
        });
      
      // make sure a list was loaded before
      } else if (!!list) {
        const users = this.usersService.getMany(list.users());
        this.users$ = users.subscribe(u => this.users.set(u));
      }
    });
  }

  ngAfterViewInit(): void {
    this.dataService.resync(DATA_TYPE.LIST_ITEM);
  }

  ngOnDestroy() {
    this.users$?.unsubscribe();
  }

  groupItems(list: MyListsDocument, items: MyItemDocument[]): Slot[] {
    if (items && list && items.length > 0 && !!items[0]) {
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
    if (!this.focusInput) {
      return;
    }

    const me = this.me();
    const list = this.list();

    if (!!list && !!me &&
        !!this.newItem.value?.trim()
      ) {
      const due = getDueDate(this.newItemDue.value || '');

      const item = {
        name: this.newItem.value,
        due: due,
        createdBy: me.id,
        lists: list.id
      };

      const defaultReminder = me.defaultReminder;
      if (!!due && !!defaultReminder) {
        Object.assign(item, {
          reminder: getReminderDate(new Date(due), defaultReminder)
        })
      }

      this.dataService.db.items.insert(
        newItem(item)
      ).then(() => {
        this.newItem.reset();
        this.newItemDue.setValue(DueOption.SOMETIME);
        this.closeFocusInput();
      });
    }
  }

  openFocusInput(event: Event) {
    event.stopPropagation();
    this.focusInput = true;
    
    setTimeout(() => {
      if (!this.pickerOpen) {
        this.addInput.nativeElement.focus();
      }
    }, 10);
  }

  closeFocusInput(event?: Event) {
    if (this.ignoreNext) {
      this.ignoreNext = false;
      this.addInput.nativeElement.focus();
      return;
    }
    // picker was open && add form is in focus
    //    => focus input and set pickerOpen to false
    // picker was not open && add form is in focus
    //    => remove focus on add form
    // some click occured on the content
    //    => remove focus 
    if (this.pickerOpen && this.focusInput) {
      this.pickerOpen = false;
      this.ignoreNext = true;

    } else if (event && !this.pickerOpen && this.focusInput) {
      event.stopPropagation();
      this.focusInput = false;

    } else if (event) {
      event.stopPropagation();
    } else {
      setTimeout(() => {
        this.focusInput = false;
        this.addInput.nativeElement.blur();
      }, 10);
    }
  }

  listToText() {
    const done = '✓';
    const open = '☐';
    const indent = '  ';

    const list = this.list();

    if (!!list) {
      let listStr = list.name + '\n\n';
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
        navigator.share({text: listStr, title: list.name});
      } else {
        navigator.clipboard.writeText(list.name + '\n\n' + listStr);
        this.snackbar.open('Liste in die Zwischenablage kopiert!', 'Ok');
      }
    }
  }

  userIsAdmin() {
    const me = this.me();
    const list = this.list();
    
    return !!me && !!list && !!me.id && me.id === list.createdBy;
  }
}
