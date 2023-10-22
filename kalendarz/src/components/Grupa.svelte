<script>
    import {collection, getDocs, query, where, limit, addDoc} from "firebase/firestore";
    import Spinner from "./Spinner.svelte";

    export let loggedIn = false;
    export let auth;
    export let db;
    export let storage;

    let dataLoading = true;
    let pendingLoading = true;
    let daneOczekujacych = [];
    let iloscOczekujacych = 0;

    let grupa;
    let groupName = "";


    $: if(loggedIn){
        let url = window.location.href;
        groupName = url.substring(url.lastIndexOf('/') + 1);
        groupName = decodeURI(groupName);
        getGrupy();
    }

    async function getGrupy(){
        const q = query(collection(db, "Users", auth.currentUser.uid, "Grupy"), where("Nazwa", "==", groupName), limit(1));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            grupa = {Id: doc.id, data: doc.data()};
            getOczekujacePotwierdzenia(grupa.Id)
        });
        dataLoading = false;
    }

    async function getOczekujacePotwierdzenia(IdGrupy){
        pendingLoading = true;
        await getDocs(query(collection(db, "OczekujacePotwierdzenia"), where("IdGrupy", "==", IdGrupy))).then((querySnapshot) => {
            daneOczekujacych = [];
            iloscOczekujacych = 0;
            querySnapshot.forEach((doc) => {
                if (doc.data().StanOczekiwania !== "zatwierdzona"){
                    daneOczekujacych.push(doc);
                    iloscOczekujacych++;
                }
            });
        });
        pendingLoading = false;
    }

    let PendingModal;
    let showPendingModal = false;

    let buttonEl;
</script>
<main>
    {#if grupa}
        {grupa.data.Nazwa} {grupa.Id} {grupa.data.IdWGrupie}
    {/if}

    <div>
        <button class="refresh-button"
                on:click={async () => {
                    buttonEl.classList.add("spin");
                    console.log("refreshing")
                    await getOczekujacePotwierdzenia(grupa.Id)
                }}>
            <svg bind:this={buttonEl} id="reload" on:animationend={() => {
                if (!pendingLoading)
                    {buttonEl.classList.remove("spin");
                } else {
                    buttonEl.classList.remove("spin");
                    setTimeout(() => {buttonEl.classList.add("spin");
                    },10)
                }
            }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Pro 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 FontIcons, Inc. --><path d="M142.9 142.9c62.2-62.2 162.7-62.5 225.3-1L327 183c-6.9 6.9-8.9 17.2-5.2 26.2s12.5 14.8 22.2 14.8H463.5c0 0 0 0 0 0H472c13.3 0 24-10.7 24-24V72c0-9.7-5.8-18.5-14.8-22.2s-19.3-1.7-26.2 5.2L413.4 96.6c-87.6-86.5-228.7-86.2-315.8 1C73.2 122 55.6 150.7 44.8 181.4c-5.9 16.7 2.9 34.9 19.5 40.8s34.9-2.9 40.8-19.5c7.7-21.8 20.2-42.3 37.8-59.8zM16 312v7.6 .7V440c0 9.7 5.8 18.5 14.8 22.2s19.3 1.7 26.2-5.2l41.6-41.6c87.6 86.5 228.7 86.2 315.8-1c24.4-24.4 42.1-53.1 52.9-83.7c5.9-16.7-2.9-34.9-19.5-40.8s-34.9 2.9-40.8 19.5c-7.7 21.8-20.2 42.3-37.8 59.8c-62.2 62.2-162.7 62.5-225.3 1L185 329c6.9-6.9 8.9-17.2 5.2-26.2s-12.5-14.8-22.2-14.8H48.4h-.7H40c-13.3 0-24 10.7-24 24z"/></svg>
        </button>
        {#if iloscOczekujacych > 0}
            <button on:click={async () => {PendingModal = (await import("./OczekujacePotwierdzeniaModal.svelte")).default; showPendingModal = true}} style="margin-bottom: calc(var(--spacing) * 0.5)">
                Oczekujące prośby o dołączenie: {iloscOczekujacych}
            </button>
            {#if showPendingModal}
                <PendingModal bind:showPendingModal bind:daneOczekujacych/>
            {/if}
        {:else}
            <p style="margin-bottom: calc(var(--spacing) * 0.5)">
                Brak oczekujących próśb o dołączenie
            </p>
        {/if}
    </div>
</main>
<style>

    .refresh-button {
        height: fit-content;
        background-color: var(--card-background-color);
    }
    :global(.spin) {
        animation: spin 1s ease-out 1;
    }

    #reload {
        height: var(--spacing);
        color: var(--contrast);
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(540deg); }
    }
</style>