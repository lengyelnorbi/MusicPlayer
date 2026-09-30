import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminMusic } from './admin-music';

describe('AdminMusic', () => {
  let component: AdminMusic;
  let fixture: ComponentFixture<AdminMusic>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminMusic],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminMusic);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
