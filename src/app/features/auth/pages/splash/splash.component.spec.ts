import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { SplashComponent } from './splash.component';

describe('SplashComponent', () => {
  let component: SplashComponent;
  let fixture: ComponentFixture<SplashComponent>;
  let routerSpy: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    vi.useFakeTimers();
    routerSpy = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [SplashComponent],
      providers: [{ provide: Router, useValue: routerSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(SplashComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create the splash component', () => {
    expect(component).toBeTruthy();
  });

  it('should navigate to /login after 2500ms', () => {
    fixture.detectChanges();
    expect(routerSpy.navigate).not.toHaveBeenCalled();

    vi.advanceTimersByTime(2500);

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should clear timer on destroy to prevent leak/navigation', () => {
    fixture.detectChanges();
    fixture.destroy();

    vi.advanceTimersByTime(2500);

    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });
});
