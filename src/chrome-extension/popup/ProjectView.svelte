<script>
  export let project;
</script>

<div class="project-view">
  <h2>{project.name}</h2>

  <div class="project-info">
    <div class="info-item">
      <span class="label">ID:</span>
      <span class="value">{project.id}</span>
    </div>

    <div class="info-item">
      <span class="label">URL:</span>
      <span class="value url">{project.url}</span>
    </div>

    <div class="info-item">
      <span class="label">Detected:</span>
      <span class="value">{new Date(project.timestamp).toLocaleString()}</span>
    </div>

    {#if project.description}
      <div class="info-item">
        <span class="label">Description:</span>
        <span class="value description">{project.description}</span>
      </div>
    {/if}
  </div>

  {#if project.fileStructure}
    <div class="file-structure">
      <h3>File Structure</h3>
      <ul>
        {#each project.fileStructure as item}
          <li class="{item.type}">
            {item.name} {#if item.type === 'file'}({item.size} bytes){/if}
          </li>
        {/each}
      </ul>
    </div>
  {/if}
</div>

<style>
  .project-view {
    background-color: white;
    border-radius: 6px;
    padding: 16px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    margin-bottom: 16px;
  }

  h2 {
    margin: 0 0 12px 0;
    font-size: 1.1em;
    color: #24292e;
    word-break: break-all;
  }

  h3 {
    margin: 12px 0 8px 0;
    font-size: 1em;
    color: #24292e;
  }

  .project-info {
    margin-bottom: 12px;
  }

  .info-item {
    display: flex;
    margin-bottom: 8px;
    font-size: 0.9em;
  }

  .label {
    font-weight: 600;
    color: #586069;
    width: 100px;
    flex-shrink: 0;
  }

  .value {
    color: #24292e;
    word-break: break-all;
  }

  .value.url {
    color: #0366d6;
    text-decoration: none;
  }

  .value.description {
    font-style: italic;
  }

  .file-structure ul {
    list-style-type: none;
    padding-left: 16px;
    margin: 0;
  }

  .file-structure li {
    margin: 4px 0;
    font-size: 0.9em;
  }

  .file-structure li.file::before {
    content: "📄 ";
  }

  .file-structure li.directory::before {
    content: "📁 ";
  }
</style>