<script>
    import {fade, fly} from "svelte/transition";
    import {quintOut} from "svelte/easing";
    import Spinner from "./Spinner.svelte";
    import {doc, getFirestore, serverTimestamp, setDoc} from "firebase/firestore";
    import {getApp} from "firebase/app";
    import {getAuth} from "firebase/auth";

    export let showCreateGroupModal;

    let app = getApp();
    const auth = getAuth(app);
    const db = getFirestore(app);

    let loading = false;
    function closeModal(saved = false) {
        if (saved === true) {
            dispatchEvent(new CustomEvent("created"));
        }
        loading = false;
        showCreateGroupModal = false;
    }

 /*   async function createGroup(companyId, data) {
        await setDoc(doc(db, "companies", companyId), {
            companyId: companyId,
            createdAt: serverTimestamp(),
            name: data[0][1],
            founderId: auth.currentUser.uid,
            phoneNumber: data[1][1],
            nip: data[2][1],
            address: data[3][1],
            password: data[4][1],
        }).then(async () => {
            await setDoc(doc(db, "companies/" + companyId + "/employees", auth.currentUser.uid), {
                employeeId: auth.currentUser.uid,
            })
        }).then(async () => {
            await setDoc(doc(db, "users", auth.currentUser.uid), {
                companyId: companyId,
                state: "founder",
            }, {merge: true});
        }).then(() => {
            loading = false;
            closeModal(true);
        });

    }*/

    const submitForm = (event) => {
        loading = true;
        const formData = new FormData(event.target)
        const data = [...formData.entries()];
        //createGroup(new Date().getTime().toString(), data);
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

<div class="modal-overlay" class:open={showCreateGroupModal} transition:fade={{duration: 200, easing: quintOut}}>
    <div class="modal-content" class:open={showCreateGroupModal} transition:fly="{{ y: -50, duration: 400, easing: quintOut }}">
        <div>
            {#if loading}
                <div class="modal-overlay middle" style="background-color: rgba(0, 0, 0, 0.7);">
                    <Spinner/>
                </div>
            {/if}
        </div>
        <h1>Stwórz grupę</h1>
        <form on:submit|preventDefault={submitForm} style="margin-bottom: var(--spacing)">
            <input name="name" type="text" placeholder="Nazwa grupy" required/>
            <input name="password" type="password" placeholder="Hasło do dołączenia" required/>
            <input type="submit" value="Utwórz grupę" style="margin-bottom: 0"/>
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
</style>