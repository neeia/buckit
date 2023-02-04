<script lang="ts">
  export let value: string;
  export let placeholder: string;

  let textArea: HTMLTextAreaElement;
  let clientHeight: number;
  let resize = false;
  function handleMove(e: MouseEvent) {
    e.preventDefault();
    if (resize) {
      clientHeight += e.movementY;
    }
  }
  function handleMouseDown(e: MouseEvent) {
    if (e.button) return;
    resize = true;
  }
  function handleMouseUp() {
    resize = false;
    if (clientHeight < 100) clientHeight = 100;
  }
</script>

<textarea
  bind:this={textArea}
  bind:clientHeight
  {value}
  {placeholder}
  on:input
  style:height={`${Math.max(clientHeight, 100)}px`}
/>
<div
  draggable="false"
  on:pointerdown={handleMouseDown}
>
  <img class="reverse" src="/img/icons/resize-y.svg" alt="drag icon" />
  <img src="/img/icons/resize-y.svg" alt="drag icon" />
</div>
<svelte:window on:pointerup={handleMouseUp} on:pointermove={handleMove} />

<style>
  textarea {
    font: inherit;
    resize: none;
  }
  div {
    display: flex;
    justify-content: center;
    height: 1rem;
    cursor: n-resize;
    box-sizing: border-box;
    user-select: none;
    -webkit-user-select: none;
  }
  img {
    pointer-events: none;
    filter: invert(50%);
  }
  img.reverse {
    transform: scaleX(-1);
  }
</style>
