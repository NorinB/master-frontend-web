import { TestBed } from '@angular/core/testing';

import { WasmWebtransportService } from './wasm-webtransport.service';

describe('WasmWebtransportService', () => {
  let service: WasmWebtransportService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WasmWebtransportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
