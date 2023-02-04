<script lang="ts">
  import { onMount } from "svelte";
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();

  export let value = "";
  export let placeholder = "";
  export let className = "";
  let textEl: HTMLTextAreaElement;

  function fit() {
    textEl.style.height = "";
    textEl.style.height = `${textEl.scrollHeight + 4}px`;
  }
  function onFocus() {
    textEl.readOnly = false;
  }
  function onBlur() {
    textEl.readOnly = true;
    window.getSelection()?.removeAllRanges();
  }

  onMount(() => {
    fit();
    dispatch("message", {
      textEl,
    });
  });

  const autosize = true;
</script>

<textarea
  readonly
  class:autosize
  class={className || ""}
  rows={1}
  bind:this={textEl}
  bind:value
  {placeholder}
  on:mousedown|stopPropagation={() => {}}
  on:input
  on:input={fit}
  on:focus={onFocus}
  on:blur={onBlur}
/>

<style>
  textarea {
    font: inherit;
    font-family: sans-serif;
    resize: none;
    width: 100%;
    margin: 0;
    overflow: hidden;
  }
  textarea:focus {
  }
  textarea:not(:focus) {
    border-color: transparent;
  }
  textarea:placeholder-shown {
    font-style: italic;
    font-weight: normal;
  }
</style>
