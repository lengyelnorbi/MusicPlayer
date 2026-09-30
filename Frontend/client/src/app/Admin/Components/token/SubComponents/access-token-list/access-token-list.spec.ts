import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccessTokenList } from './access-token-list';

describe('AccessTokenList', () => {
  let component: AccessTokenList;
  let fixture: ComponentFixture<AccessTokenList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccessTokenList],
    }).compileComponents();

    fixture = TestBed.createComponent(AccessTokenList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
