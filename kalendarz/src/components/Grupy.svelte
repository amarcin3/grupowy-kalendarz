<script>
    import {collection, getDocs, query} from "firebase/firestore";
    import Spinner from "./Spinner.svelte";

    export let loggedIn = false;
    export let auth;
    export let db;
    export let storage;

    let dataLoading = true;

    let podzialNaTwojeGrupy = true;
    let wszystkieGrupy = [];
    let twojeGrupy = [];
    let inneGrupy = [];

    let CreateGroupModal;
    let showCreateGroupModal = false;
    let JoinGroupModal;
    let showJoinGroupModal = false;

    $: if(loggedIn){
        getGrupy();
    }

    window.addEventListener('created', () => {
        dataLoading = true;
        getGrupy();
    });

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

    {#if podzialNaTwojeGrupy}
        <article>
            <em data-tooltip="Zmień podział na twoje grupy" data-placement="right" style="border-bottom: none; cursor: pointer" on:click={() => {podzialNaTwojeGrupy = false}}><svg xmlns="http://www.w3.org/2000/svg" height="32" viewBox="0 -960 960 960" width="32"><path d="M360-240h440v-107H360v107ZM160-613h120v-107H160v107Zm0 187h120v-107H160v107Zm0 186h120v-107H160v107Zm200-186h440v-107H360v107Zm0-187h440v-107H360v107ZM160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Z"/></svg></em>
             <hgroup>
                 <h2>Twoje grupy</h2>
                 <p></p>
             </hgroup>
            <div>
                {#if dataLoading}
                    <Spinner/>
                {:else if twojeGrupy.length === 0}
                    <p>Nie masz własnych grup</p>
                {:else}
                    {#each twojeGrupy as grupa}
                        <article>
                            <h2 style="margin-bottom: 0">{grupa.data.Nazwa}</h2>
                        </article>
                    {/each}
                {/if}
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
                {:else}
                    {#each inneGrupy as grupa}
                        <article>
                            <h2 style="margin-bottom: 0">{grupa.data.Nazwa}</h2>
                        </article>
                    {/each}
                {/if}
            </div>

            <!--TODO: Zrobić grupy oczekujące na potwierdzenie, nie wyświetlać jeżeli nie ma takich grup, pamiętać żeby zrobić to w obu widokach (z podziałem na twoje grupy i bez)-->
            <hgroup>
                <h2>Grupy oczekujące na potwierdzenie</h2>
                <p></p>
            </hgroup>
            <div>
                {#if dataLoading}
                    <Spinner/>
                {:else if inneGrupy.length === 0}
                    <p>Nie jesteś w żadnych innych grupach</p>
                {:else}
                    {#each inneGrupy as grupa}
                        <article>
                            <h2 style="margin-bottom: 0">{grupa.data.Nazwa}</h2>
                        </article>
                    {/each}
                {/if}
            </div>
         </article>
    {:else}
        <article>
            <em data-tooltip="Zmień podział na twoje grupy" data-placement="right" style="border-bottom: none; cursor: pointer" on:click={() => {podzialNaTwojeGrupy = true}}><svg xmlns="http://www.w3.org/2000/svg" height="32" viewBox="0 -960 960 960" width="32"><path d="M360-240h440v-107H360v107ZM160-613h120v-107H160v107Zm0 187h120v-107H160v107Zm0 186h120v-107H160v107Zm200-186h440v-107H360v107Zm0-187h440v-107H360v107ZM160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Z"/></svg></em>
            <hgroup>
                <h2>Wszystkie grupy</h2>
                <p></p>
            </hgroup>
            <div>
                {#if dataLoading}
                    <Spinner/>
                {:else if wszystkieGrupy.length === 0}
                    <p>Nie jesteś w żadnej grupie</p>
                {:else}
                    {#each wszystkieGrupy as grupa}
                        <article>
                            <h2 style="margin-bottom: 0">{grupa.data.Nazwa}</h2>
                        </article>
                    {/each}
                {/if}
            </div>
        </article>
    {/if}
    {#if showCreateGroupModal}
        <CreateGroupModal bind:showCreateGroupModal/>
    {:else if showJoinGroupModal}
        <JoinGroupModal bind:showJoinGroupModal/>
    {/if}
</main>
