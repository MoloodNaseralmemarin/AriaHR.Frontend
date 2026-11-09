import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';

import { AuthService } from './core/auth/auth.service';
import { PwaStartupService } from './core/services/pwa-startup.service';
import { SplashScreenComponent } from './shared/components/splash-screen/splash-screen.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SplashScreenComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  protected readonly title = signal('AriaHR.Frontend');
  protected readonly authService = inject(AuthService);
  protected readonly pwaStartupService = inject(PwaStartupService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    const isStandalone = this.pwaStartupService.isStandalone();

    if (isStandalone) {
      // 1. Standalone PWA Cold Launch: Invalidate previous session immediately
      this.authService.invalidateSessionOnStartup();

      // 2. Ensure initial navigation redirects to /login with replaceUrl so protected pages cannot be accessed via Back
      this.router.navigate(['/login'], { replaceUrl: true });
    }

    // 3. Keep splash screen visible for smooth experience (~1.6s minimum duration)
    this.pwaStartupService.dismissSplash();
  }
}
