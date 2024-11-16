import { DomSanitizer } from '@angular/platform-browser';
import { LinkifyPipe } from './linkify.pipe';
import { inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';

describe('LinkifyPipe', () => {
  let domSanitizerMock: jasmine.SpyObj<DomSanitizer>;

  beforeEach(async () => {
    const DomSanitizer = jasmine.createSpyObj('DomSanitizer', ['sanitize']);
    
    await TestBed.configureTestingModule({
      providers: [
        { provide: DomSanitizer, useValue: DomSanitizer },
      ]
    }).compileComponents();

    domSanitizerMock = TestBed.inject(DomSanitizer);
  })

  it('create an instance', () => {
    const pipe = new LinkifyPipe(domSanitizerMock);
    expect(pipe).toBeTruthy();
  });
});
