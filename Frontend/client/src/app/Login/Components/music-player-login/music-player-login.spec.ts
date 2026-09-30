import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MusicPlayerLogin } from './music-player-login';

describe('MusicPlayerLogin', () => {
  let component: MusicPlayerLogin;
  let fixture: ComponentFixture<MusicPlayerLogin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MusicPlayerLogin],
    }).compileComponents();

    fixture = TestBed.createComponent(MusicPlayerLogin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
