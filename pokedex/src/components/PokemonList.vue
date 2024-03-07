<!-- <script type="text/javascript" src="typeColors.js"></script> -->
<script>
  import { ref, reactive, onMounted } from 'vue';
  import { getColor }  from '../typeColors.js'

  //import axios from 'axios';

  const maxPokemon = 1025

  const API_URL = "https://pokeapi.co/api/v2/pokemon?limit="+maxPokemon;
  const getById = "https://pokeapi.co/api/v2/pokemon/"
  const getSpecies = "https://pokeapi.co/api/v2/pokemon-species/"
  const getGenders = "https://pokeapi.co/api/v2/gender/"

  export default {
    data() {
      return {
        searchInput: '',
        pokemonList: [],
        original: [],
        displayModal: "none",
        detailedPoke: []
      }
    }, methods:{
      setSearch(e){
        this.searchInput = e.target.value
      }, doSearch(sortList){
        let search = this.searchInput

        //console.log(isNaN(search))

        if(search == "" || search == null){
          this.pokemonList = this.original
        }else{
          if(isNaN(search)){
            search = this.searchInput.toLowerCase()
            sortList = this.original
            this.pokemonList = sortList.filter((poke) => poke.name.toLowerCase().includes(search))
          }else if(!isNaN(search)){
            sortList = this.original
            this.pokemonList = sortList.filter((poke) => poke.id == search)
          }
        }

        return this.pokemonList
      }, colorType(type){
        return getColor(type);
      }, toUpper(word){
        let name = word
        let firstTU = name.charAt(0)
        firstTU = firstTU.toUpperCase()
        name = name.slice(1)

        return word = firstTU+name
      }, orderLowest(sortList){
        sortList.sort(function(a, b){
          return a.id - b.id
        })
      }, randomOrder(sortList){
        this.searchInput = ""
        this.pokemonList = this.original
        sortList = this.pokemonList

        sortList.sort(function(){
          return 0.5 - Math.random()
        })
      }, orderList(sortList, e){
        let input = e.target.value

        if(input === "l"){
          this.orderLowest(sortList)
        }else if(input === "h"){
          sortList.sort(function(a, b){
            return b.id - a.id
          })
        }else if(input === "a"){
          sortList.sort(function(a, b){
            a = a.name.toLowerCase();
            b = b.name.toLowerCase();
            return (a < b) ? -1 : (a > b) ? 1 : 0
          })
        }else if(input === "z"){
          sortList.sort(function(a, b){
            a = a.name.toLowerCase();
            b = b.name.toLowerCase();
            return (a > b) ? -1 : (a < b) ? 1 : 0
          })
        }
      }, async getPokeData(){
          try {
            const response = await fetch(API_URL);
            const listed = await response.json();

            const fetchPromises = listed.results.map(async (pokemon) => {
              const url = pokemon.url;
              const urlResponse = await fetch(url);
              const pokeData = await urlResponse.json();

              let plainName = pokeData.species.name

              pokeData.name = this.toUpper(plainName);

              let types = pokeData.types.map((pokeType) => {
                pokeType.type.name = this.toUpper(pokeType.type.name);
                return {name: pokeType.type.name };
              });

              return {
                id: pokeData.id,
                name: pokeData.name,
                sprite: pokeData.sprites.other['home'].front_default,
                // sprite: pokeData.sprites.other['official-artwork'].front_default,
                types: types
              };
            });

            const farfetch = await Promise.all(fetchPromises)

            this.orderLowest(farfetch)
            this.original = farfetch

            this.pokemonList = farfetch
          } catch (error) {
              console.error(error);
          }
      }, async pokeById(id){
          try {
            //Get general pokémon data
            const response = await fetch(getById+id+"/");
            const pokemon = await response.json();

            //Get species for category in details
            const speciesResponse = await fetch(getSpecies+id+"/");
            const species = await speciesResponse.json();

            //Gets family / evolution chain ---------------------------
            let chainUrl = species.evolution_chain.url

            const chainResponse = await fetch(chainUrl);
            const chainR = await chainResponse.json();

            let fam = this.getFamily(chainR)
            pokemon.family = fam
            //---------------------------

            let plainName = pokemon.species.name//gets the correct name

            //Gets the entry of the pokémon / description ---------------------------
            let filteredFirstLang = species.flavor_text_entries.find(s => s.language.name === "en")//gets just the first entry
            //let filteredLang = species.flavor_text_entries.filter(s => s.language.name === 'en');//gets the multiple generation entries 
            if(filteredFirstLang){
              filteredFirstLang = filteredFirstLang.flavor_text.replace('\f', ' ');
              filteredFirstLang = filteredFirstLang.replace('\n', ' ');
            }else{
              filteredFirstLang = ''
            }
            //console.log(filteredFirstLang)

            //gets the species of the pokemon ---------------------------
            let targetSpecies = species.genera.find(s => s.language.name === "en")
            if(targetSpecies){
              targetSpecies = targetSpecies.genus
              targetSpecies = targetSpecies.replace('Pokémon', '');
            }else{
              targetSpecies = ''
            }
            
            //gets the possible genders of the pokémon ---------------------------
            let isGenderless = await this.canBeNGender(plainName, 3)

            if(!isGenderless){
              let isFemale = await this.canBeNGender(plainName, 1)
              let isMale = await this.canBeNGender(plainName, 2)

              if(isFemale) pokemon.female = isFemale
              if(isMale) pokemon.male = isMale
            }else{
              pokemon.genderless = isGenderless
            }

            pokemon.name = this.toUpper(plainName);

            //Gets the pokémon types ---------------------------
            let types = pokemon.types.map((pokeType) => {
              pokeType.type.name = this.toUpper(pokeType.type.name);

              return {name: pokeType.type.name, url: pokeType.type.url};
            });
            
            pokemon.types = types

            //gets pokemon weaknesses ---------------------------
            if(pokemon.types.length == 1){
              let weaknesses = await this.getWeakness(pokemon.types[0].url)

              let weakness = weaknesses.double.map((pokeType) => {
                pokeType.name = this.toUpper(pokeType.name);

                return {name: pokeType.name};
              });

              pokemon.weaknesses = weakness
            }else{
              let weaknesses1 = await this.getWeakness(pokemon.types[0].url)
              let weaknesses2 = await this.getWeakness(pokemon.types[1].url)

              let sortedWeakness = this.sortWeanesses(weaknesses1, weaknesses2)

              pokemon.weaknesses = sortedWeakness
            }

            pokemon.sprite = pokemon.sprites.other['home'].front_default

            pokemon.abilities = pokemon.abilities[0].ability.name
            pokemon.abilities = this.toUpper(pokemon.abilities);
            
            pokemon.species = targetSpecies

            pokemon.entry = filteredFirstLang

            pokemon.height = pokemon.height / 3.048 //comes originally in decimeters
            pokemon.height = pokemon.height.toFixed(0) //add conversion

            pokemon.weight = pokemon.weight * 0.220462 //comes originally in hectograms
            pokemon.weight = pokemon.weight.toFixed(1)

            pokemon.prevCtrl = this.getPokeControls(pokemon.id, "p")
            pokemon.nextCtrl = this.getPokeControls(pokemon.id, "n")

            this.detailedPoke = pokemon

          } catch (error) {
              console.error(error);
          }
      }, toggleModal(id){
        if(this.displayModal === 'flex'){
          this.displayModal = 'none'

          this.detailedPoke = []
        } else if('none'){
          this.pokeById(id)
          this.displayModal = 'flex'
        }
      }, refreshModal(id){
        this.detailedPoke = []
        this.pokeById(id)

        var resetScroll = document.getElementById('modalContent');
        resetScroll.scrollTop = 0;
      }, formatedDexNumber(n){
        if(n == null){
          return 0
        }

        n = n.toString()

        let max = 4
        let ln = n.length
        //console.log(ln)

        if(ln < 4){
          n = n.padStart(max, '0');
        }

        return n
      }, async canBeNGender(pokeName, gender){
          let canBeN = 0

          //get gender (1=f, 2=m, 3=genderless) pokémon
          const gendersResponse = await fetch(getGenders+gender);
          const genders = await gendersResponse.json();

          let foundGender = genders.pokemon_species_details.find(p => p.pokemon_species.name === pokeName)

          if(foundGender!=null){
            canBeN = 1
          }

          return canBeN
      }, async getWeakness(typeUrl){
          const weaknessResponse = await fetch(typeUrl);
          const weakness = await weaknessResponse.json();
          
          return {
            double: weakness.damage_relations.double_damage_from,
            half: weakness.damage_relations.half_damage_from
          }
      }, sortWeanesses(weaknesses1, weaknesses2){
        let x05 = []
        let x2 = []

        let weakness1 = weaknesses1.double.map((pokeType) => {
          pokeType.name = this.toUpper(pokeType.name);
          x2.push(pokeType.name);
        });

        let weakness2 = weaknesses2.double.map((pokeType) => {
          pokeType.name = this.toUpper(pokeType.name);
          x2.push(pokeType.name);
        });

        let weakness3 = weaknesses1.half.map((pokeType) => {
          pokeType.name = this.toUpper(pokeType.name);
          x05.push(pokeType.name);
        });

        let weakness4 = weaknesses2.half.map((pokeType) => {
          pokeType.name = this.toUpper(pokeType.name);
          x05.push(pokeType.name);
        });

        for(let i = 0; i < x2.length; i++){
          let v1 = x2[i]
          for(let j = i+1; j < x2.length; j++){
            let v2 = x2[j]
            if(v1 == v2) {
              x2[i] = ""
            }
          }
        }

        for(let i = 0; i < x2.length; i++){
          let v1 = x2[i]
          for(let j = 0; j < x05.length; j++){
            let v2 = x05[j]
            if(v1 == v2) {
              x2[i] = ""
            }
          }
        }

        let sortedWeakness = x2.filter(w => w !== '').map((w) => {
          return {name: w};
        });

        return sortedWeakness
      }, getBarValue(value){
        let a = 0
        let max = 255
        a = value/max
        a = a*100
        a = Math.round(a)

        //console.log(a)

        return a
      }, getFamily(f){
        try {
          //console.log(f)

          let family = []
          let name = this.toUpper(f.chain.species.name)
          let filteredPoke = this.original.find(s => s.name === name)
          let pokemon = {id: filteredPoke.id, name: filteredPoke.name, sprite: filteredPoke.sprite, types:filteredPoke.types, level: 1}
          family.push(pokemon)
          
          let topLevel = 0

          let secondLevel = f.chain.evolves_to.length

          for(let i = 0; i<secondLevel; i++){
            topLevel = f.chain.evolves_to[i].evolves_to.length
            name = this.toUpper(f.chain.evolves_to[i].species.name)
            filteredPoke = this.original.find(s => s.name === name)
            pokemon = {id: filteredPoke.id, name: filteredPoke.name, sprite: filteredPoke.sprite, types:filteredPoke.types, level: 2}
            family.push(pokemon)
          }

          if(topLevel>1){
            for(let j = 0; j<topLevel; j++){
              name = this.toUpper(f.chain.evolves_to[0].evolves_to[j].species.name)
              filteredPoke = this.original.find(s => s.name === name)
              pokemon = {id: filteredPoke.id, name: filteredPoke.name, sprite: filteredPoke.sprite, types:filteredPoke.types, level: 3}
              family.push(pokemon)
            }
          }else if(topLevel == 1){
            name = this.toUpper(f.chain.evolves_to[0].evolves_to[0].species.name)
            filteredPoke = this.original.find(s => s.name === name)
            pokemon = {id: filteredPoke.id, name: filteredPoke.name, sprite: filteredPoke.sprite, types:filteredPoke.types, level: 3}
            family.push(pokemon)
          }

          //console.log(family)

          return family
        } catch (error) {
            console.error(error);
        }
      }, getPokeControls(id, type){
        let filteredPoke
        let pokemon

        if(type == "p"){//previous
          if(id == 1){
            filteredPoke = this.original.find(s => s.id === maxPokemon)
          }else{
            id = id-1
            filteredPoke = this.original.find(s => s.id === id)
          }
          
          pokemon = {id: filteredPoke.id, name: filteredPoke.name}
        }

        if(type == "n"){//next
          if(id == maxPokemon){
            filteredPoke = this.original.find(s => s.id === 1)
          }else{
            id = id+1
            filteredPoke = this.original.find(s => s.id === id)
          }
          
          pokemon = {id: filteredPoke.id, name: filteredPoke.name}
        }

        return pokemon
      }
    }, mounted() {
      this.getPokeData()
    }
  };
</script>

<template>
  <!-- Details -->
  <div class="detailsModal" :style="{display: displayModal}">
    <div class="modalContent" id="modalContent">
      <div class="modalHead">
        <span class="exitModal" @click="toggleModal">&times;</span>
      </div>
      <div v-if="detailedPoke.id == null" style="text-align: center;">
        <p style="padding-top: 25% !important; padding-bottom: 25% !important;">Loading pokémon...</p>
      </div>
      <div v-else>
        <div class="modalControls">
          <div class="prevPoke" @click="refreshModal(detailedPoke.prevCtrl.id)">
            <div class="ctrlArrow">&#11164;</div> <label class="numberCtrl">#{{formatedDexNumber(detailedPoke.prevCtrl.id)}}</label> <label class="nameCtrl">{{detailedPoke.prevCtrl.name}}</label>
          </div>
          <div class="nextPoke" @click="refreshModal(detailedPoke.nextCtrl.id)">
            <label class="numberCtrl">#{{formatedDexNumber(detailedPoke.nextCtrl.id)}}</label> <label class="nameCtrl">{{detailedPoke.nextCtrl.name}}</label> <div class="ctrlArrow">&#11166;</div>
          </div>
        </div>
        <div class = "pokeDetails"> 
          <div class="detailsHead">
            <b class="nameDetail">{{ detailedPoke.name }}</b>
            <b class="numberDetail">N.º {{ formatedDexNumber(detailedPoke.id) }}</b> 
          </div>
          <!-- C1 -->
          <div class="fiftyFlex">
            <div class="flexDetails">
              <div class="flexColumn">
                <div v-if="detailedPoke.sprite" style="width: 100% !important;"> 
                  <img :src="detailedPoke.sprite" :alt="`${detailedPoke.name} image`" style="min-width:80%; max-width:80%" class="imgDetail">
                </div>
                <div v-else>
                  <img src="../assets/load.png" alt="Default image" style="min-width:80%; max-width:80%; opacity: 0.05;" class="imgDetail">
                </div>
              </div>
              <div class="flexColumn">
                <table class="statsTable">
                  <tr>
                    <th class="statsTH">Stats</th>
                  </tr>
                  <tr>
                    <td class="statsTD">
                      <div v-for="s in detailedPoke.stats" class="barContainer">
                        <div class="mainBar" :title="s.base_stat">
                          <div class="progress" :style="{height: getBarValue(s.base_stat) + 'px'}">
                            <!-- <label style="font-size: 75%;">{{s.base_stat}}</label> -->
                          </div>
                        </div>
                      </div>
                      <table class="statsTable">
                        <tr>
                          <th v-for="s in detailedPoke.stats" class="statsTH2">
                            {{ 
                              s.stat.name === 'special-attack' ? 'special Attack' :
                              s.stat.name === 'special-defense' ? 'special Defense' :
                              s.stat.name
                            }}
                          </th>
                        </tr>
                      </table> 
                    </td>
                  </tr>
                </table> 
              </div>
            </div>
            <!-- C2 -->
            <div class="flexDetails">
              <div class="flexColumnText">
                <label class="entry">{{detailedPoke.entry}}</label>
              </div>
              <div class="flexColumn">
                <table class="detailTable">
                  <tr>
                    <th class="detailTH">Height</th>
                    <th class="detailTH">Category</th>
                  </tr>
                  <tr>
                    <td class="detailTD">{{detailedPoke.height}}' </td>
                    <td class="detailTD">{{detailedPoke.species}}</td>
                  </tr>
                  <tr>
                    <th class="detailTH">Weight</th>
                    <th class="detailTH">Ability</th>
                  </tr>
                  <tr>
                    <td class="detailTD">{{detailedPoke.weight}} lbs</td>
                    <td class="detailTD">{{detailedPoke.abilities}}</td>
                  </tr>
                  <tr>
                    <th class="detailTH">Gender</th>
                  </tr>
                  <tr>
                    <td class="detailTD">
                      <span v-if="detailedPoke.genderless != null">Unknown</span>
                      <span v-if="detailedPoke.male != null" class="genderSymbol">&#9794;</span>
                      <span v-if="detailedPoke.female != null" class="genderSymbol">&#9792;</span>
                    </td>
                  </tr>
                </table> 
              </div>
              <div class="flexColumn">
                  <h3>Type</h3>
                  <label :style="colorType(typeN.name)" class="typeLabel" v-for="typeN in detailedPoke.types" :key="typeN.id">{{ typeN.name }}</label> 
              </div>
              <div class="flexColumn">
                  <h3>Weaknesses</h3>
                  <label :style="colorType(typeN.name)" class="typeLabel" v-for="typeN in detailedPoke.weaknesses" :key="typeN.id">{{ typeN.name }}</label>
              </div>
            </div>
          </div>
          <div class="evolutions">
            <h2 class="evoTitle">Evolutions</h2>
            <div class="centerEvo">
              <div class = "flexBodyEvo"> 
                <div v-for="pokemon in detailedPoke.family" class = "evoCard">
                  <div class="posInPokeCard">
                    <div v-if="pokemon.sprite"> 
                      <img :src="pokemon.sprite" :alt="`${pokemon.name} image`" style="min-width:80%; max-width:80%" class="bgIMGEvo" @click="refreshModal(pokemon.id)">
                    </div>
                    <div v-else>
                      <img src="../assets/load.png" alt="Default image" style="min-width:80%; max-width:80%; opacity: 0.05;" class="imgDetail">
                    </div>
                    <div>
                      <label class="pokeNameEvo">{{ pokemon.name }} <label class="dexNumberEvo">N.º {{ formatedDexNumber(pokemon.id) }}</label></label>
                      <div>
                          <label :style="colorType(typeN.name)" class="typeLabel" v-for="typeN in pokemon.types" :key="typeN.id">{{ typeN.name }}</label> 
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <!-- List -->
  <div v-if="pokemonList.length === 0" style="width: 100% !important; height: 100% !important; text-align: center;"> 
    <p style="padding-top: 25% !important; padding-bottom: 25% !important;">Loading pokémon...</p>
  </div>
  <div v-else>
    <div class="controlBarSt">
      <div class="firstRow">
        <input placeholder="Search Pokémon by name or number" @input="setSearch" :value="searchInput" class="inputSt">
        <button @click="doSearch(pokemonList)" class="searchButton"><span class="searchSymbol">&#8981;</span></button>
      </div>
      <div class="firstRow">
        <select name="orderOptions" id="orderOptions" @change="orderList(pokemonList, $event)" class="selectOrder">
            <option value="">Sort results by ...</option>
            <option value="l">Lowest Number (first)</option>
            <option value="h">Highest Number (first)</option>
            <option value="a">A-Z</option>
            <option value="z">Z-A</option>
        </select>
      </div>
    </div>
    <div class="secondRow">
      <button @click="randomOrder(pokemonList)" class="randomizeButton"><span class="randomizeSymbol">&#8646;</span> Surprise me!</button>
    </div>
    <div class = "flexBody"> 
      <div v-for="pokemon in pokemonList" :key="pokemon.id" class = "pokeCard">
        <div class="posInPokeCard">
          <div v-if="pokemon.sprite"> 
            <img :src="pokemon.sprite" :alt="`${pokemon.name} image`" style="min-width:80%; max-width:80%" class="bgIMG" @click="toggleModal(pokemon.id)">
          </div>
          <div v-else>
            <img src="../assets/load.png" alt="Default image" style="min-width:80%; max-width:80%; opacity: 0.05;" class="imgDetail">
          </div>
          <div>
            <p class="dexNumber">N.º {{ formatedDexNumber(pokemon.id) }}</p> 
            <b class="pokeName">{{ pokemon.name }}</b>
            <div>
                <label :style="colorType(typeN.name)" class="typeLabel" v-for="typeN in pokemon.types" :key="typeN.id">{{ typeN.name }}</label> 
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>