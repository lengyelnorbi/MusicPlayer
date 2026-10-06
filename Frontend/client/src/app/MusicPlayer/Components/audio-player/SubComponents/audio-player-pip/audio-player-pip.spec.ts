import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AudioPlayerPip } from './audio-player-pip';

describe('AudioPlayerPip', () => {
  let component: AudioPlayerPip;
  let fixture: ComponentFixture<AudioPlayerPip>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AudioPlayerPip],
    }).compileComponents();

    fixture = TestBed.createComponent(AudioPlayerPip);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
