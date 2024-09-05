import { Injectable } from '@angular/core';
import { DataService } from '../data/data.service';

@Injectable({
  providedIn: 'root'
})
export class TimezoneService {

  constructor(
    private dataService: DataService
  ) {
    const currTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const lastTimezone = localStorage.getItem('lastTimeZone');
    
    if (!lastTimezone) {
      localStorage.setItem('lastTimeZone', currTimezone);
    } else if (currTimezone !== lastTimezone) {
      this.changeAllTimezones(currTimezone);
    }
  }

  changeAllTimezones(timezone: string) {
    this.dataService.db.items.find().bulkPatch({timezone});
  }
}
