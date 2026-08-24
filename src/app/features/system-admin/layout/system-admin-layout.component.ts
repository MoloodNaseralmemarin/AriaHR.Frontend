import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-system-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './system-admin-layout.component.html',
  styleUrl: './system-admin-layout.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SystemAdminLayoutComponent {}
