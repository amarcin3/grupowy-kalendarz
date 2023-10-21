<script>
    import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence, browserSessionPersistence} from "firebase/auth";
    import Spinner from "./Spinner.svelte";


    export let auth;
    export let db;
    export let storage;

    let loading = false;

    document.title = "Zaloguj się";

    function remember(Email, Haslo, Zapamietaj){
        if(Zapamietaj === 'on'){
            setPersistence(auth, browserLocalPersistence)
                .then(() => {
                    login(Email, Haslo);
                })
                .catch((error) => {
                    const errorCode = error.code;
                    const errorMessage = error.message;
                    console.log(errorCode, errorMessage);
                });
        } else {
            setPersistence(auth, browserSessionPersistence)
                .then(() => {
                    login(Email, Haslo);
                })
                .catch((error) => {
                    const errorCode = error.code;
                    const errorMessage = error.message;
                    console.log(errorCode, errorMessage);
                });
        }
    }

    let displayError = "";
    function login(Email, Haslo){
        loading = true;
        signInWithEmailAndPassword(auth, Email, Haslo)
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                console.log(errorCode, errorMessage);
                if (errorCode === 'auth/wrong-password'){
                    document.getElementById('Haslo').setAttribute('aria-invalid', 'true');
                    displayError = 'Niepoprawne hasło';
                }
                else if (errorCode === 'auth/user-not-found'){
                    document.getElementById('Email').setAttribute('aria-invalid', 'true');
                    displayError = 'Nie ma użytkownika z takim mailem';
                }
                else if (errorCode === 'auth/invalid-email'){
                    document.getElementById('Email').setAttribute('aria-invalid', 'true');
                    displayError = 'Niepoprawny email';
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

    let showPassword = false;
    let type;
    $: type = showPassword ? 'text' : 'password'

    const submitForm = (event) => {
        document.getElementById('Haslo').removeAttribute('aria-invalid');
        document.getElementById('Email').removeAttribute('aria-invalid');
        displayError = "";
        const formData = new FormData(event.target);
        remember(formData.get('Email'), formData.get('Haslo'),formData.get('Zapamietaj'))
    }
    </script>


<body>
<main class="container" style="padding-top: 0">
    {#if loading}
        <div class="modal-overlay middle" style="background-color: rgba(0, 0, 0, 0.7);">
            <Spinner/>
        </div>
    {/if}
    <article>
        <div>
            <hgroup>
                <h1>Logowanie</h1>
                <h2><a href="/zarejestruj">Jeszcze nie mam konta</a></h2>
            </hgroup>
            <p style="color: red;"> {displayError}</p>
            <form on:submit|preventDefault={submitForm}>
                <input id="Email" type="email" name="Email" placeholder="Email" aria-label="Login" autocomplete="email" required>
                <input id="Haslo" { type } name="Haslo" placeholder="Hasło" aria-label="Password" autocomplete="password" required>
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
                <button type="submit">Zaloguj</button>
            </form>
        </div>
    </article>
</main>
<!--TODO: Ogarnąć zwracane błędy podczas logowania (niepoprawne dane logowania itp., zmieniły się od ostatniego czasu)-->
</body>
<style>
    #Email, #Haslo {
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