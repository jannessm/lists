import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'nameBadge',
  standalone: true
})
export class NameBadgePipe implements PipeTransform {

  transform(value?: string): string {
    if (!value) return '';
    const splitted = value.split(' ').slice(0, 2);
    if (splitted.length > 1 && splitted.reduce((prev, curr) => prev && curr.length > 0, true)) {
      return splitted.map(word => word[0].toUpperCase())
                  .join('');
    } else {
      return value.substring(0, 2).toUpperCase();
    }
  }

}
