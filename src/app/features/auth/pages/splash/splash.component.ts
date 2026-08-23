import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';

/**
 * SplashComponent
 * ----------------
 * Initial screen displayed when the AriaHR application starts.
 * Displays only the AriaHR logo with a subtle fade + scale entrance animation,
 * and automatically navigates to /login after 2.5 seconds (2500ms).
 */
@Component({
  selector: 'app-splash',
  standalone: true,
  imports: [],
  templateUrl: './splash.component.html',
  styleUrl: './splash.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SplashComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);

  /** Delay before navigating to the login page (ms). */
  private readonly navigationDelayMs = 2500;

  private navigationTimeoutId: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.navigationTimeoutId = setTimeout(() => {
      this.router.navigate(['/login']);
    }, this.navigationDelayMs);
  }

  ngOnDestroy(): void {
    if (this.navigationTimeoutId !== null) {
      clearTimeout(this.navigationTimeoutId);
      this.navigationTimeoutId = null;
    }
  }
}
