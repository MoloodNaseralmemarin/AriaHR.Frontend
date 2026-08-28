import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-system-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './system-admin-layout.component.html',
  styleUrl: './system-admin-layout.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SystemAdminLayoutComponent {
  private readonly authService = inject(AuthService);

  readonly avatarInitial = computed(() => {
    const user = this.authService.userDetails();
    if (user && user.firstName) {
      return user.firstName.trim().charAt(0);
    }
    return 'م';
  });
}
