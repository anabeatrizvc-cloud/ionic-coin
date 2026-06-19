import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AlertController, IonicModule, ToastController } from '@ionic/angular';
import { ConversionHistory } from '../../models/conversion-history.model';
import { StorageService } from '../../services/storage.service';

@Component({
  selector: 'app-history',
  templateUrl: './history.page.html',
  styleUrls: ['./history.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class HistoryPage {
  history: ConversionHistory[] = [];

  constructor(
    private readonly storageService: StorageService,
    private readonly alertController: AlertController,
    private readonly toastController: ToastController
  ) {}

  ionViewWillEnter(): void {
    this.loadHistory();
  }

  async confirmClearHistory(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Limpar histórico',
      message: 'Deseja apagar todas as conversões salvas?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Limpar',
          role: 'destructive',
          handler: () => {
            this.storageService.clearHistory();
            this.loadHistory();
            void this.showToast('Histórico apagado.', 'success');
          }
        }
      ]
    });

    await alert.present();
  }

  formatCurrency(value: number, currency: string): string {
    try {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency,
        maximumFractionDigits: 4
      }).format(value);
    } catch {
      return `${value.toFixed(4)} ${currency}`;
    }
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(new Date(value));
  }

  trackById(_: number, item: ConversionHistory): string {
    return item.id;
  }

  private loadHistory(): void {
    this.history = this.storageService.getHistory();
  }

  private async showToast(message: string, color: 'success' | 'danger'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom',
      color
    });

    await toast.present();
  }
}
