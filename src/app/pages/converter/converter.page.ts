import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AlertController, IonicModule, LoadingController, ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { ConversionHistory } from '../../models/conversion-history.model';
import { Currency, DEFAULT_CURRENCIES } from '../../models/currency.model';
import { ConversionResult, ExchangeRateService } from '../../services/exchange-rate.service';
import { StorageService } from '../../services/storage.service';

@Component({
  selector: 'app-converter',
  templateUrl: './converter.page.html',
  styleUrls: ['./converter.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class ConverterPage implements OnInit {
  amount = 100;
  fromCurrency = 'BRL';
  toCurrency = 'USD';
  currencies: Currency[] = DEFAULT_CURRENCIES;
  filteredCurrencies: Currency[] = DEFAULT_CURRENCIES;
  currencySearch = '';
  conversion: ConversionResult | null = null;
  ratesMessage = '';
  isLoadingRates = false;

  constructor(
    private readonly exchangeRateService: ExchangeRateService,
    private readonly storageService: StorageService,
    private readonly loadingController: LoadingController,
    private readonly toastController: ToastController,
    private readonly alertController: AlertController
  ) {}

  ngOnInit(): void {
    this.currencies = this.storageService.getCurrencies();
    this.filterCurrencies();
    void this.refreshRates();
  }

  async refreshRates(showToast = false): Promise<void> {
    this.isLoadingRates = true;

    try {
      const rates = await firstValueFrom(this.exchangeRateService.getRates(this.fromCurrency));
      this.currencies = this.exchangeRateService.buildCurrenciesFromRates(rates.rates);
      this.storageService.saveCurrencies(this.currencies);
      this.filterCurrencies();
      this.ratesMessage = rates.message || `Taxas atualizadas para ${rates.base}.`;

      if (showToast) {
        await this.showToast('Taxas atualizadas com sucesso.', 'success');
      }
    } catch (error) {
      this.ratesMessage = this.getErrorMessage(error);

      if (showToast) {
        await this.showToast(this.ratesMessage, 'danger');
      }
    } finally {
      this.isLoadingRates = false;
    }
  }

  async convert(): Promise<void> {
    const loading = await this.loadingController.create({
      message: 'Convertendo...'
    });

    await loading.present();

    try {
      const conversion = await firstValueFrom(
        this.exchangeRateService.convert(this.amount, this.fromCurrency, this.toCurrency)
      );

      this.conversion = conversion;
      this.saveHistory(conversion);
      this.ratesMessage = conversion.offline
        ? 'Modo offline: utilizando últimas taxas disponíveis.'
        : `Cotação atualizada em ${this.formatDate(conversion.updatedAt)}.`;

      await this.showToast('Conversão realizada.', 'success');
    } catch (error) {
      const message = this.getErrorMessage(error);
      await this.showAlert('Não foi possível converter', message);
    } finally {
      await loading.dismiss();
    }
  }

  async swapCurrencies(): Promise<void> {
    const previousFrom = this.fromCurrency;
    this.fromCurrency = this.toCurrency;
    this.toCurrency = previousFrom;
    this.conversion = null;
    await this.refreshRates();
  }

  onSearchChange(event: Event): void {
    const value = (event as CustomEvent<{ value?: string }>).detail?.value || '';
    this.currencySearch = value;
    this.filterCurrencies();
  }

  onCurrencyChange(): void {
    this.conversion = null;
    void this.refreshRates();
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
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(date);
  }

  trackByCode(_: number, currency: Currency): string {
    return currency.code;
  }

  private filterCurrencies(): void {
    const term = this.currencySearch.trim().toLowerCase();

    if (!term) {
      this.filteredCurrencies = this.currencies;
      return;
    }

    this.filteredCurrencies = this.currencies.filter((currency) => {
      return currency.code.toLowerCase().includes(term) || currency.name.toLowerCase().includes(term);
    });
  }

  private saveHistory(conversion: ConversionResult): void {
    const historyItem: ConversionHistory = {
      id: this.createId(),
      date: new Date().toISOString(),
      amount: conversion.amount,
      from: conversion.from,
      to: conversion.to,
      result: conversion.result,
      rate: conversion.rate,
      offline: conversion.offline
    };

    this.storageService.addHistory(historyItem);
  }

  private createId(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.round(Math.random() * 100000)}`;
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'warning'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2200,
      position: 'bottom',
      color
    });

    await toast.present();
  }

  private async showAlert(header: string, message: string): Promise<void> {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });

    await alert.present();
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Ocorreu um erro inesperado.';
  }
}
