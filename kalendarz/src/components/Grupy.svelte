<script>
    import {collection, doc, getDoc, getDocs, query, setDoc} from "firebase/firestore";
    import Spinner from "./Spinner.svelte";

    export let loggedIn = false;
    export let auth;
    export let db;
    export let storage;

    let dataLoading = true;
    let grupy = [];

    let CreateGroupModal;
    let showCreateGroupModal = false;
    let JoinGroupModal;
    let showJoinGroupModal = false;



    $: if(loggedIn){
        getGrupy();
    }

    async function getGrupy(){
        const q = query(collection(db, "Users", auth.currentUser.uid, "Grupy"));

        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            grupy.push({Id: doc.id, data: doc.data()});
        });
        grupy = grupy.sort((a, b) => a.data.Nazwa.localeCompare(b.data.Nazwa));
        dataLoading = false;
    }
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

    <article>
         <hgroup>
             <h2>Twoje grupy</h2>
             <p>Wszystkie grupy</p>
         </hgroup>
        <div>
            {#if dataLoading}
                <Spinner/>
            {:else if grupy.length === 0}
                <p>Nie jesteś w żadnej grupie</p>
            {:else}
                {#each grupy as grupa}
                    <article>
                        <p>{grupa.data.Nazwa}</p>
                        <p>{grupa.Id}</p>
                        <p>{grupa.data.IdWGrupie}</p>
                    </article>
                {/each}
            {/if}
        </div>
     </article>
    {#if showCreateGroupModal}
        <CreateGroupModal bind:showCreateGroupModal/>
    {:else if showJoinGroupModal}
        <JoinGroupModal bind:showJoinGroupModal/>
    {/if}
</main>
