import { Component, EventEmitter, Input, Output, Signal, WritableSignal, signal } from '@angular/core';
import { MyListsDocument } from '../../../mydb/types/lists';
import { AddSheetComponent } from '../../bottom-sheets/add-sheet/add-sheet.component';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MaterialModule } from '../../../material.module';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmSheetComponent } from '../../bottom-sheets/confirm-sheet/confirm-sheet.component';
import { ShareListSheetComponent } from '../../bottom-sheets/share-list-sheet/share-list-sheet.component';
import { MyUsersDocument } from '../../../mydb/types/users';
import { AuthService } from '../../../services/auth/auth.service';
import { Router } from '@angular/router';
import { DataService } from '../../../services/data/data.service';
import { NameBadgePipe } from '../../../pipes/name-badge.pipe';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-list-header',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    NameBadgePipe
  ],
  templateUrl: './list-header.component.html',
  styleUrl: './list-header.component.scss'
})
export class ListHeaderComponent {
  @Input() lists!: Signal<MyListsDocument>;
  @Input() users: WritableSignal<MyUsersDocument[]> = signal([]);
  @Input() isAdmin = false;

  @Output() listToText = new EventEmitter<void>();

  constructor(
    private bottomSheet: MatBottomSheet,
    private snackbar: MatSnackBar,
    private authService: AuthService,
    private router: Router,
    private dataService: DataService
  ) {}

  listSettings() {
    if (this.lists && this.lists()) {
      const dialogRef = this.bottomSheet.open(AddSheetComponent, {
        data: this.lists()
      });
  
      dialogRef.afterDismissed().subscribe(new_values => {
        if (!!new_values && new_values.name === '') {
          this.snackbar.open('Name darf nicht leer sein.', 'Ok');
          return;
        }
        
        if (!!new_values && this.lists) {
          const patch = { };
          const list = this.lists();

          if (list.name !== new_values.name) {
            Object.assign(patch, {
              name: new_values.name
            });
          }
          
          if (list.isShoppingList !== new_values.isShoppingList) {
            Object.assign(patch, {
              isShoppingList: new_values.isShoppingList
            });
          }

          if (Object.keys(patch).length > 0) {
            this.lists().patch(patch);
          }
        }
      });
    }
  }

  shareList() {
    if (this.lists && this.lists()) {
      const dialogRef = this.bottomSheet.open(ShareListSheetComponent, {
        data: {
          lists: this.lists,
          isAdmin: this.isAdmin,
          users: this.users
        }
      });

      dialogRef.afterDismissed().subscribe(data => {
        if (!!data && this.lists && this.lists()) {

          // add
          if (!!data.email) {
            this.authService.shareLists(data.email, this.lists().id)
              .subscribe(success => {
                if (!success) {
                  this.snackbar.open('Einladung konnte nicht verschickt werden.', 'Ok');
                }
                this.snackbar.open('Einladung zum Beitreten der Liste wurde verschickt.', 'Ok');
              });
          
          // remove
          } else if (!!data.remove) {
            const removeUser = this.users().filter(u => u.id === data.remove)[0];

            if (!removeUser) {
              this.snackbar.open('Nutzer konnte nicht entfernt werden.', 'Ok');
              return;
            }

            const confirm = this.bottomSheet.open(ConfirmSheetComponent, {
              data: 'Lösche Nutzer ' + removeUser.name + ' aus dieser Liste.'
            });

            confirm.afterDismissed().subscribe(del => {
              if (!del) {
                return;
              }

              this.authService.unshareLists(data.remove, this.lists().id)
                .subscribe(success => {
                  if (!success) {
                    this.snackbar.open('Nutzer ' + removeUser.name + ' wurde entfernt.', 'Ok');
                  }
                  this.snackbar.open('Nutzer konnte nicht entfernt werden.', 'Ok');
                })
            })
          }
        }
      })
    }
  }

  deleteList() {
    if (this.lists && this.lists()) {
      const confirm = this.bottomSheet.open(ConfirmSheetComponent, {
        data: 'Lösche Liste ' + this.lists().name
      });
      
      confirm.afterDismissed().subscribe(del => {
        if (del && this.lists && this.lists()) {
          this.lists().remove().then(() => {
            this.router.navigate(['/user/lists']);
          });
        }
      })
    }
  }

  deleteAll() {
    const confirm = this.bottomSheet.open(ConfirmSheetComponent, {data: 'Lösche alle Einträge'});
    
    confirm.afterDismissed().subscribe(del => {
      if (this.lists && this.lists() && del) {
        this.dataService.db.items.find({
          selector: {
            lists: this.lists().id
          }
        }).remove();
      }
    });
  }

  deleteAllDone() {
    const confirm = this.bottomSheet.open(ConfirmSheetComponent, {data: 'Lösche alle erledigten Einträge'});
    
    confirm.afterDismissed().subscribe(del => {
      if (this.lists && this.lists() && del) {
        this.dataService.db.items.find({
          selector: {
            lists: this.lists().id,
            done: true
          }
        }).remove();
      }
    });
  }

  markAllNotDone() {
    if (this.lists && this.lists()) {
      this.dataService.db.items.find({
        selector: {
          lists: this.lists().id
        }
      }).patch({
        done: false
      });
    }
  }
}
