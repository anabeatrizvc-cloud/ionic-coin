import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  barChartOutline,
  cashOutline,
  checkmarkCircleOutline,
  refreshOutline,
  settingsOutline,
  swapHorizontalOutline,
  timeOutline,
  trashOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: true,
  imports: [IonApp, IonRouterOutlet]
})
export class AppComponent {
  constructor() {
    addIcons({
      barChartOutline,
      cashOutline,
      checkmarkCircleOutline,
      refreshOutline,
      settingsOutline,
      swapHorizontalOutline,
      timeOutline,
      trashOutline
    });
  }
}
