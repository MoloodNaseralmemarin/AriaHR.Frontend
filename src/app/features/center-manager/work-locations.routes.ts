import { Routes } from '@angular/router';

import { CenterManagerWorkLocationEditComponent } from './pages/work-location-edit/work-location-edit.component';
import { CenterManagerWorkLocationsListComponent } from './pages/work-locations-list/work-locations-list.component';
import { CreateWorkLocationComponent } from './pages/create-work-location/create-work-location.component';

/**
 * Work-location routes are lazy-loaded under `/center-manager/work-locations`.
 * The list route must be declared before `:id/edit`, and `create` is a static
 * segment so it can never be captured by the `:id` parameter.
 */
export const WORK_LOCATION_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: CenterManagerWorkLocationsListComponent,
  },
  {
    path: 'create',
    component: CreateWorkLocationComponent,
  },
  {
    path: ':id/edit',
    component: CenterManagerWorkLocationEditComponent,
  },
  { path: '**', redirectTo: '' },
];
