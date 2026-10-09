import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MusicImport } from './music-import';

describe('MusicImport', () => {
  let component: MusicImport;
  let fixture: ComponentFixture<MusicImport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MusicImport],
    }).compileComponents();

    fixture = TestBed.createComponent(MusicImport);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
