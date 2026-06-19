export type UpdateFrequency = 'manual' | 'hourly' | 'daily';

export interface AppSettings {
  updateFrequency: UpdateFrequency;
  notificationsEnabled: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  updateFrequency: 'manual',
  notificationsEnabled: false
};
