<script>
    import {fade, fly} from "svelte/transition";
    import {quintOut} from "svelte/easing";
    import Spinner from "./Spinner.svelte";
    import {getFirestore, deleteDoc, updateDoc, doc, setDoc} from "firebase/firestore";
    import {getApp} from "firebase/app";

    export let showPendingModal;
    export let daneOczekujacych;

    let app = getApp();
    const db = getFirestore(app);


    let displayError = "";
    let loading = false;
    function closeModal() {
        loading = false;
        showPendingModal = false;
    }

    function usunProsbe(data){
        loading = true;
        displayError = "";
        deleteDoc(data.ref).then(() => {
            let indexToRemove = daneOczekujacych.indexOf(data);
            if (indexToRemove !== -1) {
                daneOczekujacych.splice(indexToRemove, 1);
            }
            daneOczekujacych = daneOczekujacych;
            loading = false;
            if (daneOczekujacych.length === 0) closeModal();
        }).catch((error) => {
            if (error.code === "permission-denied"){
                displayError = "Nie masz uprawnień do wykonania tej operacji.";
            } else {
                displayError = "Wystąpił błąd podczas usuwania prośby o dołączenie. Spróbuj ponownie.";
            }
            loading = false;
        });
        dispatchRefresh();
    }

    function zatwierdzProsbe(data) {
        loading = true;
        displayError = "";

        updateDoc(data.ref, {
            StanOczekiwania: "zatwierdzona"
        }).then(() => {
            console.log(data.data().IdGrupy);
            console.log(data.data().IdUzytkownika);

            setDoc(doc(db, "Grupy/" + data.data().IdGrupy + "/Users", data.data().IdUzytkownika), {
                IdUzytkownika: data.data().IdUzytkownika,
            }).then(() => {
                let indexToRemove = daneOczekujacych.indexOf(data);
                if (indexToRemove !== -1) {
                    daneOczekujacych.splice(indexToRemove, 1);
                }
                daneOczekujacych = daneOczekujacych;
                loading = false;
                if (daneOczekujacych.length === 0) closeModal();
            }).catch((error) => {
                if (error.code === "permission-denied") {
                    displayError = "Nie masz uprawnień do wykonania tej operacji.";
                } else {
                    displayError = "Wystąpił błąd podczas akceptowania prośby o dołączenie. Spróbuj ponownie.";
                    console.log(error);
                }
                loading = false;
            })
        })
        dispatchRefresh();
    }

    function dispatchRefresh() {
        dispatchEvent(new CustomEvent("refresh"));
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


</script>

<div class="modal-overlay" class:open={showPendingModal} transition:fade={{duration: 200, easing: quintOut}}>
    <div class="modal-content" class:open={showPendingModal} transition:fly="{{ y: -50, duration: 400, easing: quintOut}}">
        <div>
            {#if loading}
                <div class="modal-overlay middle" style="background-color: rgba(0, 0, 0, 0.7);">
                    <Spinner/>
                </div>
            {/if}
        </div>
        <hgroup>
            <h1>Sprawdź oczekujące prośby o dołączenie.</h1>
            <h2>Wciśnij przycisk, aby zaakceptować lub odrzucić.</h2>
        </hgroup>
        <p style="color: red;"> {displayError}</p>
        {#each daneOczekujacych as doc}
            <div class="card grid">
                <div class="grid">
                    <h3 style="margin-bottom: 0">{doc.data().NazwaUzytkownika}</h3>
                </div>
                <div class="grid">
                    <button on:click={() => {zatwierdzProsbe(doc)}}>Zaakceptuj</button>
                    <button on:click={() => {usunProsbe(doc)}}>Odrzuć</button>
                </div>

            </div>
        {/each}
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

    .card {
        grid-template-columns: 1fr 1fr;
        padding: calc(var(--spacing)*0.5);
        margin: 0;
        border-radius: 15px;
        background-color: var(--card-background-color);
    }

    .grid {
        grid-gap: 0.5em;
    }

    button{
        margin-bottom: 0;
        height: calc(var(--spacing)*3);
    }

    h3 {
        align-self: center;
        grid-column: 1;
    }

    .middle {
        display: flex;
        justify-content: center;
        align-items: center;
    }
</style>