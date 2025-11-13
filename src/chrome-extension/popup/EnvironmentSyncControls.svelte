<script>
  import { createEventDispatcher } from 'svelte';

  export let environments = ['main', 'development', 'staging', 'production'];
  export let currentEnvironment = 'main';
  export let syncInProgress = false;

  const dispatch = createEventDispatcher();

  function handleSync() {
    dispatch('sync', { environment: currentEnvironment });
  }

  function handleEnvironmentChange(event) {
    const newEnvironment = event.target.value;
    dispatch('environmentChange', { environment: newEnvironment });
  }

  function handleEnvironmentSelect(env) {
    dispatch('environmentChange', { environment: env });
  }
</script>

<div class="env-sync-controls">
  <div class="env-selector">
    <label for="environment-select">Target Environment:</label>
    <select
      id="environment-select"
      value={currentEnvironment}
      on:change={handleEnvironmentChange}
      disabled={syncInProgress}
    >
      {#each environments as env}
        <option value={env}>{env}</option>
      {/each}
    </select>
  </div>

  <div class="env-buttons">
    {#each environments as env}
      <button
        type="button"
        class="env-btn {env === currentEnvironment ? 'active' : ''}"
        on:click={() => handleEnvironmentSelect(env)}
        disabled={syncInProgress}
        class:active={env === currentEnvironment}
      >
        {env}
      </button>
    {/each}
  </div>

  <button
    class="sync-btn"
    on:click={handleSync}
    disabled={syncInProgress}
  >
    {syncInProgress ? 'Syncing...' : `Sync to ${currentEnvironment}`}
  </button>
</div>

<style>
  .env-sync-controls {
    background-color: white;
    border-radius: 6px;
    padding: 16px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    margin-bottom: 16px;
  }

  .env-selector {
    margin-bottom: 12px;
  }

  .env-selector label {
    display: block;
    margin-bottom: 4px;
    font-weight: 600;
    color: #24292e;
    font-size: 0.9em;
  }

  .env-selector select {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #e1e4e8;
    border-radius: 6px;
    font-size: 0.9em;
    box-sizing: border-box;
    background-color: white;
  }

  .env-selector select:focus {
    border-color: #0366d6;
    outline: none;
    box-shadow: 0 0 0 3px rgba(3, 102, 214, 0.2);
  }

  .env-selector select:disabled {
    background-color: #f6f8fa;
    cursor: not-allowed;
  }

  .env-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 16px;
  }

  .env-btn {
    padding: 6px 12px;
    border: 1px solid #e1e4e8;
    border-radius: 20px;
    background: white;
    cursor: pointer;
    font-size: 0.85em;
  }

  .env-btn:hover:not(:disabled) {
    background-color: #f6f8fa;
  }

  .env-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .env-btn.active {
    background-color: #0366d6;
    color: white;
    border-color: #0366d6;
  }

  .sync-btn {
    width: 100%;
    padding: 10px;
    background-color: #28a745;
    color: white;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    font-size: 0.9em;
  }

  .sync-btn:hover:not(:disabled) {
    background-color: #218838;
  }

  .sync-btn:disabled {
    background-color: #6c757d;
    cursor: not-allowed;
  }
</style>