<script lang="ts">
  import { collection } from "src/stores/stores";
  import Bucket from "src/components/Bucket.svelte";
  import BucketItem from "src/components/BucketItem.svelte";
  import type Task from "src/types/Task";
  import type Collection from "src/types/Collection";
  import { afterUpdate, onMount, tick } from "svelte";
  import type Buckit from "src/types/Buckit";
  import { bucketMime, taskMime } from "src/util/mimes";
  import * as Realm from "realm-web";
  import UserAccount from "src/components/UserAccount.svelte";

  const app = new Realm.App({ id: "buckit-bhkwv" });
  let user: Realm.User | null = app.currentUser;

  async function login(email: string, password: string) {
    // Create an email/password credential
    const credentials = Realm.Credentials.emailPassword(email, password);
    try {
      // Authenticate the user
      user = await app.logIn(credentials);
      // `App.currentUser` updates to match the logged in user
      console.assert(user.id === app.currentUser?.id);
      return user;
    } catch (err) {
      console.error("Failed to log in", err);
    }
  }

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

  let bucketObjs: Bucket[] = [];
  function validateAddBucket(event: DragEvent) {
    if (event.dataTransfer) {
      if (event.dataTransfer.types.includes(bucketMime)) {
        return;
      } else if (event.dataTransfer.types.includes(taskMime)) {
        event.preventDefault();
      }
    }
  }
  async function addBucket(event?: DragEvent) {
    let dropData: Task;
    dragging = false;
    try {
      if (event && event.dataTransfer) {
        if (event.dataTransfer.types.includes(bucketMime)) {
          return;
        } else if (
          event.dataTransfer.types.includes(taskMime) &&
          draggedTaskTarget
        ) {
          dropData = JSON.parse(event.dataTransfer.getData("text/plain"));
          deleteItem();
        }
      }
    } catch {
      return;
    }
    collection.update((coll: Collection) => {
      coll.buckets.unshift({
        name: "",
        timestamp: Date.now(),
        tasks: dropData
          ? [
              {
                name: dropData.name,
                description: dropData.description,
                completed: dropData.completed,
                timestamp: Date.now(),
              },
            ]
          : [],
      });
      return coll;
    });
    await tick();
    bucketObjs[0].focus();
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
      coll.buckets[bucket].tasks.push({ ...emptyTask });
      return coll;
    });
    await tick();
    newestItem.focus();
  }

  let draggedTaskIndex: { bucket: number; index?: number } | undefined;
  let draggedTaskTarget: { bucket: number; index?: number } | undefined;

  let dragging = false;
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
      event.dataTransfer.setData(
        index === undefined ? bucketMime : taskMime,
        ""
      );
      event.dataTransfer.dropEffect = "move";
    }
    dragging = true;
  }
  // used to determine if over bucket or child
  var enterTarget: EventTarget | null = null;

  let taskDIEl: HTMLDivElement;
  let currentBucketEl: HTMLUListElement;
  $: taskRects =
    currentBucketEl &&
    [...currentBucketEl.children].map((e) => e.getBoundingClientRect());
  function dragOverTask(event: DragEvent) {
    if (
      !draggedTaskTarget ||
      !event.dataTransfer ||
      !event.dataTransfer.types.includes(taskMime)
    )
      return;
    event.preventDefault();
    enterTarget = event.currentTarget;
    // calculate y-midpoint for each child
    const childMidYs = taskRects.map((rect) => (rect.top + rect.bottom) / 2);
    const bucketBounds = currentBucketEl.getBoundingClientRect();
    let i = 0;
    childMidYs.forEach((y) => {
      if (event.clientY > y) {
        i++;
      }
    });
    draggedTaskTarget.index = i;

    if (taskRects.length === 0 || i === 0) {
      // empty bucket or before first child
      taskDIEl.style.top = `${bucketBounds.top}px`;
    } else if (i === taskRects.length) {
      // after last child
      taskDIEl.style.top = `${taskRects[i - 1].bottom + 6}px`;
    } else {
      // general case
      taskDIEl.style.top = `${
        (taskRects[i].top + taskRects[i - 1].bottom) / 2 - 1
      }px`;
    }

    // align and fit indicator horizontally
    taskDIEl.style.left = `${bucketBounds.left}px`;
    taskDIEl.style.height = "3px";
    taskDIEl.style.width = `${bucketBounds.right - bucketBounds.left}px`;
  }

  let bucketDIEl: HTMLDivElement;
  function dragOverBucket(event: DragEvent) {
    if (!event.dataTransfer || !event.dataTransfer.types.includes(bucketMime))
      return;
    event.preventDefault();
    enterTarget = event.currentTarget;
    // calculate y-midpoint for each child
    let bucketRects =
      containerEl &&
      [...containerEl.children].map((e) => e.getBoundingClientRect());
    const childMidXs = bucketRects.map((rect) => (rect.left + rect.right) / 2);
    const bucketBounds = containerEl.getBoundingClientRect();
    let i = 0;
    childMidXs.forEach((x) => {
      if (event.clientX > x) {
        i++;
      }
    });
    draggedTaskTarget = { bucket: i };

    if (bucketRects.length === 0 || i === 0) {
      // no buckets or before first child
      bucketDIEl.style.left = `${bucketBounds.left + 4}px`;
    } else if (i === bucketRects.length) {
      // after last child
      bucketDIEl.style.left = `${bucketRects[i - 1].right + 4}px`;
    } else {
      // general case
      bucketDIEl.style.left = `${
        (bucketRects[i].left + bucketRects[i - 1].right) / 2 - 2
      }px`;
    }

    // align and fit indicator horizontally
    bucketDIEl.style.top = `${bucketBounds.top}px`;
    bucketDIEl.style.height = `${bucketBounds.bottom - bucketBounds.top}px`;
  }
  function dragLeave(event: DragEvent, bucket?: boolean) {
    if (event.target === enterTarget) {
      if (!bucket) taskDIEl.setAttribute("style", "");
      if (bucket) bucketDIEl.setAttribute("style", "");
    }
  }
  async function drop(event: DragEvent) {
    if (!event.dataTransfer || !draggedTaskTarget) return;
    let dropData: Task | Buckit;
    try {
      dropData = JSON.parse(event.dataTransfer.getData("text/plain"));
    } catch {
      return;
    }
    if (event.dataTransfer.types.includes(taskMime)) {
      // Dropped task
      taskDIEl.setAttribute("style", "");
      let { bucket, index } = draggedTaskTarget;
      if (index === undefined) return;
      if (draggedTaskIndex) {
        let { bucket: b2, index: i2 } = draggedTaskIndex;
        deleteItem();
        if (i2 !== undefined) {
          if (b2 === bucket && i2 < index) {
            index--;
          }
        }
      } else {
        dropData.timestamp = Date.now();
      }
      collection.update((coll: Collection) => {
        coll.buckets[bucket].tasks.splice(index!, 0, dropData as Task);
        return coll;
      });

      await tick();
      (currentBucketEl.children[index] as HTMLElement).focus();
    } else if (event.dataTransfer.types.includes(bucketMime)) {
      // Dropped bucket
      bucketDIEl.setAttribute("style", "");
      let { bucket } = draggedTaskTarget;
      if (draggedTaskIndex) {
        let { bucket: b2 } = draggedTaskIndex;
        !deleteItem();
        if (b2 < bucket) {
          bucket--;
        }
      } else {
        dropData.timestamp = Date.now();
      }
      collection.update((coll: Collection) => {
        coll.buckets.splice(bucket, 0, dropData as Buckit);
        return coll;
      });

      await tick();
      (containerEl.children[bucket] as HTMLElement).focus();
    }
    dragging = false;
  }
  function deleteItem(): boolean {
    dragging = false;
    if (!draggedTaskIndex) return false;
    const { bucket, index } = draggedTaskIndex;
    collection.update((coll: Collection) => {
      if (Number.isInteger(index)) coll.buckets[bucket].tasks.splice(index!, 1);
      else coll.buckets.splice(bucket, 1);
      return coll;
    });
    draggedTaskIndex = undefined;
    return true;
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
    dragging = false;
  }

  onMount(() => {
    window.addEventListener("resize", checkOverflow);
    return () => window.removeEventListener("resize", checkOverflow);
  });

  afterUpdate(checkOverflow);

  function checkOverflow() {
    if (containerEl.scrollWidth > containerEl.clientWidth) {
      containerEl.style.marginBottom = "12px";
    } else {
      containerEl.style.marginBottom = "";
    }
  }
</script>

<svelte:head>
  <title>Buckit 🪣</title>
  <meta property="og:title" content="Buckit 🪣" />
  <meta
    name="og:description"
    content="Buckit helps you write your bucket list - what do you want to do before you die?"
  />
  <meta name="theme-color" content="#17d171" />
</svelte:head>
<div class="container">
  <div class="aside">
    <div class="title-user">
      <h1><img src="/img/title.svg" alt="bucket" class="title" /></h1>
      <hr />
      <UserAccount {user} {login} />
    </div>
    <hr />
    <section class="controls">
      <button
        class:dragging
        class="drop-zone add-bucket"
        on:click={() => addBucket()}
        on:dragover={validateAddBucket}
        on:drop={addBucket}
      >
        <img
          src="/img/icons/add-bucket.svg"
          width="32px"
          height="32px"
          alt=""
        />
        Add Bucket
      </button>
      <div
        class:dragging
        class="drop-zone delete-bucket"
        on:drop={deleteItem}
        on:dragover={(e) => e.preventDefault()}
      >
        <img src="/img/icons/trash-can.svg" width="32px" height="32px" alt="" />
        Trash Can
      </div>
    </section>
    <hr />
  </div>
  <ol
    bind:this={containerEl}
    on:mousedown={handleMouseDown}
    on:dragover={dragOverBucket}
    on:dragleave={(e) => dragLeave(e, true)}
  >
    {#each data.buckets as bucket, i (bucket.timestamp)}
      <Bucket
        bind:this={bucketObjs[i]}
        bind:name={$collection.buckets[i].name}
        on:click={() => addTask(i)}
        on:dragstart={(e) => dragStart(e, i)}
        on:dragend={dragEnd}
        on:dragover={dragOverTask}
        on:dragleave={dragLeave}
        on:drop={drop}
        on:message={(e) => {
          currentBucketEl = e.detail.ulEl;
          draggedTaskTarget = { bucket: i };
        }}
      >
        {#each bucket.tasks as task, j (task.timestamp)}
          <BucketItem
            bind:title={$collection.buckets[i].tasks[j].name}
            bind:description={$collection.buckets[i].tasks[j].description}
            bind:completed={$collection.buckets[i].tasks[j].completed}
            on:dragstart={(e) => dragStart(e, i, j)}
            on:dragend={dragEnd}
            on:message={(e) => (newestItem = e.detail.textEl)}
          />
        {/each}
      </Bucket>
    {/each}
  </ol>
</div>
<div class="h-drop-indicator" bind:this={taskDIEl} />
<div class="v-drop-indicator" bind:this={bucketDIEl} />
<svelte:window on:mouseup={handleMouseUp} on:mousemove={handleMove} />
<svelte:body on:dragenter={mouseEnter} on:dragleave={mouseLeave} />

<style>
  div.h-drop-indicator {
    position: absolute;
    height: 3px;
    background-color: darkgreen;
    pointer-events: none;
  }
  div.v-drop-indicator {
    position: absolute;
    width: 4px;
    background-color: darkgreen;
    pointer-events: none;
  }
  :global(html) {
    height: 100svh;
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
    width: 100%;
  }
  img.title {
    width: 100%;
    height: auto;
  }
  div.container {
    display: flex;
    height: 100%;
  }
  hr {
    width: 100%;
    margin: 0;
    border: 1px solid var(--app-theme);
  }
  div.aside {
    display: flex;
    flex-direction: column;
    align-items: start;
    background-color: #fafffc;
    width: calc(var(--bucket-width) / 2);
    flex-shrink: 0;
    padding: 4px 12px;
  }
  div.title-user {
    width: 100%;
  }
  section.controls {
    display: grid;
    grid-template-rows: 1fr 1fr;
    background-color: #fafffc;
    width: 100%;
    flex-shrink: 0;
    padding: 4px 12px;
    gap: 4px;
  }
  *.drop-zone {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    font-size: 14px;
    background-color: transparent;
    border: 2px solid transparent;
    border-radius: 4px;
    padding: 4px 6px;
    user-select: none;
    -webkit-user-select: none;
  }
  *.drop-zone > img {
    width: 100%;
    height: auto;
    pointer-events: none;
  }
  button.add-bucket {
    cursor: pointer;
  }
  button.add-bucket.dragging {
    border: 2px dashed var(--app-theme);
    background-color: honeydew;
  }
  div.delete-bucket {
    opacity: 0.25;
  }
  div.delete-bucket.dragging {
    opacity: 1;
    border: 2px dashed crimson;
    background-color: rgba(255, 100, 100, 0.1);
  }
  @media only screen and (max-width: 770px) {
    div.container {
      flex-direction: column;
    }
    div.aside {
      flex-direction: row;
      width: 100%;
      padding: 4px 12px;
      gap: 1em;
    }
    section.controls {
      grid-template-columns: 1fr 1fr;
      grid-template-rows: none;
      background-color: #fafffc;
      width: min-content;
      height: 100%;
      padding: 4px;
      gap: 4px;
    }
    hr {
      display: none;
    }
    *.drop-zone {
      flex-direction: row;
      font-size: 14px;
      padding: 0px;
      text-align: center;
      gap: 2px;
    }
    *.drop-zone > img {
      height: 3em;
      width: auto;
    }
  }
  ol {
    display: flex;
    gap: 8px;
    margin: 0px;
    padding: 0px 12px;
    padding-block: 8px;
    height: 100%;
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
  @media only screen and (max-width: 770px) {
    ol::-webkit-scrollbar {
      height: 32px;
    }
  }
</style>
