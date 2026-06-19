export interface Currency {
  code: string;
  name: string;
}

export const PREFERRED_CURRENCY_CODES = ['BRL', 'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'CHF', 'JPY', 'CNY'];

export const DEFAULT_CURRENCIES: Currency[] = [
  { code: 'BRL', name: 'Real brasileiro' },
  { code: 'USD', name: 'Dolar americano' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'Libra esterlina' },
  { code: 'CAD', name: 'Dolar canadense' },
  { code: 'AUD', name: 'Dolar australiano' },
  { code: 'CHF', name: 'Franco suico' },
  { code: 'JPY', name: 'Iene japones' },
  { code: 'CNY', name: 'Yuan chines' }
];
