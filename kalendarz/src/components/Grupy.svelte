<script>
    import {collection, deleteDoc, doc, getDocs, query, setDoc, where} from "firebase/firestore";
    import Spinner from "./Spinner.svelte";
    import {fade} from "svelte/transition";
    import {quintOut} from "svelte/easing";

    export let loggedIn = false;
    export let auth;
    export let db;
    export let storage;

    let dataLoading = true;
    let pendingDataLoading = true;

    let podzialNaTwojeGrupy = true;
    let wszystkieGrupy = [];
    let twojeGrupy = [];
    let inneGrupy = [];
    let oczekujaceGrupy = [];

    let CreateGroupModal;
    let showCreateGroupModal = false;
    let JoinGroupModal;
    let showJoinGroupModal = false;

    if (localStorage.getItem("podzialNaTwojeGrupy") === null){
        localStorage.setItem("podzialNaTwojeGrupy", "true");
    } else {
        podzialNaTwojeGrupy = localStorage.getItem("podzialNaTwojeGrupy") === "true";
    }

    $: if(loggedIn){
        getGrupy();
        getOczekujacePotwierdzenia();
    }

    window.addEventListener('created', () => {
        dataLoading = true;
        getGrupy();
    });

    window.addEventListener('sent', () => {
        getOczekujacePotwierdzenia();
    });

    $: if (podzialNaTwojeGrupy)
        localStorage.setItem("podzialNaTwojeGrupy", "true");
    else
        localStorage.setItem("podzialNaTwojeGrupy", "false");

    async function getGrupy(){
        const q = query(collection(db, "Users", auth.currentUser.uid, "Grupy"));

        const querySnapshot = await getDocs(q);
        wszystkieGrupy = [];
        twojeGrupy = [];
        inneGrupy = [];
        querySnapshot.forEach((doc) => {
            if (doc.data().IdWGrupie === 0){
                twojeGrupy.push({Id: doc.id, data: doc.data()});
            } else {
                inneGrupy.push({Id: doc.id, data: doc.data()});
            }
            wszystkieGrupy.push({Id: doc.id, data: doc.data()});
        });
        wszystkieGrupy = wszystkieGrupy.sort((a, b) => a.data.Nazwa.localeCompare(b.data.Nazwa));
        twojeGrupy = twojeGrupy.sort((a, b) => a.data.Nazwa.localeCompare(b.data.Nazwa));
        inneGrupy = inneGrupy.sort((a, b) => a.data.Nazwa.localeCompare(b.data.Nazwa));
        dataLoading = false;
    }

    async function getOczekujacePotwierdzenia(){
        pendingDataLoading = true;
        oczekujaceGrupy = [];
        let IdOczekujacychGrup = [];
        let IdZatwierdzonychGrup = [];
        let IdDokumentowZatwierdzonychGrup = [];
        await getDocs(query(collection(db, "OczekujacePotwierdzenia"), where("IdUzytkownika", "==", auth.currentUser.uid))).then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                if (doc.data().StanOczekiwania !== "zatwierdzona"){
                    IdOczekujacychGrup.push(doc.data().IdGrupy);
                } else {
                    IdOczekujacychGrup.push(doc.data().IdGrupy);
                    IdZatwierdzonychGrup.push(doc.data().IdGrupy);
                    IdDokumentowZatwierdzonychGrup.push(doc.id);
                }
            });
        }).then(async () => {
            if (IdOczekujacychGrup.length === 0){
                pendingDataLoading = false;
                return;
            }
            await getDocs(query(collection(db, "Grupy"), where("IdGrupy", "in", IdOczekujacychGrup))).then((querySnapshot) => {
                querySnapshot.forEach((docu) => {
                    if (IdZatwierdzonychGrup.includes(docu.data().IdGrupy)){
                        let miejsce;
                        for (let i = 0; i < IdZatwierdzonychGrup.length; i++){
                            if (IdZatwierdzonychGrup[i] === docu.id){
                                miejsce = i;
                                break;
                            }
                        }
                        setDoc(doc(db, "Users/" + auth.currentUser.uid + "/Grupy", docu.data().IdGrupy), {
                            IdWGrupie: 1,
                            Nazwa: docu.data().Nazwa
                        }).then(() => {
                            deleteDoc(doc(db, "OczekujacePotwierdzenia", IdDokumentowZatwierdzonychGrup[miejsce]));
                        });
                        inneGrupy.push({Id: docu.id, data: docu.data()});
                    } else {
                        oczekujaceGrupy.push({Id: docu.id, data: docu.data()});
                    }
                });
            });
        });
        pendingDataLoading = false;
    }

    let buttonEl;
</script>
<main class="container-fluid" style="padding-top: 0">
    <div class="grid">
        <article style="margin-bottom: 0">
            <h2 style="margin-bottom: 0">Stwórz grupę</h2>
            <button on:click={async () => {CreateGroupModal = (await import ("./StworzGrupeModal.svelte")).default; showCreateGroupModal = true}}>Stwórz nową grupę</button>
        </article>

        <article style="margin-bottom: 0">
            <h2 style="margin-bottom: 0">Dołącz do grupy</h2>
            <button on:click={async () => {JoinGroupModal = (await import ("./DolaczDoGrupyModal.svelte")).default; showJoinGroupModal = true}}>Dołącz do istniejącej grupy</button>
        </article>
    </div>

    {#if podzialNaTwojeGrupy}
        <article>
            <div class="button-container">
                <button class="refresh-button" data-tooltip="Zmień podział na twoje grupy" data-placement="left" on:click={() => {podzialNaTwojeGrupy = false}}><svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 -880 880 880" width="18" class="reload"><path d="M360-240h440v-107H360v107ZM160-613h120v-107H160v107Zm0 187h120v-107H160v107Zm0 186h120v-107H160v107Zm200-186h440v-107H360v107Zm0-187h440v-107H360v107ZM160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Z"/></svg></button>
                <button class="refresh-button" data-tooltip="Odśwież" data-placement="left"
                        on:click={async () => {
                    buttonEl.classList.add("spin");
                    await getGrupy();
                    await getOczekujacePotwierdzenia();
                }}>
                    <svg bind:this={buttonEl} class="reload" on:animationend={() => {
                if (!pendingDataLoading)
                    {buttonEl.classList.remove("spin");
                } else {
                    buttonEl.classList.remove("spin");
                    setTimeout(() => {buttonEl.classList.add("spin");
                    },10)
                }
            }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Pro 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 FontIcons, Inc. --><path d="M142.9 142.9c62.2-62.2 162.7-62.5 225.3-1L327 183c-6.9 6.9-8.9 17.2-5.2 26.2s12.5 14.8 22.2 14.8H463.5c0 0 0 0 0 0H472c13.3 0 24-10.7 24-24V72c0-9.7-5.8-18.5-14.8-22.2s-19.3-1.7-26.2 5.2L413.4 96.6c-87.6-86.5-228.7-86.2-315.8 1C73.2 122 55.6 150.7 44.8 181.4c-5.9 16.7 2.9 34.9 19.5 40.8s34.9-2.9 40.8-19.5c7.7-21.8 20.2-42.3 37.8-59.8zM16 312v7.6 .7V440c0 9.7 5.8 18.5 14.8 22.2s19.3 1.7 26.2-5.2l41.6-41.6c87.6 86.5 228.7 86.2 315.8-1c24.4-24.4 42.1-53.1 52.9-83.7c5.9-16.7-2.9-34.9-19.5-40.8s-34.9 2.9-40.8 19.5c-7.7 21.8-20.2 42.3-37.8 59.8c-62.2 62.2-162.7 62.5-225.3 1L185 329c6.9-6.9 8.9-17.2 5.2-26.2s-12.5-14.8-22.2-14.8H48.4h-.7H40c-13.3 0-24 10.7-24 24z"/></svg>
                </button>
            </div>
            <hgroup>
                 <h2>Twoje grupy</h2>
                 <p></p>
             </hgroup>
            <div>
                {#if dataLoading}
                    <Spinner/>
                {:else if twojeGrupy.length === 0}
                    <p>Nie masz własnych grup</p>
                {/if}
                {#each twojeGrupy as grupa, x}
                    <a href="./grupy/{grupa.data.Nazwa}">
                        <article in:fade|local="{{duration: 1000, easing: quintOut, delay: x*200 +300}}">
                            <h2 style="margin-bottom: 0">{grupa.data.Nazwa}</h2>
                        </article>
                    </a>
                {/each}
            </div>

            <hgroup>
                <h2>Grupy innych osób</h2>
                <p></p>
            </hgroup>
            <div>
                {#if dataLoading}
                    <Spinner/>
                {:else if inneGrupy.length === 0}
                    <p>Nie jesteś w żadnych innych grupach</p>
                {/if}
                {#each inneGrupy as grupa, x}
                    <a href="./grupy/{grupa.data.Nazwa}" in:fade|local="{{duration: 1000, easing: quintOut, delay: x*200 +300}}">
                        <article>
                            <h2 style="margin-bottom: 0">{grupa.data.Nazwa}</h2>
                        </article>
                    </a>
                {/each}
            </div>

            {#if oczekujaceGrupy.length > 0 || dataLoading}
                <hgroup>
                    <h2>Grupy oczekujące na potwierdzenie</h2>
                    <p></p>
                </hgroup>
                <div>
                    {#if pendingDataLoading}
                        <Spinner/>
                    {/if}
                    {#each oczekujaceGrupy as grupa, x}
                        <article in:fade|local="{{duration: 1000, easing: quintOut, delay: x*200 +300}}">
                            <h2 style="margin-bottom: 0">{grupa.data.Nazwa}</h2>
                        </article>
                    {/each}
                </div>
            {/if}
         </article>
    {:else}
        <article>
            <div class="button-container">
                <button class="refresh-button" data-tooltip="Zmień podział na twoje grupy" data-placement="left" on:click={() => {podzialNaTwojeGrupy = true}}><svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 -880 880 880" width="18" class="reload"><path d="M360-240h440v-107H360v107ZM160-613h120v-107H160v107Zm0 187h120v-107H160v107Zm0 186h120v-107H160v107Zm200-186h440v-107H360v107Zm0-187h440v-107H360v107ZM160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Z"/></svg></button>
                <button class="refresh-button" data-tooltip="Odśwież" data-placement="left"
                        on:click={async () => {
                    buttonEl.classList.add("spin");
                    await getGrupy();
                    await getOczekujacePotwierdzenia();
                }}>
                    <svg bind:this={buttonEl} class="reload" on:animationend={() => {
                if (!pendingDataLoading)
                    {buttonEl.classList.remove("spin");
                } else {
                    buttonEl.classList.remove("spin");
                    setTimeout(() => {buttonEl.classList.add("spin");
                    },10)
                }
            }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Pro 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 FontIcons, Inc. --><path d="M142.9 142.9c62.2-62.2 162.7-62.5 225.3-1L327 183c-6.9 6.9-8.9 17.2-5.2 26.2s12.5 14.8 22.2 14.8H463.5c0 0 0 0 0 0H472c13.3 0 24-10.7 24-24V72c0-9.7-5.8-18.5-14.8-22.2s-19.3-1.7-26.2 5.2L413.4 96.6c-87.6-86.5-228.7-86.2-315.8 1C73.2 122 55.6 150.7 44.8 181.4c-5.9 16.7 2.9 34.9 19.5 40.8s34.9-2.9 40.8-19.5c7.7-21.8 20.2-42.3 37.8-59.8zM16 312v7.6 .7V440c0 9.7 5.8 18.5 14.8 22.2s19.3 1.7 26.2-5.2l41.6-41.6c87.6 86.5 228.7 86.2 315.8-1c24.4-24.4 42.1-53.1 52.9-83.7c5.9-16.7-2.9-34.9-19.5-40.8s-34.9 2.9-40.8 19.5c-7.7 21.8-20.2 42.3-37.8 59.8c-62.2 62.2-162.7 62.5-225.3 1L185 329c6.9-6.9 8.9-17.2 5.2-26.2s-12.5-14.8-22.2-14.8H48.4h-.7H40c-13.3 0-24 10.7-24 24z"/></svg>
                </button>
            </div>
            <hgroup>
                <h2>Wszystkie grupy</h2>
                <p></p>
            </hgroup>
            <div>
                {#if dataLoading}
                    <Spinner/>
                {:else if wszystkieGrupy.length === 0}
                    <p>Nie jesteś w żadnej grupie</p>
                {/if}
                {#each wszystkieGrupy as grupa, x}
                    <a href="./grupy/{grupa.data.Nazwa}" in:fade|local="{{duration: 1000, easing: quintOut, delay: x*200 +300}}">
                        <article>
                            <h2 style="margin-bottom: 0">{grupa.data.Nazwa}</h2>
                        </article>
                    </a>
                {/each}
            </div>
            {#if oczekujaceGrupy.length > 0 || dataLoading}
                <hgroup>
                    <h2>Grupy oczekujące na potwierdzenie</h2>
                    <p></p>
                </hgroup>
                <div>
                    {#if pendingDataLoading}
                        <Spinner/>
                    {:else}
                        {#each oczekujaceGrupy as grupa, x}
                            <article in:fade|local="{{duration: 1000, easing: quintOut, delay: x*200 +300}}">
                                <h2 style="margin-bottom: 0">{grupa.data.Nazwa}</h2>
                            </article>
                        {/each}
                    {/if}
                </div>
            {/if}
        </article>
    {/if}
    {#if showCreateGroupModal}
        <CreateGroupModal bind:showCreateGroupModal/>
    {:else if showJoinGroupModal}
        <JoinGroupModal bind:showJoinGroupModal/>
    {/if}
</main>

<!--suppress CssUnusedSymbol -->
<style>
    .refresh-button {
        height: fit-content;
        background-color: var(--card-background-color);
        width: fit-content;
    }

    :global(.spin) {
        animation: spin 1s ease-out 1;
    }

    .reload {
        height: var(--spacing);
        color: var(--contrast);
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(540deg); }
    }

    .button-container {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: calc(var(--spacing) / 2);
    }
</style>