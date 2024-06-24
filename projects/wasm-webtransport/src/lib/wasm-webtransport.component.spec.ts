import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WasmWebtransportComponent } from './wasm-webtransport.component';

describe('WasmWebtransportComponent', () => {
  let component: WasmWebtransportComponent;
  let fixture: ComponentFixture<WasmWebtransportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WasmWebtransportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WasmWebtransportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
