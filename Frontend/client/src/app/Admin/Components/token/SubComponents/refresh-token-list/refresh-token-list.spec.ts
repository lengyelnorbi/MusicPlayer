import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RefreshTokenList } from './refresh-token-list';

describe('RefreshTokenList', () => {
  let component: RefreshTokenList;
  let fixture: ComponentFixture<RefreshTokenList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RefreshTokenList],
    }).compileComponents();

    fixture = TestBed.createComponent(RefreshTokenList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
