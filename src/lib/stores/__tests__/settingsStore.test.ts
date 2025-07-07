import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing';
import { SettingsStore } from '../settingsStore';
import dayjs from 'dayjs';

// Mock dayjs
vi.mock('dayjs', () => ({
	default: vi.fn(() => ({
		set: vi.fn().mockReturnThis(),
		toISOString: () => '2025-07-07T08:00:00.000Z',
	})),
}));

describe('SettingsStore', () => {
	let settingsStore: SettingsStore;

	beforeEach(() => {
		fakeBrowser.reset();
		// @ts-ignore - Reset static instance for testing
		SettingsStore.instance = undefined;
		settingsStore = SettingsStore.getInstance();
	});

	describe('getInstance', () => {
		it('should return singleton instance', () => {
			const instance1 = SettingsStore.getInstance();
			const instance2 = SettingsStore.getInstance();
			expect(instance1).toBe(instance2);
		});
	});

	describe('getDefaultSettings', () => {
		it('should return default settings with correct structure', () => {
			const defaultSettings = settingsStore.getDefaultSettings();

			expect(defaultSettings).toEqual({
				startTime: '2025-07-07T08:00:00.000Z',
				autoFocusDescription: false,
				taskCreateDefaultValue: {
					title: 'No title',
					description: '',
				},
			});
		});
	});

	describe('getSettings and saveSettings', () => {
		it('should return default settings when no settings exist', async () => {
			const settings = await settingsStore.getSettings();

			expect(settings).toEqual({
				startTime: '2025-07-07T08:00:00.000Z',
				autoFocusDescription: false,
				taskCreateDefaultValue: {
					title: 'No title',
					description: '',
				},
			});
		});

		it('should save and retrieve settings', async () => {
			const testSettings: ISettings = {
				startTime: '2025-07-07T09:00:00.000Z',
				autoFocusDescription: true,
				taskCreateDefaultValue: {
					title: 'Custom Title',
					description: 'Custom Description',
				},
			};

			await settingsStore.saveSettings(testSettings);
			const settings = await settingsStore.getSettings();

			expect(settings).toEqual(testSettings);
		});
	});

	describe('updateSetting', () => {
		it('should update specific setting while preserving others', async () => {
			const initialSettings: ISettings = {
				startTime: '2025-07-07T08:00:00.000Z',
				autoFocusDescription: false,
				taskCreateDefaultValue: {
					title: 'Original Title',
					description: 'Original Description',
				},
			};

			await settingsStore.saveSettings(initialSettings);
			await settingsStore.updateSetting('autoFocusDescription', true);

			const updatedSettings = await settingsStore.getSettings();

			expect(updatedSettings).toEqual({
				startTime: '2025-07-07T08:00:00.000Z',
				autoFocusDescription: true,
				taskCreateDefaultValue: {
					title: 'Original Title',
					description: 'Original Description',
				},
			});
		});

		it('should update startTime setting', async () => {
			const newStartTime = '2025-07-07T10:00:00.000Z';

			await settingsStore.updateSetting('startTime', newStartTime);
			const settings = await settingsStore.getSettings();

			expect(settings.startTime).toBe(newStartTime);
		});

		it('should update taskCreateDefaultValue setting', async () => {
			const newDefaultValue = {
				title: 'New Default Title',
				description: 'New Default Description',
			};

			await settingsStore.updateSetting('taskCreateDefaultValue', newDefaultValue);
			const settings = await settingsStore.getSettings();

			expect(settings.taskCreateDefaultValue).toEqual(newDefaultValue);
		});
	});
});
