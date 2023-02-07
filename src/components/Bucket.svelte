<script lang="ts">
  import { taskMime } from "src/util/mimes";
  import { afterUpdate, createEventDispatcher, onMount, tick } from "svelte";
  const dispatch = createEventDispatcher();

  export let name: string;

  let inputEl: HTMLInputElement;
  export function focus() {
    inputEl.focus();
  }
  function onFocus() {
    inputEl.readOnly = false;
  }
  function onBlur() {
    inputEl.readOnly = true;
  }

  let ulEl: HTMLUListElement;
  function dragover(event: DragEvent) {
    if (event.dataTransfer && event.dataTransfer.types.includes(taskMime))
      dispatch("message", {
        ulEl,
      });
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

  onMount(() => {
    window.addEventListener("resize", checkOverflow);
    return () => window.removeEventListener("resize", checkOverflow);
  });

  afterUpdate(checkOverflow);

  function checkOverflow() {
    if (ulEl.scrollHeight > ulEl.clientHeight) {
      ulEl.style.paddingRight = "4px";
    } else {
      ulEl.style.paddingRight = "";
    }
  }
</script>

<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<li
  bind:this={liEl}
  on:dragstart
  on:dragend={handleMouseUp}
  on:dragend
  on:dragover={dragover}
  on:dragover
  on:dragleave
  on:drop
  tabindex="0"
>
  <div
    class="drag-handle"
    on:mousedown|stopPropagation={handleMouseDown}
    on:mouseup={handleMouseUp}
    aria-hidden="true"
    on:click={() => liEl.focus()}
  />
  <div class="header">
    <input
      readonly
      bind:value={name}
      placeholder="Untitled"
      bind:this={inputEl}
      on:focus={onFocus}
      on:blur={onBlur}
    />
    <button on:click>New Task</button>
  </div>
  <ul bind:this={ulEl}>
    <slot />
  </ul>
</li>

<style>
  li {
    display: grid;
    grid-template-rows: auto min-content minmax(0, 100%);
    align-items: start;
    background-color: #fafffc;
    width: var(--bucket-width);
    flex-shrink: 0;
    box-sizing: border-box;
    padding: 4px 12px;
    height: 100%;
  }
  div.drag-handle {
    background-image: url(/img/icons/horizontal-dragger.svg);
    background-repeat: no-repeat;
    background-position: center;
    width: 100%;
    height: 24px;
    cursor: grab;
    filter: invert(60%);
    user-select: none;
  }
  div.header {
    display: grid;
    grid-template-columns: minmax(0, 100%) auto;
    align-items: center;
  }
  input {
    font-size: 1.25em;
    font-weight: 700;
    margin: 8px 2px;
    text-overflow: ellipsis;
  }
  input:not(:focus) {
    border-color: transparent;
    background-color: transparent;
  }
  input:placeholder-shown {
    font-style: italic;
    font-weight: normal;
  }
  button {
    float: right;
    background-color: transparent;
    color: var(--app-theme-dark);
    border: 1px solid var(--app-theme);
    border-radius: 4px;
    padding: 4px 6px;
    cursor: pointer;
    width: max-content;
    height: 80%;
    user-select: none;
    -webkit-user-select: none;
  }
  ul {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin: 0;
    padding: 6px 0px;
    list-style-type: none;
    overflow-y: auto;
    max-height: 100%;
  }
  ul::-webkit-scrollbar {
    width: 6px;
  }
  ul::-webkit-scrollbar-thumb {
    background-color: rgba(70, 70, 70, 0.1);
    border: transparent;
    border-radius: 6px;
  }
  ul::-webkit-scrollbar-button {
    height: 4px;
  }
  ul::-webkit-scrollbar-track {
    background: rgba(155, 155, 155, 0.1);
    border-radius: 8px;
  }
</style>
