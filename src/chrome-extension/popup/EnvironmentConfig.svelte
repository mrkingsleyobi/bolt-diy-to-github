<script>
  import { createEventDispatcher } from 'svelte';

  export let environments = [];
  export let currentEnvironment = '';
  export let githubToken = '';
  export let defaultBranch = 'main';

  const dispatch = createEventDispatcher();

  let newEnvironment = '';
  let editingIndex = -1;
  let editingValue = '';
  let validationErrors = {};
  let showToken = false;

  // Validation functions
  function validateEnvironmentName(name) {
    if (!name || name.trim() === '') {
      return 'Environment name is required';
    }
    if (name.length < 2) {
      return 'Environment name must be at least 2 characters';
    }
    if (name.length > 50) {
      return 'Environment name must be less than 50 characters';
    }
    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/i.test(name)) {
      return 'Environment name can only contain letters, numbers, and hyphens (cannot start or end with hyphen)';
    }
    return null;
  }

  function validateGithubToken(token) {
    if (!token || token.trim() === '') {
      return 'GitHub token is required';
    }
    if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
      return 'Invalid GitHub token format';
    }
    return null;
  }

  function validateBranchName(branch) {
    if (!branch || branch.trim() === '') {
      return 'Default branch is required';
    }
    if (branch.length > 100) {
      return 'Branch name must be less than 100 characters';
    }
    return null;
  }

  // Environment management functions
  function addEnvironment() {
    const error = validateEnvironmentName(newEnvironment);
    if (error) {
      validationErrors.newEnv = error;
      return;
    }

    // Check for duplicates
    if (environments.includes(newEnvironment)) {
      validationErrors.newEnv = 'Environment already exists';
      return;
    }

    environments = [...environments, newEnvironment];
    newEnvironment = '';
    delete validationErrors.newEnv;
    dispatch('change', { environments });
  }

  function startEditing(index) {
    editingIndex = index;
    editingValue = environments[index];
    delete validationErrors.editEnv;
  }

  function saveEdit() {
    const error = validateEnvironmentName(editingValue);
    if (error) {
      validationErrors.editEnv = error;
      return;
    }

    // Check for duplicates (excluding current index)
    if (environments.some((env, i) => i !== editingIndex && env === editingValue)) {
      validationErrors.editEnv = 'Environment already exists';
      return;
    }

    environments[editingIndex] = editingValue;
    editingIndex = -1;
    editingValue = '';
    delete validationErrors.editEnv;
    dispatch('change', { environments });
  }

  function cancelEdit() {
    editingIndex = -1;
    editingValue = '';
    delete validationErrors.editEnv;
  }

  function removeEnvironment(index) {
    environments = environments.filter((_, i) => i !== index);
    dispatch('change', { environments });
  }

  function handleTokenChange(value) {
    githubToken = value;
    const error = validateGithubToken(value);
    if (error) {
      validationErrors.token = error;
    } else {
      delete validationErrors.token;
    }
    dispatch('tokenChange', { token: value });
  }

  function handleBranchChange(value) {
    defaultBranch = value;
    const error = validateBranchName(value);
    if (error) {
      validationErrors.branch = error;
    } else {
      delete validationErrors.branch;
    }
    dispatch('branchChange', { branch: value });
  }

  function handleEnvironmentSelect(env) {
    dispatch('environmentSelect', { environment: env });
  }
</script>

<div class="environment-config">
  <h2>Environment Configuration</h2>

  <!-- GitHub Token Section -->
  <div class="form-group">
    <label for="github-token">GitHub Personal Access Token</label>
    <div class="token-input-container">
      <input
        id="github-token"
        type={showToken ? "text" : "password"}
        value={githubToken}
        on:input={(e) => handleTokenChange(e.target.value)}
        placeholder="ghp_... or github_pat_..."
        class:invalid={validationErrors.token}
      />
      <button
        type="button"
        class="toggle-token"
        on:click={() => showToken = !showToken}
        title={showToken ? "Hide token" : "Show token"}
      >
        {showToken ? "🙈" : "👁️"}
      </button>
    </div>
    {#if validationErrors.token}
      <div class="error-message">{validationErrors.token}</div>
    {/if}
    <small>Required for GitHub access. Token stored locally and encrypted.</small>
  </div>

  <!-- Default Branch Section -->
  <div class="form-group">
    <label for="default-branch">Default Branch</label>
    <input
      id="default-branch"
      type="text"
      value={defaultBranch}
      on:input={(e) => handleBranchChange(e.target.value)}
      placeholder="main"
      class:invalid={validationErrors.branch}
    />
    {#if validationErrors.branch}
      <div class="error-message">{validationErrors.branch}</div>
    {/if}
  </div>

  <!-- Environment Management Section -->
  <div class="form-group">
    <label>Environments</label>
    <div class="environments-list">
      {#each environments as env, i}
        {#if editingIndex === i}
          <div class="env-edit-row">
            <input
              type="text"
              bind:value={editingValue}
              placeholder="Environment name"
              class:invalid={validationErrors.editEnv}
              on:keydown={(e) => {
                if (e.key === 'Enter') saveEdit();
                if (e.key === 'Escape') cancelEdit();
              }}
            />
            <div class="env-actions">
              <button type="button" class="save-btn" on:click={saveEdit}>Save</button>
              <button type="button" class="cancel-btn" on:click={cancelEdit}>Cancel</button>
            </div>
            {#if validationErrors.editEnv}
              <div class="error-message inline">{validationErrors.editEnv}</div>
            {/if}
          </div>
        {:else}
          <div class="env-row">
            <span class="env-name">{env}</span>
            <div class="env-actions">
              <button
                type="button"
                class="edit-btn"
                on:click={() => startEditing(i)}
                title="Edit environment"
              >
                ✏️
              </button>
              <button
                type="button"
                class="remove-btn"
                on:click={() => removeEnvironment(i)}
                title="Remove environment"
              >
                🗑️
              </button>
            </div>
          </div>
        {/if}
      {/each}

      <!-- Add New Environment -->
      <div class="add-env-row">
        <input
          type="text"
          bind:value={newEnvironment}
          placeholder="Add new environment"
          on:keydown={(e) => {
            if (e.key === 'Enter') addEnvironment();
          }}
        />
        <button
          type="button"
          class="add-btn"
          on:click={addEnvironment}
          disabled={!newEnvironment.trim()}
        >
          Add
        </button>
      </div>
      {#if validationErrors.newEnv}
        <div class="error-message">{validationErrors.newEnv}</div>
      {/if}
    </div>
  </div>

  <!-- Environment Quick Switch -->
  <div class="form-group">
    <label>Current Environment</label>
    <div class="current-env-display">
      {#if currentEnvironment}
        <span class="current-env">{currentEnvironment}</span>
      {:else}
        <span class="no-env">No environment selected</span>
      {/if}
    </div>
    <div class="env-switcher">
      {#each environments as env}
        <button
          type="button"
          class="env-btn {env === currentEnvironment ? 'active' : ''}"
          on:click={() => handleEnvironmentSelect(env)}
          class:active={env === currentEnvironment}
        >
          {env}
        </button>
      {/each}
    </div>
  </div>
</div>

<style>
  .environment-config {
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

  label {
    display: block;
    margin-bottom: 4px;
    font-weight: 600;
    color: #24292e;
    font-size: 0.9em;
  }

  input[type="text"],
  input[type="password"] {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #e1e4e8;
    border-radius: 6px;
    font-size: 0.9em;
    box-sizing: border-box;
  }

  input[type="text"]:focus,
  input[type="password"]:focus {
    border-color: #0366d6;
    outline: none;
    box-shadow: 0 0 0 3px rgba(3, 102, 214, 0.2);
  }

  input.invalid {
    border-color: #d73a49;
    box-shadow: 0 0 0 3px rgba(215, 58, 73, 0.2);
  }

  .token-input-container {
    position: relative;
    display: flex;
    align-items: center;
  }

  .toggle-token {
    position: absolute;
    right: 8px;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1.1em;
    padding: 4px;
    border-radius: 4px;
  }

  .toggle-token:hover {
    background-color: #e1e4e8;
  }

  small {
    display: block;
    margin-top: 4px;
    font-size: 0.8em;
    color: #6a737d;
  }

  .error-message {
    color: #d73a49;
    font-size: 0.8em;
    margin-top: 4px;
  }

  .error-message.inline {
    margin: 4px 0 0 0;
  }

  .environments-list {
    margin-top: 8px;
    border: 1px solid #e1e4e8;
    border-radius: 6px;
    overflow: hidden;
  }

  .env-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    border-bottom: 1px solid #e1e4e8;
  }

  .env-row:last-child {
    border-bottom: none;
  }

  .env-name {
    font-weight: 500;
  }

  .env-actions {
    display: flex;
    gap: 4px;
  }

  .env-edit-row {
    padding: 8px 12px;
    border-bottom: 1px solid #e1e4e8;
  }

  .env-edit-row:last-child {
    border-bottom: none;
  }

  .env-edit-row input {
    margin-bottom: 4px;
  }

  .env-edit-row .env-actions {
    display: flex;
    gap: 4px;
    margin-top: 4px;
  }

  .add-env-row {
    display: flex;
    padding: 8px 12px;
  }

  .add-env-row input {
    flex: 1;
    margin-right: 8px;
  }

  button {
    padding: 6px 12px;
    border: 1px solid #e1e4e8;
    border-radius: 4px;
    background: white;
    cursor: pointer;
    font-size: 0.9em;
  }

  button:hover:not(:disabled) {
    background-color: #f6f8fa;
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .edit-btn, .remove-btn {
    padding: 4px 8px;
    font-size: 0.9em;
  }

  .save-btn {
    background-color: #28a745;
    color: white;
    border-color: #28a745;
  }

  .save-btn:hover {
    background-color: #218838;
  }

  .cancel-btn {
    background-color: #6c757d;
    color: white;
    border-color: #6c757d;
  }

  .cancel-btn:hover {
    background-color: #5a6268;
  }

  .add-btn {
    background-color: #0366d6;
    color: white;
    border-color: #0366d6;
  }

  .add-btn:hover:not(:disabled) {
    background-color: #035fc7;
  }

  .current-env-display {
    padding: 8px 12px;
    background-color: #f6f8fa;
    border-radius: 6px;
    margin-bottom: 8px;
    font-weight: 500;
  }

  .current-env {
    color: #0366d6;
  }

  .no-env {
    color: #6a737d;
    font-style: italic;
  }

  .env-switcher {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .env-btn {
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 0.85em;
    background-color: #f6f8fa;
    border-color: #e1e4e8;
  }

  .env-btn:hover {
    background-color: #e1e4e8;
  }

  .env-btn.active {
    background-color: #0366d6;
    color: white;
    border-color: #0366d6;
  }
</style>