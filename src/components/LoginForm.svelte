<script lang="ts">
  export let login: (user: string, pass: string) => void;
  export let open = false;
  export let onClose = () => {};

  function handleSubmit() {
    login(user, pass);
  }

  let user = "";
  let pass = "";
</script>

<dialog {open}>
  <form on:submit|preventDefault={handleSubmit}>
    <h2>Log In</h2>
    <input type="text" bind:value={user} />
    <input type="text" bind:value={pass} />
    <input type="submit" />
  </form>
</dialog>

<style>
  dialog {
    z-index: 1000;
    position: absolute;
    top: 0;
    left: 0;
  }
  @media only screen and (max-width: 770px) {
    dialog {
      height: 100%;
      width: 100%;
    }
  }
  form {
    display: flex;
    flex-direction: column;
    width: 100%;
  }
  h2 {
    margin: 0;
  }
</style>
