import { Injectable } from '@angular/core';
import { ConversionHistory } from '../models/conversion-history.model';
import { Currency, DEFAULT_CURRENCIES } from '../models/currency.model';
import { AppSettings, DEFAULT_SETTINGS } from '../models/settings.model';
import { RateCache, RateSnapshot } from '../models/rate-cache.model';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly keys = {
    history: 'ionic_coin_history',
    settings: 'ionic_coin_settings',
    rates: 'ionic_coin_rates',
    currencies: 'ionic_coin_currencies',
    snapshots: 'ionic_coin_rate_snapshots'
  };

  getHistory(): ConversionHistory[] {
    return this.getItem<ConversionHistory[]>(this.keys.history, []).sort((a, b) => b.date.localeCompare(a.date));
  }

  addHistory(item: ConversionHistory): void {
    const history = [item, ...this.getHistory()].slice(0, 80);
    this.setItem(this.keys.history, history);
  }

  clearHistory(): void {
    this.setItem(this.keys.history, []);
  }

  getSettings(): AppSettings {
    return {
      ...DEFAULT_SETTINGS,
      ...this.getItem<Partial<AppSettings>>(this.keys.settings, {})
    };
  }

  saveSettings(settings: AppSettings): void {
    this.setItem(this.keys.settings, settings);
  }

  getRateCache(base: string): RateCache | null {
    const normalizedBase = base.toUpperCase();
    const allRates = this.getItem<Record<string, RateCache>>(this.keys.rates, {});
    return allRates[normalizedBase] ?? null;
  }

  saveRateCache(cache: RateCache): void {
    const allRates = this.getItem<Record<string, RateCache>>(this.keys.rates, {});
    allRates[cache.base] = cache;
    this.setItem(this.keys.rates, allRates);
  }

  getCurrencies(): Currency[] {
    const currencies = this.getItem<Currency[]>(this.keys.currencies, DEFAULT_CURRENCIES);
    return currencies.length ? currencies : DEFAULT_CURRENCIES;
  }

  saveCurrencies(currencies: Currency[]): void {
    this.setItem(this.keys.currencies, currencies);
  }

  addRateSnapshot(snapshot: RateSnapshot): void {
    const snapshots = this.getItem<RateSnapshot[]>(this.keys.snapshots, []);
    const withoutSameDay = snapshots.filter((item) => {
      return !(item.date === snapshot.date && item.base === snapshot.base && item.target === snapshot.target);
    });

    const next = [...withoutSameDay, snapshot]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-700);

    this.setItem(this.keys.snapshots, next);
  }

  getRateSnapshots(base: string, target: string, days: number): RateSnapshot[] {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (days - 1));

    return this.getItem<RateSnapshot[]>(this.keys.snapshots, [])
      .filter((snapshot) => {
        const snapshotDate = new Date(`${snapshot.date}T00:00:00`);
        return snapshot.base === base && snapshot.target === target && snapshotDate >= start;
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private getItem<T>(key: string, fallback: T): T {
    const storage = this.getStorage();

    if (!storage) {
      return fallback;
    }

    const value = storage.getItem(key);

    if (!value) {
      return fallback;
    }

    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }

  private setItem<T>(key: string, value: T): void {
    const storage = this.getStorage();

    if (storage) {
      storage.setItem(key, JSON.stringify(value));
    }
  }

  private getStorage(): Storage | null {
    return typeof localStorage === 'undefined' ? null : localStorage;
  }
}
