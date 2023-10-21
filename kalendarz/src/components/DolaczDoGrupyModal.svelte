<script>
    import {fade, fly} from "svelte/transition";
    import {quintOut} from "svelte/easing";
    import Spinner from "./Spinner.svelte";
    import {onMount} from "svelte";
    import {collection, doc, getDoc, getFirestore, setDoc, addDoc} from "firebase/firestore";
    import {getApp} from "firebase/app";
    import {getAuth} from "firebase/auth";

    export let showJoinGroupModal;

    let app = getApp();
    const auth = getAuth(app);
    const db = getFirestore(app);

    // Nienawidzę tego. Nie wiem czemu, ale bez tego nie ma animacji
    let timed = false;
    onMount(() => {
        timed = true;
    });
    // Koniec tego czegoś

    let done = false;
    let displayError = "";
    let loading = false;
    function closeModal(saved = false) {
        if (saved === true) {
            dispatchEvent(new CustomEvent("sent"));
        }
        loading = false;
        showJoinGroupModal = false;
    }

    let user = {
        Imie: "",
        Nazwisko: "",
    }
    async function getData(){
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
    }

    const submitForm = (event) => {
        loading = true;
        const formData = new FormData(event.target)
        const data = [...formData.entries()];
        joinGroup(data);
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

    let showPassword = false;
    let type;
    $: type = showPassword ? 'text' : 'password'

    $: if (showJoinGroupModal === true) {
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

{#if done && timed}
    <div class="modal-overlay" class:open={showJoinGroupModal} transition:fade={{duration: 200, easing: quintOut}}>
        <div class="modal-content" class:open={showJoinGroupModal} transition:fly="{{ y: -50, duration: 400, easing: quintOut }}">
            <hgroup>
                <h1>Wysłano!</h1>
                <h2>Poproś właściciela grupy o zaakceptowanie twojej prośby o dołączenie.</h2>
            </hgroup>
            <button on:click={() => {closeModal(true)}} class="primary">Ok</button>
        </div>
    </div>
{:else if timed}
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
                <h1>Dołącz do grupy</h1>
                <h2>Wpisz ID grupy oraz hasło, aby dołączyć do grupy.</h2>
            </hgroup>
            <p style="color: red;"> {displayError}</p>
            <form id="form" on:submit|preventDefault={submitForm} style="margin-bottom: var(--spacing)">
                <input id="Id" name="Id" type="text" placeholder="ID grupy" autocomplete=false required/>
                <input id="Haslo" name="Haslo" {type} placeholder="Hasło" autocomplete=false required/>
                <fieldset>
                    <div class="grid">
                        <label for="showPassword">
                            <input type="checkbox" role="switch" id="showPassword" name="showPassword" on:click={() => showPassword = !showPassword}>
                            Pokaż hasło
                        </label>
                    </div>
                </fieldset>
                <input type="submit" value="Dołącz do grupy" style="margin-bottom: 0"/>
            </form>

            <button on:click={closeModal} class="primary outline">Anuluj</button>
        </div>
    </div>
{/if}


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

    #Id, #Haslo {
        transition: border 200ms;
    }
</style>