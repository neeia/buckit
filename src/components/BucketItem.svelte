<script lang="ts">
  import { tick } from "svelte";
  import AutoSizeArea from "./AutoSizeArea.svelte";
  import Checkbox from "./Checkbox.svelte";

  export let title: string;
  export let description: string;
  export let completed: boolean;

  let nameEl: AutoSizeArea;
  export function focus() {
    nameEl.focus();
  }

  let liEl: HTMLElement;
  async function handleMouseDown(e: MouseEvent) {
    if (e.button) return;
    liEl.setAttribute("draggable", "true");
    await tick();
    liEl.style.opacity = "0.2";
    liEl.style.border = "1px dotted black";
  }
  function handleMouseUp() {
    liEl.setAttribute("draggable", "false");
    liEl.style.opacity = "";
    liEl.style.border = "";
  }
</script>

<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<li
  tabindex="0"
  bind:this={liEl}
  on:dragstart|stopPropagation
  on:dragend={handleMouseUp}
  on:dragend
>
  <div
    class="drag-handle"
    on:mousedown|stopPropagation={handleMouseDown}
    on:mouseup={handleMouseUp}
    aria-hidden="true"
    on:click={() => liEl.focus()}
  />
  <div class="content">
    <AutoSizeArea
      on:message
      className="title"
      placeholder="Untitled"
      bind:value={title}
      bind:this={nameEl}
    />
    <AutoSizeArea
      className="description"
      bind:value={description}
      placeholder="Description..."
    />
    <div class="checkbox">
      <Checkbox bind:checked={completed} />
    </div>
  </div>
</li>

<style>
  li {
    display: grid;
    grid-template-columns: auto minmax(0, 100%);
    align-items: center;
    max-width: 100%;
    padding: 6px 0px 8px 4px;
    border-top: 3px solid var(--app-theme);
    box-shadow: 0px 1px 4px -2px rgba(0, 0, 0, 0.25);
    background-color: white;
  }
  div.drag-handle {
    background-image: url(/img/icons/vertical-dragger.svg);
    background-repeat: no-repeat;
    background-position: center;
    width: 24px;
    height: 100%;
    cursor: grab;
    filter: invert(60%);
    user-select: none;
  }
  div.content {
    display: grid;
    grid-template-columns: minmax(0, 100%) auto;
    max-width: 100%;
  }
  div.checkbox {
    grid-area: 1 / 2;
  }

  :global(textarea.autosize.title) {
    font-size: 1.25em;
    font-weight: 400;
  }
  :global(textarea.autosize.description) {
    grid-column: span 2;
    color: #888;
    font-size: 0.9em;
    font-weight: 100;
  }
  :global(textarea.autosize.description:placeholder-shown) {
    opacity: 0.6;
  }
</style>
