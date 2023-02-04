<script lang="ts">
  import { collection } from "src/stores/stores";
  import Bucket from "src/components/Bucket.svelte";
  import BucketItem from "src/components/BucketItem.svelte";
  import type Task from "src/types/Task";
  import type Collection from "src/types/Collection";
  import { tick } from "svelte";
  import isTask from "src/util/isTask";

  /*
  const app = new Realm.App({ id: "buckit-bhkwv" });

  async function loginAnonymous() {
    // Create an anonymous credential
    const credentials = Realm.Credentials.anonymous();
    try {
      // Authenticate the user
      const user = await app.logIn(credentials);
      // `App.currentUser` updates to match the logged in user
      console.assert(app.currentUser && user.id === app.currentUser.id);
      return user;
    } catch (err) {
      console.error("Failed to log in", err);
    }
  }

  const data = loginAnonymous().then((user) => {
    if (user) {
      console.log("Successfully logged in!", user.id);
      return user.functions.addUser("test");
    } else console.log("Failed to log in");
  });
  */

  let data: Collection;
  collection.subscribe((value) => {
    data = value;
  });

  let containerEl: HTMLOListElement;
  let scrollLeft: number;
  let panning = false;
  function handleMove(e: MouseEvent) {
    if (panning == true) {
      containerEl.scrollLeft -= e.movementX;
    }
  }
  function handleMouseDown(e: MouseEvent) {
    if (containerEl.scrollWidth === containerEl.clientWidth) return;
    if (e.button) return;
    panning = true;
    scrollLeft = containerEl.scrollLeft;
    document.body.style.cursor = "grab";
  }
  function handleMouseUp() {
    panning = false;
    document.body.style.cursor = "";
  }

  let bucketEls: Bucket[] = [];
  async function addBucket(event?: DragEvent) {
    let dropData: Task;
    try {
      if (event?.dataTransfer && draggedTaskTarget) {
        dropData = JSON.parse(event.dataTransfer.getData("text/plain"));
        deleteItem();
      }
    } catch {
      return;
    }
    collection.update((coll: Collection) => {
      coll.buckets.unshift({
        name: "",
        tasks: dropData
          ? [
              {
                name: dropData.name,
                description: dropData.description,
                completed: dropData.completed,
                timestamp: dropData.timestamp,
              },
            ]
          : [],
      });
      return coll;
    });
    await tick();
    bucketEls[0].focus();
  }

  let newestItem: HTMLTextAreaElement;
  const emptyTask: Task = {
    name: "",
    description: "",
    completed: false,
    timestamp: 0,
  };
  async function addTask(bucket: number) {
    collection.update((coll: Collection) => {
      emptyTask.timestamp = Date.now();
      coll.buckets[bucket].tasks.unshift({ ...emptyTask });
      return coll;
    });
    await tick();
    newestItem.focus();
  }

  let draggedTaskIndex: { bucket: number; index?: number } | undefined;
  let draggedTaskTarget: { bucket: number; index?: number } | undefined;

  let dropIndicatorEl: HTMLDivElement;
  function dragStart(event: DragEvent, bucket: number, index?: number) {
    enterCount = 0;
    draggedTaskTarget = undefined;
    const dragItemData =
      index === undefined
        ? data.buckets[bucket]
        : data.buckets[bucket].tasks[index];
    draggedTaskIndex = { bucket, index };
    if (event.dataTransfer) {
      event.dataTransfer.setData("text/plain", JSON.stringify(dragItemData));
      event.dataTransfer.dropEffect = "move";
    }
  }
  // used to determine if over bucket or child
  var enterTarget: EventTarget | null = null;

  let currentOverBucket: HTMLUListElement;
  $: childRects =
    currentOverBucket &&
    [...currentOverBucket.children].map((el) => el.getBoundingClientRect());
  function dragOver(event: DragEvent) {
    if (!draggedTaskTarget) return;
    event.preventDefault();
    enterTarget = event.currentTarget;
    // calculate y-midpoint for each child
    const childMidYs = childRects.map((rect) => (rect.top + rect.bottom) / 2);
    const bucketBounds = currentOverBucket.getBoundingClientRect();
    let i = 0;
    childMidYs.forEach((y) => {
      if (event.clientY > y) {
        i++;
      }
    });
    draggedTaskTarget.index = i;

    if (childRects.length === 0 || i === 0) {
      // empty bucket or before first child
      dropIndicatorEl.style.top = `${bucketBounds.top}px`;
    } else if (i === childRects.length) {
      // after last child
      dropIndicatorEl.style.top = `${childRects[i - 1].bottom + 6}px`;
    } else {
      // general case
      dropIndicatorEl.style.top = `${
        (childRects[i].top + childRects[i - 1].bottom) / 2
      }px`;
    }

    // align and fit indicator horizontally
    dropIndicatorEl.style.left = `${bucketBounds.left}px`;
    dropIndicatorEl.style.width = `${bucketBounds.right - bucketBounds.left}px`;
  }
  function dragLeave(event: DragEvent) {
    if (event.target === enterTarget) {
      dropIndicatorEl.style.top = "";
      dropIndicatorEl.style.left = "";
    }
  }
  function drop(event: DragEvent) {
    if (!event.dataTransfer || !draggedTaskTarget) return;
    let dropData: Task;
    try {
      dropData = JSON.parse(event.dataTransfer.getData("text/plain"));
    } catch {
      return;
    }
    if (!isTask(dropData)) return;
    deleteItem();
    dropIndicatorEl.style.top = "";
    dropIndicatorEl.style.left = "";
    let { bucket, index } = draggedTaskTarget;
    collection.update((coll: Collection) => {
      if (Number.isInteger(index))
        coll.buckets[bucket].tasks.splice(index!, 0, dropData);
      return coll;
    });
  }
  function deleteItem() {
    if (!draggedTaskIndex) return;
    const { bucket, index } = draggedTaskIndex;
    collection.update((coll: Collection) => {
      if (Number.isInteger(index)) coll.buckets[bucket].tasks.splice(index!, 1);
      else coll.buckets.splice(bucket, 1);
      return coll;
    });
    draggedTaskIndex = undefined;
  }

  let enterCount = 0;
  function mouseEnter() {
    enterCount++;
  }
  function mouseLeave() {
    enterCount--;
  }
  function dragEnd(event: DragEvent) {
    if (enterCount === 0 && event.dataTransfer?.dropEffect !== "none") {
      deleteItem();
    }
  }
</script>

<div class="container">
  <div class="app-bar">
    <h1>Buckit</h1>
  </div>
  <section class="controls">
    <button
      class="drop-zone add-bucket"
      on:click={() => addBucket()}
      on:drop={addBucket}
      on:dragover={(e) => e.preventDefault()}
    >
      <img src="/img/icons/add-bucket.svg" width="32px" height="32px" alt="" />
      Add Bucket
    </button>
    <div
      class="drop-zone delete-bucket"
      on:drop={deleteItem}
      on:dragover={(e) => e.preventDefault()}
    >
      <img src="/img/icons/trash-can.svg" width="32px" height="32px" alt="" />
      Trash Can
    </div>
  </section>
  <ol bind:this={containerEl} on:mousedown={handleMouseDown}>
    {#each data.buckets as bucket, i}
      <Bucket
        bind:this={bucketEls[i]}
        bind:name={$collection.buckets[i].name}
        on:click={() => addTask(i)}
        on:dragover={dragOver}
        on:dragleave={dragLeave}
        on:drop={drop}
        on:message={(e) => {
          currentOverBucket = e.detail.ulEl;
          draggedTaskTarget = { bucket: i };
        }}
      >
        {#each bucket.tasks as task, j}
          <BucketItem
            on:message={(e) => (newestItem = e.detail.textEl)}
            bind:title={$collection.buckets[i].tasks[j].name}
            bind:description={$collection.buckets[i].tasks[j].description}
            bind:completed={$collection.buckets[i].tasks[j].completed}
            on:dragstart={(e) => dragStart(e, i, j)}
            on:dragend={dragEnd}
          />
        {/each}
      </Bucket>
    {/each}
  </ol>
</div>
<div class="drop-indicator" bind:this={dropIndicatorEl} />
<svelte:window on:mouseup={handleMouseUp} on:mousemove={handleMove} />
<svelte:body on:dragenter={mouseEnter} on:dragleave={mouseLeave} />

<style>
  div.drop-indicator {
    position: absolute;
    height: 3px;
    background-color: darkgreen;
    pointer-events: none;
  }
  :global(html) {
    height: 100%;
    width: 100%;
    overflow: hidden;
  }
  :global(body) {
    background-color: honeydew;
    color: rgb(58, 0, 0);
    transition: background-color 0.3s;
    margin: 0;
    height: 100%;
    width: 100%;
    padding: 1px;
  }
  :global(*) {
    box-sizing: border-box;
  }
  :global(:root) {
    --bucket-width: 300px;
    --app-theme: #17d171;
    --app-theme-dark: #17a15a;
  }
  h1 {
    margin: 0;
  }
  div.container {
    display: grid;
    grid-template-areas: "title content" "controls content";
    grid-template-columns: auto minmax(0, 100%);
    grid-template-rows: auto minmax(0, 100%);
    height: 100%;
  }
  div.app-bar {
    grid-area: title;
    display: flex;
    flex-direction: column;
    background-color: #fafffc;
    width: calc(var(--bucket-width) / 2);
    flex-shrink: 0;
    box-sizing: border-box;
    padding: 4px 12px;
    height: calc(100% - 8px);
  }
  section.controls {
    grid-area: controls;
    display: flex;
    flex-direction: column;
    background-color: #fafffc;
    width: calc(var(--bucket-width) / 2);
    flex-shrink: 0;
    box-sizing: border-box;
    padding: 4px 12px;
    height: calc(100% - 8px);
  }
  *.drop-zone {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    font-size: 14px;
    background-color: transparent;
    border-radius: 4px;
    padding: 4px 6px;
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
  }
  *.drop-zone > img {
    width: 100%;
    height: 100%;
  }
  button.add-bucket {
    background-color: transparent;
    border: 2px solid var(--app-theme);
    border-radius: 4px;
    padding: 4px 6px;
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
  }
  div.delete-bucket {
    background-color: transparent;
    padding: 4px 6px;
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
  }
  ol {
    grid-area: content;
    display: flex;
    gap: 8px;
    margin: 0px;
    padding: 0px 12px;
    height: calc(100% - 12px);
    max-width: 100%;
    overflow-x: auto;
    scrollbar-color: rgba(155, 155, 155, 0.5);
    scrollbar-width: thin;
    user-select: none;
  }
  ol::-webkit-scrollbar {
    height: 8px;
  }
  ol::-webkit-scrollbar-thumb {
    background-color: rgba(70, 70, 70, 0.1);
    border: transparent;
    border-radius: 8px;
  }
  ol::-webkit-scrollbar-button {
    width: 6px;
  }
  ol::-webkit-scrollbar-track {
    background: rgba(155, 155, 155, 0.1);
    border-radius: 8px;
  }
  @media only screen and (max-width: 770) {
    ol::-webkit-scrollbar {
      height: 48px;
    }
  }
</style>
