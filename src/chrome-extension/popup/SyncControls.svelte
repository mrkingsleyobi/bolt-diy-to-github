<script>
  import { createEventDispatcher } from 'svelte';

  export let syncInProgress = false;
  export let branch = 'main';

  const dispatch = createEventDispatcher();

  function handleSync() {
    dispatch('sync');
  }
</script>

<div class="sync-controls">
  <div class="branch-info">
    <span>Target Branch:</span>
    <strong>{branch}</strong>
  </div>

  <button
    class="sync-button"
    on:click={handleSync}
    disabled={syncInProgress}
  >
    {#if syncInProgress}
      <span class="spinner"></span>
      Syncing...
    {:else}
      Sync to GitHub
    {/if}
  </button>

  <div class="environments">
    <h4>Multi-Environment Support</h4>
    <div class="env-tags">
      <span class="env-tag main">main</span>
      <span class="env-tag dev">dev</span>
      <span class="env-tag stage">stage</span>
      <span class="env-tag prod">prod</span>
    </div>
  </div>
</div>

<style>
  .sync-controls {
    background-color: white;
    border-radius: 6px;
    padding: 16px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .branch-info {
    margin-bottom: 16px;
    font-size: 0.9em;
    color: #586069;
  }

  .branch-info strong {
    color: #24292e;
    font-weight: 600;
  }

  .sync-button {
    width: 100%;
    padding: 12px;
    background-color: #28a745;
    color: white;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    font-size: 1em;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .sync-button:hover:not(:disabled) {
    background-color: #22863a;
  }

  .sync-button:disabled {
    background-color: #6a737d;
    cursor: not-allowed;
  }

  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: white;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .environments {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #e1e4e8;
  }

  .environments h4 {
    margin: 0 0 8px 0;
    font-size: 0.9em;
    color: #586069;
  }

  .env-tags {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .env-tag {
    padding: 4px 8px;
    border-radius: 20px;
    font-size: 0.8em;
    font-weight: 600;
  }

  .env-tag.main {
    background-color: #0366d6;
    color: white;
  }

  .env-tag.dev {
    background-color: #ffd33d;
    color: #24292e;
  }

  .env-tag.stage {
    background-color: #ff7800;
    color: white;
  }

  .env-tag.prod {
    background-color: #28a745;
    color: white;
  }
</style>