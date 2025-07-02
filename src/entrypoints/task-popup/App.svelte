<script lang="ts">
  import { Button } from '@bios-ui/svelte';
  import { storage } from '#imports';
  import { incrementStorageValue } from '../../utils/storage';
  import '@bios-ui/core/css';

  const key = 'local:test';
  let counter = $state(0);

  // Load initial value
  $effect(() => {
    (async () => {
      const initialValue = await storage.getItem<number>(key);
      counter = initialValue ?? 0;
    })();
  });

  const handleIncrement = async () => {
    const newValue = await incrementStorageValue(key);
    counter = newValue;
  };

  const closeWindow = () => {
    window.close();
  };
</script>

<main class="p-4 min-h-screen flex flex-col items-center justify-center bg-gray-50">
  <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
    <h1 class="text-xl font-bold text-center mb-4 text-gray-800">Task Tracker</h1>
    
    <div class="text-center mb-6">
      <div class="text-3xl font-bold text-blue-600 mb-2">{counter}</div>
      <p class="text-gray-600 text-sm">Current count</p>
    </div>

    <div class="space-y-3">
      <Button onclick={handleIncrement} class="w-full">
        Increment Task Counter
      </Button>
      
      <button 
        onclick={closeWindow}
        class="w-full px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
      >
        Close
      </button>
    </div>
  </div>
</main>

<style>
  main {
    font-family: Inter, system-ui, sans-serif;
  }
</style>
