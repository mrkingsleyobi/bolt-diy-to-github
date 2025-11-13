<script>
  import { createEventDispatcher } from 'svelte';

  export let options;
  const dispatch = createEventDispatcher();

  let githubToken = options.githubToken || '';
  let defaultBranch = options.defaultBranch || 'main';
  let autoSync = options.autoSync || false;
  let syncInterval = options.syncInterval || 30;
  let environments = [...(options.environments || ['main', 'development', 'staging', 'production'])];

  function handleSave() {
    const newOptions = {
      githubToken,
      defaultBranch,
      autoSync,
      syncInterval: parseInt(syncInterval),
      environments
    };

    dispatch('save', newOptions);
  }

  function handleCancel() {
    dispatch('cancel');
  }

  function addEnvironment() {
    environments = [...environments, ''];
  }

  function removeEnvironment(index) {
    environments = environments.filter((_, i) => i !== index);
  }

  function updateEnvironment(index, value) {
    environments[index] = value;
  }
</script>

<div class="options-panel">
  <h2>Configuration</h2>

  <div class="form-group">
    <label for="github-token">GitHub Personal Access Token</label>
    <input
      id="github-token"
      type="password"
      bind:value={githubToken}
      placeholder="ghp_..."
    />
    <small>Required for GitHub access. Token stored locally and encrypted.</small>
  </div>

  <div class="form-group">
    <label for="default-branch">Default Branch</label>
    <input
      id="default-branch"
      type="text"
      bind:value={defaultBranch}
      placeholder="main"
    />
  </div>

  <div class="form-group">
    <label for="sync-interval">Auto-Sync Interval (minutes)</label>
    <input
      id="sync-interval"
      type="number"
      bind:value={syncInterval}
      min="1"
      max="1440"
    />
  </div>

  <div class="form-group checkbox-group">
    <label>
      <input
        type="checkbox"
        bind:checked={autoSync}
      />
      Enable Auto-Sync
    </label>
  </div>

  <div class="form-group">
    <label>Environments</label>
    <div class="environments-list">
      {#each environments as env, i}
        <div class="env-input">
          <input
            type="text"
            bind:value={environments[i]}
            placeholder="Environment name"
          />
          <button
            type="button"
            on:click={() => removeEnvironment(i)}
            class="remove-btn"
          >
            ×
          </button>
        </div>
      {/each}
      <button
        type="button"
        on:click={addEnvironment}
        class="add-btn"
      >
        + Add Environment
      </button>
    </div>
  </div>

  <div class="actions">
    <button on:click={handleCancel} class="secondary">Cancel</button>
    <button on:click={handleSave}>Save Options</button>
  </div>
</div>

<style>
  .options-panel {
    background-color: white;
    border-radius: 6px;
    padding: 16px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  h2 {
    margin: 0 0 16px 0;
    font-size: 1.2em;
    color: #24292e;
  }

  .form-group {
    margin-bottom: 16px;
  }

  .form-group.checkbox-group {
    display: flex;
    align-items: center;
  }

  label {
    display: block;
    margin-bottom: 4px;
    font-weight: 600;
    color: #24292e;
    font-size: 0.9em;
  }

  input[type="text"],
  input[type="password"],
  input[type="number"] {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #e1e4e8;
    border-radius: 6px;
    font-size: 0.9em;
    box-sizing: border-box;
  }

  input[type="text"]:focus,
  input[type="password"]:focus,
  input[type="number"]:focus {
    border-color: #0366d6;
    outline: none;
    box-shadow: 0 0 0 3px rgba(3, 102, 214, 0.2);
  }

  input[type="checkbox"] {
    margin-right: 8px;
  }

  small {
    display: block;
    margin-top: 4px;
    font-size: 0.8em;
    color: #6a737d;
  }

  .environments-list {
    margin-top: 8px;
  }

  .env-input {
    display: flex;
    gap: 8px;
    margin-bottom: 8px;
  }

  .env-input input {
    flex: 1;
  }

  .remove-btn {
    background: #ffeef0;
    color: #d73a49;
    border: 1px solid #d73a49;
    border-radius: 4px;
    width: 30px;
    height: 30px;
    cursor: pointer;
    font-weight: bold;
  }

  .remove-btn:hover {
    background: #d73a49;
    color: white;
  }

  .add-btn {
    background: #f1f8ff;
    color: #0366d6;
    border: 1px solid #0366d6;
    border-radius: 4px;
    padding: 6px 12px;
    cursor: pointer;
    font-size: 0.9em;
  }

  .add-btn:hover {
    background: #0366d6;
    color: white;
  }

  .actions {
    display: flex;
    gap: 8px;
    margin-top: 24px;
  }

  .actions button {
    flex: 1;
    padding: 10px;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
  }

  .actions button.secondary {
    background-color: #e1e4e8;
    color: #24292e;
  }

  .actions button.secondary:hover {
    background-color: #d1d5da;
  }

  .actions button:not(.secondary) {
    background-color: #0366d6;
    color: white;
  }

  .actions button:not(.secondary):hover {
    background-color: #035fc7;
  }
</style>