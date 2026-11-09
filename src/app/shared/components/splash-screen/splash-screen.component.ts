import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PwaStartupService } from '../../../core/services/pwa-startup.service';

/**
 * Splash Screen Component displayed during PWA startup.
 * Uses official AriaHR branding, colors, typography, loading spinner, and safe-area insets.
 */
@Component({
  selector: 'app-splash-screen',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './splash-screen.component.html',
  styleUrl: './splash-screen.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SplashScreenComponent {
  protected readonly pwaStartupService = inject(PwaStartupService);
}
