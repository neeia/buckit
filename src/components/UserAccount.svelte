<script lang="ts">
  import type { User } from "realm-web";
  import LoginForm from "./LoginForm.svelte";

  export let user: User | null;
  export let login: (user: string, pass: string) => void;

  let showLoginForm = false;
</script>

<div>
  {#if user}
    {user.id}
    <button>Sign Out</button>
  {:else}
    <button on:click={() => (showLoginForm = true)}>Log In</button>
    <button on:click={() => (showLoginForm = true)}>Sign Up</button>
  {/if}
</div>
<LoginForm open={showLoginForm} {login} />

<style>
  div {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
  button {
    border: none;
    background-color: rgba(0, 50, 0, 0.1);
    margin: 4px 2px;
    padding: 4px;
    border-radius: 2px;
  }
</style>
