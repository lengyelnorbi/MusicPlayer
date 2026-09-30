import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MusicList } from './music-list';

describe('MusicList', () => {
  let component: MusicList;
  let fixture: ComponentFixture<MusicList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MusicList],
    }).compileComponents();

    fixture = TestBed.createComponent(MusicList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
