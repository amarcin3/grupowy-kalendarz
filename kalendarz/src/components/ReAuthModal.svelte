<script>
    import {fade, fly} from "svelte/transition";
    import {quintOut} from "svelte/easing";
    import {getApp} from "firebase/app";
    import {EmailAuthProvider, getAuth, reauthenticateWithCredential, updatePassword, deleteUser} from "firebase/auth";
    import Spinner from "./Spinner.svelte";
    import {
        collection,
        deleteDoc,
        doc,
        getDoc,
        getDocs,
        getFirestore,
        query,
        where
    } from "firebase/firestore";
    import {getStorage, ref, deleteObject} from "firebase/storage";


    let app = getApp();
    let auth = getAuth(app);
    let db = getFirestore(app);
    const storage = getStorage(app);

    export let showReAuthModal;
    export let usage;
    let loading = false;
    let reAuthOK = false;

    function closeModal() {
        loading = false;
        showReAuthModal = false;
    }
    let displayError = "";
    let user = auth.currentUser;

    function reauthenticateWithEmailAndPassword(email, password) {
        loading = true;
        const credential = EmailAuthProvider.credential(email, password);
        return reauthenticateWithCredential(user, credential).then(() => {
            loading = false;
            reAuthOK = true;
        }).catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.log(errorCode, errorMessage);
            if (errorCode === 'auth/wrong-password'){
                document.getElementById('password').setAttribute('aria-invalid', 'true');
                displayError = 'Niepoprawne hasło';
            }
            else if (errorCode === 'auth/too-many-requests'){
                displayError = 'Zbyt wiele prób logowania. Spróbuj ponownie za chwilę';
            }
            else if (errorCode === 'auth/network-request-failed'){
                displayError = 'Wystąpił problem z połączeniem, sprawdź swoje połączenie z internetem'
            }
            else {
                displayError = 'Nieznany błąd';
            }
            loading = false;
        });
    }

    const changePassword = (event) => {
        document.getElementById('newPassword').removeAttribute('aria-invalid');
        const formData = new FormData(event.target);
        loading = true;
        updatePassword(user, formData.get("password")).then(() => {
            usage = "";
        }).catch((error) => {
            console.log(error.code);
            const errorCode = error.code;
            if (errorCode === 'auth/weak-password') {
                document.getElementById('newPassword').setAttribute('aria-invalid', 'true');
                displayError = 'Podane hasło jest za słabe';
            } else if (errorCode === 'auth/network-request-failed'){
                displayError = 'Wystąpił problem z połączeniem, sprawdź swoje połączenie z internetem'
            } else {
                displayError = 'Wystąpił nieznany błąd';
            }
            loading = false;
        });
    }

    async function deleteAccount(){
        loading = true;
        const docRef = doc(db, "Users", auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.state === "pending"){
                const myQuery = query(collection(db, "pending"), where("employeeId", "==", auth.currentUser.uid));
                const querySnapshot = await getDocs(myQuery);
                querySnapshot.forEach((doc) => {
                    deleteDoc(doc.ref)
                });
            }
            if (data.state === "founder"){
                let companyId = data.companyId;
                console.log(companyId)
                const docRef = doc(db, "companies", companyId);
                const docSnap = await getDoc(docRef);
                if (docSnap !== undefined){

                    const myQuery = query(collection(db, "companies/" + companyId + "/employees"));
                    const querySnapshot = await getDocs(myQuery);

                    await deleteObject(ref(storage, 'companies/' + companyId + '/logo.png')).catch((error) => {
                        console.log(error.code + " while deleting company logo");
                    });
                    querySnapshot.forEach((doc) => {
                        deleteDoc(doc.ref).catch((error) => {
                            console.log(error.code + " while deleting employees");
                        });
                    });
                    await deleteDoc(docRef).catch((error) => {
                        console.log(error.code + " while deleting company");
                    });
                }
                const myQuery1 = query(collection(db, "pending"), where("companyId", "==", companyId));
                const querySnapshot1 = await getDocs(myQuery1);
                querySnapshot1.forEach((doc) => {
                    deleteDoc(doc.ref).catch((error) => {
                        console.log(error.code + " while deleting pending");
                    });
                });
            }
            deleteObject(ref(storage, 'Users/' + auth.currentUser.uid + '/profile.png')).catch((error) => {
                console.log(error.code);
            });
            deleteDoc(docRef).catch((error) => {
                console.log(error.code);
            });
            deleteUser(user).catch((error) => {
                console.log(error.code);
            });
        }
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

    const submitForm = (event) => {
        let email = auth.currentUser.email;
        document.getElementById('password').removeAttribute('aria-invalid');
        displayError = "";
        const formData = new FormData(event.target);
        reauthenticateWithEmailAndPassword(email, formData.get('password'))
    }

    let showPassword = false;
    let type;
    $: type = showPassword ? 'text' : 'password'

    let password = "";
</script>


{#if reAuthOK}
    {#if usage === 'changePassword'}
        <div class="modal-overlay" class:open={showReAuthModal} transition:fade={{duration: 200, easing: quintOut}}>
            <div class="modal-content container" class:open={showReAuthModal} transition:fly="{{ y: -50, duration: 400, easing: quintOut }}">
                {#if loading}
                    <div class="modal-overlay middle" style="background-color: rgba(0, 0, 0, 0.7);">
                        <Spinner/>
                    </div>
                {/if}
                <div>
                    <hgroup>
                        <h1>Wpisz nowe hasło.</h1>
                        <h2>Wpisz hasło za pomocą którego chcesz się logować.</h2>
                    </hgroup>
                    <p style="color: red;"> {displayError}</p>
                    <form on:submit|preventDefault={changePassword} style="margin-bottom: 0">
                        <input id="newPassword" { type } name="password" placeholder="Hasło" aria-label="Password" autocomplete="password" required>
                        <fieldset>
                            <div class="grid">
                                <label for="showPassword">
                                    <input type="checkbox" role="switch" id="newShowPassword" name="showPassword" on:click={() => showPassword = !showPassword}>
                                    Pokaż hasło
                                </label>
                            </div>
                        </fieldset>
                        <button type="submit">Zatwierdź</button>
                    </form>
                    <button on:click={closeModal} class="primary outline">Anuluj</button>
                </div>
            </div>
        </div>
    {:else if usage === 'deleteAccount'}
        <div class="modal-overlay" class:open={showReAuthModal} transition:fade={{duration: 200, easing: quintOut}}>
            <div class="modal-content container" class:open={showReAuthModal} transition:fly="{{ y: -50, duration: 400, easing: quintOut }}">
                {#if loading}
                    <div class="modal-overlay middle" style="background-color: rgba(0, 0, 0, 0.7);">
                        <Spinner/>
                    </div>
                {/if}
                <div>
                    <hgroup>
                        <h1>Usuń konto.</h1>
                        <h2>To usunie wszystkie twoje informacje, po zatwierdzeniu nie będziesz mógł się zalogować.</h2>
                    </hgroup>
                    <p style="color: red;"> {displayError}</p>
                    <button on:click={deleteAccount} style="color: red" class="primary outline">Usuń konto</button>
                    <button on:click={closeModal} class="primary outline">Anuluj</button>
                </div>
            </div>
        </div>
    {:else}
        <div class="modal-overlay" class:open={showReAuthModal} transition:fade={{duration: 200, easing: quintOut}}>
            <div class="modal-content" class:open={showReAuthModal} transition:fly="{{ y: -50, duration: 400, easing: quintOut }}">
                <hgroup>
                    <h1>Zapisano</h1>
                    <h2>Teraz możesz się logować za pomocą nowego hasła.</h2>
                </hgroup>
                <button on:click={closeModal} class="primary">Ok</button>
            </div>
        </div>
    {/if}
{:else}
    <div class="modal-overlay" class:open={showReAuthModal} transition:fade={{duration: 200, easing: quintOut}}>
        <div class="modal-content container" class:open={showReAuthModal} transition:fly="{{ y: -50, duration: 400, easing: quintOut }}">
            {#if loading}
                <div class="modal-overlay middle" style="background-color: rgba(0, 0, 0, 0.7);">
                    <Spinner/>
                </div>
            {/if}
            <div>
                <hgroup>
                    <h1>Wpisz swoje obecne hasło.</h1>
                    <h2>Aby wykonać tą czynność musisz potwierdzić swoją tożsamość.</h2>
                </hgroup>
                <p style="color: red;"> {displayError}</p>
                <form on:submit|preventDefault={submitForm} style="margin-bottom: 0">
                    <input id="password" { type } name="password" placeholder="Hasło" aria-label="Password" autocomplete="password" required>
                    <fieldset>
                        <div class="grid">
                            <label for="showPassword">
                                <input type="checkbox" role="switch" id="showPassword" name="showPassword" on:click={() => showPassword = !showPassword}>
                                Pokaż hasło
                            </label>
                        </div>
                    </fieldset>
                    <button type="submit">Zatwierdź</button>
                </form>
                <button on:click={closeModal} class="primary outline">Anuluj</button>
            </div>
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
    
    #password, #newPassword {
        transition: border 200ms;
    }
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 999;
        background-color: rgba(0, 0, 0, 0.5);
        transition: background-color 0.3s;

    }
</style>
