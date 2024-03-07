<script setup>
  import PokemonList from './components/PokemonList.vue'
</script>

<style>
  .logo {
    display: inline;
    width: 60px;
    height: 60px;
    margin: 5px 20px 5px 5px;
    opacity: var(--imgOp);
  }
  
  header {
    background-color: #313131;
    width: 100% !important;
  }
  
  .navBarCustom {
    display: flex;
    flex-wrap: wrap;
    flex-basis: 50% !important;
    background-image: url("assets/all_p.jpg");
    background-position: center;
    opacity: var(--imgOp);
  }

  .pokedexLetters{
    max-width: 15%;
    height: auto;
    opacity: var(--imgOp);
  }

  :root{
    --tsTitle: 0.5;
  }

  @media (min-width: 1024px) {
    /* header {
      display: flex;
      place-items: center;
      padding-right: calc(var(--section-gap) / 2);
    } */

    /* .logo {
      margin: 5px 2rem 5px 5px;
    } */

    /* header .wrapper {
      display: flex;
      place-items: flex-start;
      flex-wrap: wrap;
    } */
  }

  @media (max-width: 450px) {
    .logo {
      margin-left: 2px;
      margin-bottom: 2px;
      margin-top: 2px;
    }

    .pokedexLetters{
      max-width: 35%;
      height: auto;
      /* opacity: var(--imgOp); */
    }
  }
</style>
<template>
  <header class="navBarCustom">
    <img alt="App logo" class="logo" src="./assets/pokeball.png"/>

    <!-- <h1 class="navTitle">Pokédex</h1> -->
    <img alt="Pokédex" class="pokedexLetters" src="./assets/pokedex.png"/>
    
    <div class="wrapper">

    </div>
  </header>

  <main>
    <PokemonList />
  </main>
  <footer>
  </footer>
</template>