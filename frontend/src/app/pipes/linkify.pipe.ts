import { Pipe, PipeTransform, SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({
  name: 'linkify',
  standalone: true
})
export class LinkifyPipe implements PipeTransform {

  constructor(private domSanitizer: DomSanitizer) {}

  transform(value: string, ...args: unknown[]): unknown {
    return this.domSanitizer.sanitize(SecurityContext.HTML, this.parseLinks(value));
  }

  parseLinks(text: string) {
    let parsedText = '';

    if (text && text.length > 0) {
      for (let line of text.split('\n')) {
        for (let t of line.split(' ')) {
          if (isValidUrl(t)) {
            parsedText += `<a href="${t}" target="_blank">${t}</a> `;
          } else {
            parsedText += t + ' ';
          }
        }
        parsedText += '<br>';
      }

      return parsedText;
    }

    return text;
  }

}

export function isValidUrl(str: string): boolean {
  const regex = /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z0-9]{2,}(\/[^\s]*)?$/i;
  return regex.test(str);
}
