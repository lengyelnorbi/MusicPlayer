import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminNavigation } from './admin-navigation';

describe('AdminNavigation', () => {
  let component: AdminNavigation;
  let fixture: ComponentFixture<AdminNavigation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminNavigation],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminNavigation);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
