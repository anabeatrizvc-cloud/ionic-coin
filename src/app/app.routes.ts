import { Routes } from '@angular/router';
import { TabsPage } from './pages/tabs/tabs.page';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'tabs/converter',
    pathMatch: 'full'
  },
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'converter',
        loadComponent: () => import('./pages/converter/converter.page').then((m) => m.ConverterPage)
      },
      {
        path: 'history',
        loadComponent: () => import('./pages/history/history.page').then((m) => m.HistoryPage)
      },
      {
        path: 'chart',
        loadComponent: () => import('./pages/chart/chart.page').then((m) => m.ChartPage)
      },
      {
        path: 'settings',
        loadComponent: () => import('./pages/settings/settings.page').then((m) => m.SettingsPage)
      },
      {
        path: '',
        redirectTo: 'converter',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'tabs/converter'
  }
];
