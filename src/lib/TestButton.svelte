<script lang="ts">
  import { Button } from '@bios-ui/svelte';
  import { storage } from '#imports';

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

  const tokage = async () => {
      const prevValue = await storage.getItem<number>(key);
      const newValue = (prevValue ?? 0) + 1;
      await storage.setItem(key, newValue );
      // testValue = newValue;
  };
</script>

<Button onclick={tokage}>
  Test 123 ({testValue})
</Button>
