import { storage } from '#imports';
import dayjs from 'dayjs';

export class SettingsStore {
	private static instance: SettingsStore;
	private readonly storageKey = 'local:settings';

	static getInstance(): SettingsStore {
		if (!SettingsStore.instance) {
			SettingsStore.instance = new SettingsStore();
		}
		return SettingsStore.instance;
	}

	/**
	 * Get default settings
	 */
	getDefaultSettings(): ISettings {
		return {
			startTime: dayjs().set('hour', 8).set('minute', 0).toISOString(),
			autoFocusDescription: false,
			taskCreateDefaultValue: {
				title: 'No title',
				description: '',
			},
		};
	}

	/**
	 * Get settings from storage
	 */
	async getSettings(): Promise<ISettings> {
		const settings = await storage.getItem<ISettings>(this.storageKey);
		return settings || this.getDefaultSettings();
	}

	/**
	 * Save settings to storage
	 */
	async saveSettings(settings: ISettings): Promise<void> {
		await storage.setItem(this.storageKey, settings);
	}

	/**
	 * Update specific setting
	 */
	async updateSetting<K extends keyof ISettings>(key: K, value: ISettings[K]): Promise<void> {
		const settings = await this.getSettings();
		settings[key] = value;
		await this.saveSettings(settings);
	}
}

export const settingsStore = SettingsStore.getInstance();
