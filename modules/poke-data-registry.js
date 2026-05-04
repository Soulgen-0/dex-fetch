const BASE_URL = "https://pokeapi.co/api/v2";
const DEFAULT = Object.freeze({
        id: 0,
        name: "MISSING",
        image: "/assets/pokemon-question-mark.png",
        flavor_text: "MISSING FLAVOR TEXT."
});

class PokeData {
    
    constructor(generalData, speciesData) {
        this._generalData = generalData ?? {};
        this._speciesData = speciesData ?? {};
    }

    get id() {
        const { id } = this._generalData;
        return id ?? DEFAULT.id;
    }

    get name() {
        const { name } = this._speciesData;
        return name ?? DEFAULT.name;
    }

    get displayName() {
        const name = this.name;
        return name[0].toUpperCase() + name.slice(1);
    }

    get flavorText() {
        const englishFiltered = this._speciesData.flavor_text_entries?.filter(entry => entry.language?.name  === "en") ?? {};
        return englishFiltered[englishFiltered.length - 1]?.flavor_text ?? DEFAULT.flavorText;
    }

    get cry() {
        return this._generalData.cries?.latest ?? "https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/1.ogg"
    }

    getImage(shiny) {
        return (
            (shiny) 
            ? this._generalData.sprites?.other?.["official-artwork"]?.front_shiny
            : this._generalData.sprites?.other?.["official-artwork"]?.front_default
        ) ?? DEFAULT.image
    }

}


class PokeApi {
    constructor(baseUrl) {
        this._failedKeywords = new Set();
        this.base = baseUrl ?? BASE_URL;
    }
    _speciesUrl(nameOrId) {
        return `${this.base}/pokemon-species/${nameOrId}/`;
    }
    _pokemonUrl(nameOrId) {
        return `${this.base}/pokemon/${nameOrId}/`;
    }
    _logFailedKeyword(keyword) {
        this._failedKeywords.add(keyword)
    }

    async request(nameOrId) {
        if (this._failedKeywords.has(nameOrId)) {
            return new PokeData();
        }

        try {
            const speciesResponse = await fetch(this._speciesUrl(nameOrId));
            if (speciesResponse.status === 404) {
                this._logFailedKeyword(nameOrId)
                throw new Error(`${nameOrId} does not belong to a valid Pokemon.`);
            }
            if (!speciesResponse.ok) {
                throw new Error(`Species response status: ${speciesResponse.status}`);
            }
            const speciesJson = await speciesResponse.json()

            // We are passing the id from the species result as the 'pokemon' endpoint
            // does not respond well to certain pokemon by generic name.
            //  Ex. Querying for "Giratina" at the "pokemon" endpoint expects you to
            //  suffix the forme name (such as Altered form).
            const generalResponse = await fetch(this._pokemonUrl(speciesJson.id));
            if (!generalResponse.ok) {
                throw new Error(`General response status: ${generalResponse.status}`);
            }

            return new PokeData(await generalResponse.json(), speciesJson);
        } catch (error) {
            console.log(`Error while fetching pokemon data: ${error.message}`);
            return new PokeData();
        }
    }
}

class PokeDataRegistry {
    constructor() {
        this._nameToIdMap = new Map();
        this._store = new Map();
        this._pokeApi = new PokeApi();
    }

    async get(nameOrId) {
        const correctedId = ((typeof nameOrId === "string") ? nameOrId : String(nameOrId)).toLowerCase();
        // Check if a string name was passed. If it was, convert to a cached
        // PokeDex numerical id
        const isNameMapped = this._nameToIdMap.has(correctedId);
        const id = (isNameMapped) ? this._nameToIdMap.get(correctedId) : correctedId;
        const inCache = this._store.has(id);
        if (inCache) {
            console.log(`${id} is cached already. Returning cached result.`)
            return this._store.get(id);
        } else {
            const data = await this._pokeApi.request(id);
            this._nameToIdMap.set(data.name, data.id);
            this._store.set(data.id, data)
            return data;
        }
    }
}

export { PokeDataRegistry };