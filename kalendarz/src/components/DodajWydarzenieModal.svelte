<script>
    import {fade, fly} from "svelte/transition";
    import {quintOut} from "svelte/easing";
    import Spinner from "./Spinner.svelte";
    import {onMount} from "svelte";
    import {collection, doc, getDoc, getFirestore, setDoc, addDoc} from "firebase/firestore";
    import {getApp} from "firebase/app";
    import {getAuth} from "firebase/auth";

    export let showAddEventModal;
    export let grupa;

    let app = getApp();
    const auth = getAuth(app);
    const db = getFirestore(app);

    let displayError = "";
    let loading = false;
    function closeModal(saved = false) {
        if (saved === true) {
            dispatchEvent(new CustomEvent("sent"));
        }
        loading = false;
        showAddEventModal = false;
    }

    let user = {
        Imie: "",
        Nazwisko: "",
    }
    /*async function getData(){
        const docRef = doc(db, "Users", auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            user.Imie = data.Imie;
            user.Nazwisko = data.Nazwisko;
        }
    }

    async function joinGroup(data) {
        if (user.Nazwisko === "" || user.Imie === "") {
            await getData().then(() => {
                joinGroup(data);
            });
        }
        else {
            await addDoc(collection(db, "OczekujacePotwierdzenia"), {
                IdUzytkownika: auth.currentUser.uid,
                IdGrupy: data[0][1],
                Haslo: data[1][1],
                NazwaUzytkownika: user.Imie + " " + user.Nazwisko,
                StanOczekiwania: "oczekuje",
            }).then(() => {
                loading = false;
                done = true;
            }).catch((error) => {
                console.log(error.code);
                if (error.code === "permission-denied"){
                    displayError = "Niepoprawne dane. Upewnij się, że wprowadziłeś poprawne dane.";
                } else {
                    displayError = "Wystąpił błąd. Spróbuj ponownie.";
                }

                loading = false;
            });
        }
    }*/

    const submitForm = (event) => {
        loading = true;
        const formData = new FormData(event.target)
        const data = [...formData.entries()];
        //joinGroup(data);
    }

    $: if (loading) {
        if (document.getElementsByClassName('modal-overlay').length !== 0) {
            let overlays = document.getElementsByClassName('modal-overlay');
            overlays[0].style.backgroundColor = "rgba(0, 0, 0, 0.8)";
        }
    } else {
        if (document.getElementsByClassName('modal-overlay').length !== 0) {
            let overlays = document.getElementsByClassName('modal-overlay');
            overlays[0].style.backgroundColor = "rgba(0, 0, 0, 0.4)";
        }
    }

    $: if (showAddEventModal === true) {
        setTimeout(() => {
            if (document.getElementById('form') !== null) {
                let form = document.getElementById('form');
                for (let i = 0; i < form.length-1; i++) {
                    form[i].value = "";
                }
            }
        }, 10);

    }

</script>

<div class="modal-overlay" transition:fade|local={{duration: 200, easing: quintOut}}>
    <div class="modal-content" transition:fly|local="{{ y: -50, duration: 400, easing: quintOut}}">
        <div>
            {#if loading}
                <div class="modal-overlay middle" style="background-color: rgba(0, 0, 0, 0.7);">
                    <Spinner/>
                </div>
            {/if}
        </div>
        <hgroup>
            <h1>Utwórz wydarzenie</h1>
            <h2>Wpisz informacje o wydarzeniu aby je dodać.</h2>
        </hgroup>
        <p style="color: red;"> {displayError}</p>
        <form id="form" on:submit|preventDefault={submitForm} style="margin-bottom: var(--spacing)">
            <input id="Id" name="Id" type="text" placeholder="Nazwa" required/>
            <input id="Opis" name="Opis" type="text" placeholder="Opis"/>
            <div class="grid">
                <div class="flex">
                    <label for="DataS" >Data początkowa</label>
                    <input type="datetime-local" id="DataS" name="DataS" required/>
                </div>
                <div class="flex">
                    <label for="DataK">Data końcowa</label>
                    <input type="datetime-local" id="DataK" name="DataK"/>
                </div>
            </div>
            <input type="text" placeholder="Miejsce"/>
            <details role="list">
                <summary aria-haspopup="listbox">Osoby</summary>
                <ul role="listbox">
                    <li>
                        <label>
                            <input type="checkbox">
                            Osoba1
                        </label>
                    </li>
                </ul>
            </details>
            <input type="submit" value="Utwórz wydarzenie" style="margin-bottom: 0"/>
        </form>

        <button on:click={closeModal} class="primary outline">Anuluj</button>
    </div>
</div>

<style>

    .modal-overlay {
        position: fixed;
        display: flex;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        align-items: center;
        justify-content: center;
        z-index: 999;
        background-color: rgba(0, 0, 0, 0.5);
        transition: background-color 0.3s;
    }
    .modal-content {
        background-color: var(--background-color);
        padding: 1em;
        width: 90vw;
        border-radius: 15px;
        z-index: 1000;
        height: fit-content;
        max-height: calc(100vh - var(--spacing) * 2);
        overflow: auto;
    }

    .middle {
        display: flex;
        justify-content: center;
        align-items: center;
    }

    #Id {
        transition: border 200ms;
    }


</style>