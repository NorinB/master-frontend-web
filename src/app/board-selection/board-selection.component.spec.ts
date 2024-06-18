import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoardSelectionComponent } from './board-selection.component';

describe('BoardSelectionComponent', () => {
  let component: BoardSelectionComponent;
  let fixture: ComponentFixture<BoardSelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardSelectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BoardSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
