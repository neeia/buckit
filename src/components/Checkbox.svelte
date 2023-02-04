<script>
  export let checked = false;
</script>

<input type="checkbox" bind:checked on:click|stopPropagation />

<style>
  input[type="checkbox"] {
    appearance: none;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.5em;
    height: 1.5em;
    background-color: #ddd;
    border-radius: 1px;
    cursor: pointer;
    transition: background-color 0.05s ease;
  }
  input[type="checkbox"]:hover {
    filter: brightness(95%);
  }
  input[type="checkbox"]:checked {
    background-color: #17d171;
  }
  input[type="checkbox"]:checked::after {
    content: "";
    width: 20%;
    height: 50%;
    border: solid white;
    border-width: 0 0.25em 0.25em 0;
    transform: rotate(45deg) translate(-5%, -5%);
    -ms-transform: rotate(45deg) translate(-5%, -5%);
    -webkit-transform: rotate(45deg) translate(-5%, -5%);
  }
</style>
