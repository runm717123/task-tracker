<script lang="ts">
  import { Button, TextArea } from '@bios-ui/svelte';
  import { storage } from '#imports';

  let taskInput = $state('');
  let isLoading = $state(false);

  const handleSave = async () => {
    if (!taskInput.trim()) return;
    
    console.log(taskInput, 'value')
    
    return
    isLoading = true;
    try {
      // Get existing tasks
      const existingTasks = await storage.getItem<string[]>('local:tasks') || [];
      
      // Add new task
      const updatedTasks = [...existingTasks, taskInput.trim()];
      
      // Save updated tasks
      await storage.setItem('local:tasks', updatedTasks);
      
      // Clear input and close
      taskInput = '';
      window.close();
    } catch (error) {
      console.error('Failed to save task:', error);
    } finally {
      isLoading = false;
    }
  };

  const handleCancel = () => {
    window.close();
  };

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSave();
    } else if (event.key === 'Escape') {
      handleCancel();
    }
  };
</script>

<main class="h-[300px] w-[700px] p-6 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
  <div class="bg-white rounded-lg shadow-md p-6 w-full h-full flex flex-col">
    <div class="flex items-center gap-3 mb-4">
      <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
        </svg>
      </div>
      <div>
        <h1 class="text-lg font-semibold text-gray-800">Add New Task</h1>
        <p class="text-gray-500 text-xs">What would you like to accomplish?</p>
      </div>
    </div>
    
    <div class="flex-1 flex flex-col gap-4">
      <div class="flex-1">
        <label for="task-input" class="block text-sm font-medium text-gray-700 mb-2">
          Your next task
        </label>
        <TextArea
          id="task-input"
          bind:value={taskInput}
          onkeydown={handleKeydown}
          placeholder="Enter your task description..."
          className="w-full h-20 resize-none"
        />
      </div>

      <div class="flex gap-3">
        <Button 
          onclick={handleSave} 
        >
          {#if isLoading}
            <div class="flex items-center justify-center gap-2">
              <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Saving...
            </div>
          {:else}
            Save Task
          {/if}
        </Button>
        
        <Button 
          onclick={handleCancel}
        >
          Cancel
        </Button>
      </div>
      
      <div class="text-center">
        <p class="text-xs text-gray-400">
          Press <kbd class="px-1 py-0.5 text-xs bg-gray-100 rounded">Enter</kbd> to save or <kbd class="px-1 py-0.5 text-xs bg-gray-100 rounded">Esc</kbd> to cancel
        </p>
      </div>
    </div>
  </div>
</main>

