<script>
    import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence, browserSessionPersistence} from "firebase/auth";
    import Spinner from "./Spinner.svelte";


    export let auth;
    export let db;
    export let storage;

    let loading = false;

    document.title = "Zaloguj się";

    function remember(email, password, remember){
        if(remember === 'on'){
            setPersistence(auth, browserLocalPersistence)
                .then(() => {
                    login(email, password);
                })
                .catch((error) => {
                    const errorCode = error.code;
                    const errorMessage = error.message;
                    console.log(errorCode, errorMessage);
                });
        } else {
            setPersistence(auth, browserSessionPersistence)
                .then(() => {
                    login(email, password);
                })
                .catch((error) => {
                    const errorCode = error.code;
                    const errorMessage = error.message;
                    console.log(errorCode, errorMessage);
                });
        }
    }

    let displayError = "";
    function login(email, password){
        loading = true;
        signInWithEmailAndPassword(auth, email, password)
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                console.log(errorCode, errorMessage);
                if (errorCode === 'auth/wrong-password'){
                    document.getElementById('password').setAttribute('aria-invalid', 'true');
                    displayError = 'Niepoprawne hasło';
                }
                else if (errorCode === 'auth/user-not-found'){
                    document.getElementById('email').setAttribute('aria-invalid', 'true');
                    displayError = 'Nie ma użytkownika z takim mailem';
                }
                else if (errorCode === 'auth/invalid-email'){
                    document.getElementById('email').setAttribute('aria-invalid', 'true');
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
        document.getElementById('password').removeAttribute('aria-invalid');
        document.getElementById('email').removeAttribute('aria-invalid');
        displayError = "";
        const formData = new FormData(event.target);
        remember(formData.get('email'), formData.get('password'),formData.get('remember'))
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
                <input id="email" type="email" name="email" placeholder="Email" aria-label="Login" autocomplete="email" required>
                <input id="password" { type } name="password" placeholder="Hasło" aria-label="Password" autocomplete="password" required>
                <fieldset>
                    <div class="grid">
                        <label for="remember">
                            <input type="checkbox" role="switch" id="remember" name="remember">
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

<!--<footer class="container-fluid">
    <small>Built with <a href="https://picocss.com" class="secondary">Pico</a> • <a href="https://github.com/picocss/examples/tree/master/sign-in/" class="secondary">Source code</a></small>
</footer>-->
</body>
<style>
    #email, #password {
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