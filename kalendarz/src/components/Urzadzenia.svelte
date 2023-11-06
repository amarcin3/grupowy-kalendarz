<script>
    import {addDoc, collection, deleteDoc, doc, getDocs, query, where} from "firebase/firestore";
    import Spinner from "./Spinner.svelte";

    export let loggedIn = false;
    export let auth;
    export let db;
    export let storage;

    let urzadzenia = [];
    let loading = true;

    $: if (loggedIn) {
        getUrzadzenia();
    }

    async function getUrzadzenia() {
        urzadzenia = [];
        loading = true;
        await getDocs(query(collection(db, "Urzadzenia"), where("Uid", "==", auth.currentUser.uid))).then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                urzadzenia.push({Id: doc.id, ...doc.data()});
            });
            urzadzenia = urzadzenia;

        }).catch((error) => {
            console.log(error);
        });
        loading = false;
    }

    async function addUrzadzenie(data) {
        loading = true;
        await addDoc(collection(db, "Urzadzenia"), {
            Nazwa: data[0][1],
            Uid: auth.currentUser.uid,
            Opis: data[1][1],
        }).then(() => {
            getUrzadzenia();
        }).catch((error) => {
            console.error("Error adding document: ", error);
            loading = false;
        });
    }

    async function deleteUrzadzenie(id) {
        loading = true;
        await deleteDoc(doc(db, "Urzadzenia", id)).then(() => {
            getUrzadzenia();
        }).catch((error) => {
            console.error("Error removing document: ", error);
            loading = false;
        });
    }

    const submitForm = (event) => {

        const formData = new FormData(event.target)
        const data = [...formData.entries()];
        addUrzadzenie(data);
    }

</script>

<main class="container">

    <form on:submit|preventDefault={submitForm} style="margin-bottom: var(--spacing)">
        <input name="nazwa" type="text" placeholder="Nazwa" required/>
        <input name="opis" type="text" placeholder="Opis" required/>
        <input type="submit" value="Dodaj" style="margin-bottom: 0"/>
    </form>

    {#if loading}
        <br><Spinner/>
    {:else}
        {#if urzadzenia.length === 0}
            <h1>Brak urządzeń</h1>
        {:else}
            <h1>Urządzenia:</h1>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Nazwa</th>
                            <th>Opis</th>
                            <th>Token</th>
                            <th>Usuń</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each urzadzenia as urzadzenie}
                            <tr>
                                <td>{urzadzenie.Nazwa}</td>
                                <td>{urzadzenie.Opis}</td>
                                <td>{urzadzenie.Id}</td>
                                <td><button class="usun" on:click={() => deleteUrzadzenie(urzadzenie.Id)}>Usuń</button></td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {/if}
    {/if}

</main>

<style>
    th, td {
        text-align: center;
        padding: 8px;
    }

    .usun {
        background-color: #f44336;
        border: none;
        color: white;
        padding: 8px 16px;
        text-decoration: none;
        margin: 4px 2px;
        cursor: pointer;
    }
</style>