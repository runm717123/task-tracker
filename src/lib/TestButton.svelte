<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Button } from '@bios-ui/svelte';
  import { storage } from '#imports';
  import { incrementStorageValue } from '../utils/storage';

  const key = 'local:test';
  let testValue = $state(0);

  // Load initial value when component mounts
  $effect(() => {
    (async () => {
      const initialValue = await storage.getItem<number>('local:test');
      testValue = initialValue ?? 0;
      console.log("🚀 ~ $effect ~ initialValue:", initialValue)
    })();
  });

  let unwatch: () => void;

  onMount(async () => {
    // Load initial value
    const initialValue = await storage.getItem<number>(key);
    testValue = initialValue ?? 0;

    // Watch for changes
    unwatch = storage.watch<number>(key, (newCount) => {
      testValue = newCount ?? 0;
      console.log('Count changed:', newCount);
    });
  });

  onDestroy(() => {
    if (unwatch) unwatch();
  });

  const incrementLocalStorage = async () => {
    await incrementStorageValue(key);
  };
</script>

<Button onclick={incrementLocalStorage}>
  Test 123 ({testValue}) oooo D sdf
</Button>
