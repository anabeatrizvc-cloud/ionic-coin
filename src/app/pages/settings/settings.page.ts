import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { AppSettings } from '../../models/settings.model';
import { StorageService } from '../../services/storage.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class SettingsPage {
  settings: AppSettings = this.storageService.getSettings();

  constructor(
    private readonly storageService: StorageService,
    private readonly toastController: ToastController
  ) {}

  ionViewWillEnter(): void {
    this.settings = this.storageService.getSettings();
  }

  async saveSettings(): Promise<void> {
    this.storageService.saveSettings(this.settings);
    await this.showToast('Configurações salvas.');
  }

  private async showToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 1800,
      position: 'bottom',
      color: 'success'
    });

    await toast.present();
  }
}
