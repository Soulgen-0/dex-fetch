import { PokeDataRegistry } from "/modules/poke-data-registry.js";

const pokeDataRegistry = new PokeDataRegistry();
const imageFigures = document.getElementsByClassName("pokemon-image-figure");
const pokemonNameElements = document.getElementsByClassName("pokemon-name");
const flavorTextElements = document.getElementsByClassName("flavor-text");
const commandBar = document.getElementById("command-bar");

async function fetchData(nameOrId) {
    return await pokeDataRegistry.get(nameOrId)
}

function display(data) {
    for (const imageFigure of imageFigures) {
        const showShiny = imageFigure.dataset.shiny === "true"
        const imageElement = imageFigure.querySelector(".pokemon-image")
        imageElement.src = (showShiny) ? data.getImage(true) : data.getImage(false)
        
        const imageCaption = imageFigure.querySelector(".pokemon-image__caption")
        imageCaption.textContent = `${(showShiny) ? "Shiny" : "Default"} ${data.displayName}`
    }

    for (const cryAudioPlayer of document.getElementsByClassName("pokemon-cry-player")) {
        cryAudioPlayer.src = data.cry
    }

    for (const nameElement of pokemonNameElements) {
        nameElement.textContent = data.displayName;
    }

    for (const flavorTextElement of flavorTextElements) {
        flavorTextElement.textContent = data.flavorText;
    }
}

const formElement = document.getElementsByClassName("command-form")[0];
formElement.addEventListener("submit", async (event) => {
    event.preventDefault();
    
    const content = commandBar.value;
    commandBar.value = "";

    const data = await fetchData(content);
    if (!data) {
        return
    }
    display(data)
});

display(PokeDataRegistry.default)