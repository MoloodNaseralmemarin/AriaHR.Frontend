import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

/**
 * SplashComponent
 * ----------------
 * First screen shown when the AriaHR application starts.
 * Displays only the AriaHR logo with a subtle fade + scale animation,
 * then automatically navigates to /login after ~2.5 seconds.
 *
 * - Standalone Angular 20 component
 * - No services, no HTTP calls, no state management
 * - Timer is cleaned up on destroy to avoid memory leaks / navigation
 *   after the component has already been torn down.
 */
@Component({
  selector: 'app-splash',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './splash.component.html',
  styleUrl: './splash.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SplashComponent implements OnInit, OnDestroy {
  /** Delay before navigating to the login page (ms). */
  private readonly navigationDelayMs = 2500;

  private navigationTimeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly router: Router) {}

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
