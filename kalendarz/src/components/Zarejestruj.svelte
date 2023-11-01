<script>
    import { doc, setDoc, serverTimestamp } from "firebase/firestore";
    import { createUserWithEmailAndPassword, setPersistence, browserLocalPersistence, browserSessionPersistence} from "firebase/auth";
    import Spinner from "./Spinner.svelte";

    export let auth;
    export let db;
    export let storage;

    let loading = false;

    document.title = "Zarejestruj się";

    let displayError = '';

    function remember(email, password, Imie, Nazwisko, remember){
        if(remember === 'on'){
            setPersistence(auth, browserLocalPersistence)
                .then(() => {
                    register(email, password, Imie, Nazwisko);
                })
                .catch((error) => {
                    const errorCode = error.code;
                    const errorMessage = error.message;
                    console.log(errorCode, errorMessage);
                });
        } else {
            setPersistence(auth, browserSessionPersistence)
                .then(() => {
                    register(email, password, Imie, Nazwisko);
                })
                .catch((error) => {
                    const errorCode = error.code;
                    const errorMessage = error.message;
                    console.log(errorCode, errorMessage);
                });
        }
    }
    function register(Email, Haslo, Imie, Nazwisko){
        loading = true;
        createUserWithEmailAndPassword(auth, Email, Haslo)
            .then(async (userCredential) => {
                await setDoc(doc(db, "Users", userCredential.user.uid), {
                    Email: Email,
                    Imie: Imie,
                    Nazwisko: Nazwisko,
                    Utworzono: serverTimestamp()});
            }).catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.log(errorCode, errorMessage);
            if (errorCode === 'auth/email-already-in-use') {
                document.getElementById('Email').setAttribute('aria-invalid', 'true');
                displayError = 'Podany adres email jest już zajęty';
            } else if (errorCode === 'auth/invalid-email') {
                document.getElementById('Email').setAttribute('aria-invalid', 'true');
                displayError = 'Podany adres email jest nieprawidłowy';
            } else if (errorCode === 'auth/weak-password') {
                document.getElementById('Haslo').setAttribute('aria-invalid', 'true');
                displayError = 'Podane hasło jest za słabe';
            } else if (errorCode === 'auth/network-request-failed'){
                    displayError = 'Wystąpił problem z połączeniem, sprawdź swoje połączenie z internetem'
            } else {
                displayError = 'Wystąpił nieznany błąd';
            }
            loading = false;
        });
    }

    let showPassword = false;
    let type;
    $: type = showPassword ? 'text' : 'password'

    const submitForm = (event) => {
        document.getElementById('Haslo').removeAttribute('aria-invalid');
        document.getElementById('Email').removeAttribute('aria-invalid');
        const formData = new FormData(event.target)
        remember(formData.get('Email'), formData.get('Haslo'), formData.get('Imie'), formData.get('Nazwisko'), formData.get('Zapamietaj')/*on, null*/)
    }

</script>
<body>
<main class="container" style="padding: 0;">
    {#if loading}
        <div class="modal-overlay middle" style="background-color: rgba(0, 0, 0, 0.7);">
            <Spinner/>
        </div>
    {/if}
    <article style="margin-bottom: 10px">
        <div>
            <hgroup>
                <h1>Rejestracja</h1>
                <h2><a href="/zaloguj">Mam już konto</a></h2>
            </hgroup>
            <p style="color: red;"> {displayError}</p>
            <form on:submit|preventDefault={submitForm}>
                <input id="Email" type="email" name="Email" placeholder="Email" aria-label="Email" autocomplete="email" required>
                <input id="Imie" type="text" name="Imie" placeholder="Imię" aria-label="Imie" required>
                <input id="Nazwisko" type="text" name="Nazwisko" placeholder="Nazwisko" aria-label="Nazwisko" required>
                <input id="Haslo" { type } name="Haslo" placeholder="Hasło" aria-label="Haslo" autocomplete="current-password" required>
                <fieldset>
                    <div class="grid">
                        <label for="Zapamietaj">
                            <input type="checkbox" role="switch" id="Zapamietaj" name="Zapamietaj">
                            Zapamiętaj mnie
                        </label>
                        <label for="showPassword">
                            <input type="checkbox" role="switch" id="showPassword" name="showPassword" on:click={() => showPassword = !showPassword}>
                            Pokaż hasło
                        </label>
                    </div>
                </fieldset>
                <button type="submit">Zarejestruj</button>
            </form>
        </div>
    </article>
</main>
<!-- Sprawdzić zwracane błędy podczas rejestracji (email już istnieje, zbyt słabe hasło itp., mogły się zmienić od ostatniego czasu) - Rozwiązane - https://cloud.google.com/identity-platform/docs/admin/email-enumeration-protection-->
</body>
<style>
    #Email, #Haslo, #Imie, #Nazwisko {
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
    .middle {
        display: flex;
        justify-content: center;
        align-items: center;
    }
</style>