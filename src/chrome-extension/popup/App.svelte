<script>
  import { onMount } from 'svelte';
  import ProjectView from './ProjectView.svelte';
  import SyncControls from './SyncControls.svelte';
  import OptionsPanel from './OptionsPanel.svelte';

  // State variables
  let project = null;
  let syncInProgress = false;
  let syncStatus = '';
  let error = null;
  let showOptions = false;
  let showSuccess = false;
  let options = {
    githubToken: '',
    defaultBranch: 'main',
    environments: ['main', 'development', 'staging', 'production'],
    autoSync: false,
    syncInterval: 30
  };

  // Load options when component mounts
  onMount(async () => {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_OPTIONS' });
      if (response && response.options) {
        options = { ...options, ...response.options };
      }
    } catch (err) {
      console.error('[Bolt.DIY to GitHub] Failed to load options:', err);
      error = 'Failed to load options. Please check extension permissions.';
    }

    // Set up message listener for background script messages
    chrome.runtime.onMessage.addListener(handleBackgroundMessage);
  });

  // Handle sync action
  function handleSync() {
    if (!project) {
      showError('No project detected. Please navigate to a Bolt.DIY project page.');
      return;
    }

    if (syncInProgress) {
      return;
    }

    syncInProgress = true;
    syncStatus = 'Starting sync...';
    error = null;
    showSuccess = false;

    chrome.runtime.sendMessage({
      type: 'START_SYNC',
      projectId: project.id,
      options: {
        branch: options.defaultBranch,
        message: `Sync from Bolt.DIY to GitHub - ${new Date().toISOString()}`
      }
    }).catch(err => {
      syncInProgress = false;
      showError(`Failed to start sync: ${err.message}`);
    });
  }

  // Handle options save
  function handleSaveOptions(newOptions) {
    chrome.runtime.sendMessage({
      type: 'SAVE_OPTIONS',
      options: newOptions
    }).then(response => {
      if (response && response.type === 'OPTIONS_SAVED') {
        options = newOptions;
        showOptions = false;
        showSuccessMessage('Options saved successfully!');
      } else {
        showError('Failed to save options. Please try again.');
      }
    }).catch(err => {
      showError(`Failed to save options: ${err.message}`);
    });
  }

  // Toggle options panel
  function toggleOptions() {
    showOptions = !showOptions;
    // Clear any success messages when switching views
    if (showOptions) {
      showSuccess = false;
    }
  }

  // Show error message with timeout
  function showError(message) {
    error = message;
    showSuccess = false;

    // Auto-clear error after 5 seconds
    setTimeout(() => {
      if (error === message) {
        error = null;
      }
    }, 5000);
  }

  // Show success message with timeout
  function showSuccessMessage(message) {
    syncStatus = message;
    showSuccess = true;
    error = null;

    // Auto-clear success message after 3 seconds
    setTimeout(() => {
      if (syncStatus === message) {
        syncStatus = '';
        showSuccess = false;
      }
    }, 3000);
  }

  // Handle messages from background script
  function handleBackgroundMessage(message) {
    switch (message.type) {
      case 'PROJECT_UPDATED':
        project = message.project;
        break;

      case 'SYNC_STARTED':
        syncInProgress = true;
        syncStatus = 'Sync in progress...';
        error = null;
        break;

      case 'SYNC_COMPLETED':
        syncInProgress = false;
        showSuccessMessage('Sync completed successfully!');
        break;

      case 'SYNC_FAILED':
        syncInProgress = false;
        showError(`Sync failed: ${message.error}`);
        break;

      case 'ERROR_OCCURRED':
        showError(`Error: ${message.error.message}`);
        break;

      default:
        // Ignore unknown message types
        break;
    }
  }
</script>

<div class="container">
  <header>
    <h1>Bolt.DIY → GitHub</h1>
    <button class="options-btn" on:click={toggleOptions}>
      {showOptions ? '◀' : '⚙️'}
    </button>
  </header>

  {#if error}
    <div class="error">
      {error}
    </div>
  {/if}

  {#if syncStatus}
    <div class="status {syncInProgress ? 'in-progress' : showSuccess ? 'success' : 'info'}">
      {syncStatus}
    </div>
  {/if}

  {#if showOptions}
    <OptionsPanel
      options={options}
      onSave={handleSaveOptions}
      onCancel={toggleOptions}
    />
  {:else}
    <main>
      {#if project}
        <ProjectView {project} />
        <SyncControls
          {syncInProgress}
          onSync={handleSync}
          branch={options.defaultBranch}
        />
      {:else}
        <div class="no-project">
          <p>No Bolt.DIY project detected</p>
          <p>Navigate to a Bolt.DIY project page to begin</p>
        </div>
      {/if}
    </main>
  {/if}

  <footer>
    <p>Multi-environment branching enabled</p>
  </footer>
</div>

<style>
  .container {
    padding: 16px;
    max-width: 100%;
    box-sizing: border-box;
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  h1 {
    margin: 0;
    font-size: 1.2em;
    color: #24292e;
  }

  .options-btn {
    background: none;
    border: none;
    font-size: 1.2em;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
  }

  .options-btn:hover {
    background-color: #e1e4e8;
  }

  .error {
    background-color: #ffeef0;
    color: #d73a49;
    padding: 8px 12px;
    border-radius: 6px;
    margin-bottom: 16px;
    font-size: 0.9em;
  }

  .status {
    padding: 8px 12px;
    border-radius: 6px;
    margin-bottom: 16px;
    font-size: 0.9em;
  }

  .status.in-progress {
    background-color: #f1f8ff;
    color: #0366d6;
  }

  .status.success {
    background-color: #f0fff4;
    color: #28a745;
  }

  .status.info {
    background-color: #f1f8ff;
    color: #0366d6;
  }

  .no-project {
    text-align: center;
    padding: 32px 0;
    color: #6a737d;
  }

  .no-project p {
    margin: 8px 0;
  }

  footer {
    margin-top: 16px;
    text-align: center;
    font-size: 0.8em;
    color: #6a737d;
  }
</style>