import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, of, tap, throwError, timeout } from 'rxjs';
import {
  Currency,
  DEFAULT_CURRENCIES,
  PREFERRED_CURRENCY_CODES
} from '../models/currency.model';
import { RateCache } from '../models/rate-cache.model';
import { StorageService } from './storage.service';

interface OpenExchangeResponse {
  result: string;
  base_code: string;
  time_last_update_utc?: string;
  rates?: Record<string, number>;
}

export interface RatesResult {
  base: string;
  rates: Record<string, number>;
  updatedAt: string;
  offline: boolean;
  message?: string;
}

export interface ConversionResult {
  amount: number;
  from: string;
  to: string;
  result: number;
  rate: number;
  updatedAt: string;
  offline: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ExchangeRateService {
  private readonly apiUrl = 'https://open.er-api.com/v6/latest';
  private readonly timeoutMs = 8000;

  private readonly currencyNames: Record<string, string> = {
    BRL: 'Real brasileiro',
    USD: 'Dolar americano',
    EUR: 'Euro',
    GBP: 'Libra esterlina',
    CAD: 'Dolar canadense',
    AUD: 'Dolar australiano',
    CHF: 'Franco suico',
    JPY: 'Iene japones',
    CNY: 'Yuan chines',
    ARS: 'Peso argentino',
    CLP: 'Peso chileno',
    MXN: 'Peso mexicano',
    UYU: 'Peso uruguaio',
    PYG: 'Guarani paraguaio',
    COP: 'Peso colombiano',
    PEN: 'Sol peruano',
    BOB: 'Boliviano',
    NOK: 'Coroa norueguesa',
    SEK: 'Coroa sueca',
    DKK: 'Coroa dinamarquesa',
    NZD: 'Dolar neozelandes',
    HKD: 'Dolar de Hong Kong',
    SGD: 'Dolar de Singapura',
    KRW: 'Won sul-coreano',
    INR: 'Rupia indiana',
    ZAR: 'Rand sul-africano'
  };

  constructor(
    private readonly http: HttpClient,
    private readonly storage: StorageService
  ) {}

  getRates(base: string): Observable<RatesResult> {
    const normalizedBase = base.toUpperCase();

    if (!this.isOnline()) {
      return this.getCachedRates(normalizedBase, 'Modo offline: utilizando últimas taxas disponíveis.');
    }

    return this.http.get<OpenExchangeResponse>(`${this.apiUrl}/${normalizedBase}`).pipe(
      timeout(this.timeoutMs),
      map((response) => this.parseResponse(response, normalizedBase)),
      tap((rates) => this.saveRates(rates)),
      catchError(() => this.getCachedRates(normalizedBase, 'Modo offline: utilizando últimas taxas disponíveis.'))
    );
  }

  convert(amount: number, from: string, to: string): Observable<ConversionResult> {
    const cleanAmount = Number(amount);
    const source = from.toUpperCase();
    const target = to.toUpperCase();

    if (!Number.isFinite(cleanAmount) || cleanAmount <= 0) {
      return throwError(() => new Error('Informe um valor maior que zero.'));
    }

    if (!source || !target) {
      return throwError(() => new Error('Selecione as moedas de origem e destino.'));
    }

    if (source === target) {
      return of({
        amount: cleanAmount,
        from: source,
        to: target,
        result: cleanAmount,
        rate: 1,
        updatedAt: new Date().toISOString(),
        offline: false
      });
    }

    return this.getRates(source).pipe(
      map((rates) => {
        const rate = rates.rates[target];

        if (!rate) {
          throw new Error('Nao foi possivel encontrar a cotacao para a moeda selecionada.');
        }

        this.saveSnapshot(source, target, rate);

        return {
          amount: cleanAmount,
          from: source,
          to: target,
          result: cleanAmount * rate,
          rate,
          updatedAt: rates.updatedAt,
          offline: rates.offline
        };
      })
    );
  }

  buildCurrenciesFromRates(rates: Record<string, number>): Currency[] {
    const codes = Array.from(new Set([...PREFERRED_CURRENCY_CODES, ...Object.keys(rates)])).sort();
    const preferred = PREFERRED_CURRENCY_CODES.map((code) => this.toCurrency(code));
    const others = codes
      .filter((code) => !PREFERRED_CURRENCY_CODES.includes(code))
      .map((code) => this.toCurrency(code));

    return [...preferred, ...others];
  }

  private parseResponse(response: OpenExchangeResponse, requestedBase: string): RatesResult {
    if (response.result !== 'success' || !response.rates) {
      throw new Error('A API retornou uma resposta invalida.');
    }

    return {
      base: response.base_code || requestedBase,
      rates: response.rates,
      updatedAt: response.time_last_update_utc || new Date().toISOString(),
      offline: false
    };
  }

  private saveRates(rates: RatesResult): void {
    const cache: RateCache = {
      base: rates.base,
      rates: rates.rates,
      updatedAt: rates.updatedAt,
      savedAt: new Date().toISOString()
    };

    this.storage.saveRateCache(cache);
    this.storage.saveCurrencies(this.buildCurrenciesFromRates(rates.rates));

    for (const target of PREFERRED_CURRENCY_CODES) {
      const rate = rates.rates[target];

      if (target !== rates.base && rate) {
        this.saveSnapshot(rates.base, target, rate);
      }
    }
  }

  private getCachedRates(base: string, message: string): Observable<RatesResult> {
    const cache = this.storage.getRateCache(base);

    if (!cache) {
      return throwError(() => new Error('Nao foi possivel carregar as taxas. Verifique a conexao e tente novamente.'));
    }

    return of({
      base: cache.base,
      rates: cache.rates,
      updatedAt: cache.updatedAt,
      offline: true,
      message
    });
  }

  private saveSnapshot(base: string, target: string, rate: number): void {
    const now = new Date();

    this.storage.addRateSnapshot({
      date: now.toISOString().slice(0, 10),
      base,
      target,
      rate,
      savedAt: now.toISOString()
    });
  }

  private toCurrency(code: string): Currency {
    return {
      code,
      name: this.currencyNames[code] || this.getDisplayName(code)
    };
  }

  private getDisplayName(code: string): string {
    const intlWithDisplayNames = Intl as typeof Intl & {
      DisplayNames?: new (locales: string[], options: { type: 'currency' }) => { of(code: string): string | undefined };
    };

    try {
      const displayNames = intlWithDisplayNames.DisplayNames
        ? new intlWithDisplayNames.DisplayNames(['pt-BR'], { type: 'currency' })
        : null;

      return displayNames?.of(code) || code;
    } catch {
      return DEFAULT_CURRENCIES.find((currency) => currency.code === code)?.name || code;
    }
  }

  private isOnline(): boolean {
    return typeof navigator === 'undefined' ? true : navigator.onLine;
  }
}
