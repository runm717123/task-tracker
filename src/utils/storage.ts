import { storage } from '#imports';

type StorageKey = `local:${string}` | `session:${string}` | `sync:${string}` | `managed:${string}`;

export const incrementStorageValue = async (key: StorageKey): Promise<number> => {
  const previousValue = await storage.getItem<number>(key);
  const incrementedValue = (previousValue ?? 0) + 1;
  await storage.setItem(key, incrementedValue);
  return incrementedValue;
};
