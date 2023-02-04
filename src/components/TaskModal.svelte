<script lang="ts">
  import type Task from "src/types/Task";
  import { changeDescription, changeTitle } from "src/util/changeTask";
  import VerticalTextArea from "./VerticalTextArea.svelte";

  const defaultTask = {
    name: "",
    description: "",
    timestamp: 0,
    completed: false,
  };
  export let task = defaultTask;
  export let open = false;
  export let onClose = () => {};
  const datetime = new Date(0);
  $: task ??= defaultTask;
  $: datetime.setUTCSeconds(task.timestamp);

  export let onChange: (fn: (task: Task) => Task) => void;

  function handleInput(e: Event) {
    onChange(changeDescription((e.target as HTMLTextAreaElement).value));
  }
</script>

<dialog {open}>
  <section>
    <input
      value={task.name}
      placeholder="Name your task!"
      on:input={(e) => {
        onChange(changeTitle(e.currentTarget.value));
      }}
    />
    <VerticalTextArea
      value={task.description}
      placeholder="Write a little more..."
      on:input={handleInput}
    />
    <div>{datetime}</div>
    <button on:click={onClose}>close</button>
  </section>
</dialog>

<style>
  dialog {
    z-index: 1000;
  }
  section {
    display: flex;
    flex-direction: column;
  }
  input {
    font-size: 1.25em;
  }
</style>
