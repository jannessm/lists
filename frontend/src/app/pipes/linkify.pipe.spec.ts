import { DomSanitizer } from '@angular/platform-browser';
import { LinkifyPipe } from './linkify.pipe';
import { inject } from '@angular/core';

describe('LinkifyPipe', () => {
  it('create an instance', () => {
    const sanitizer = inject(DomSanitizer)
    const pipe = new LinkifyPipe(sanitizer);
    expect(pipe).toBeTruthy();
  });
});
