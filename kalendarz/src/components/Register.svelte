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

    function remember(email, password, firstName, lastName, remember){
        if(remember === 'on'){
            setPersistence(auth, browserLocalPersistence)
                .then(() => {
                    register(email, password, firstName, lastName);
                })
                .catch((error) => {
                    const errorCode = error.code;
                    const errorMessage = error.message;
                    console.log(errorCode, errorMessage);
                });
        } else {
            setPersistence(auth, browserSessionPersistence)
                .then(() => {
                    register(email, password, firstName, lastName);
                })
                .catch((error) => {
                    const errorCode = error.code;
                    const errorMessage = error.message;
                    console.log(errorCode, errorMessage);
                });
        }
    }
    function register(email, password, firstName, lastName){
        loading = true;
        createUserWithEmailAndPassword(auth, email, password)
            .then(async (userCredential) => {
                await setDoc(doc(db, "users", userCredential.user.uid), {
                    email: email,
                    firstName: firstName,
                    lastName: lastName,
                    created: serverTimestamp()});
            }).catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.log(errorCode, errorMessage);
            if (errorCode === 'auth/email-already-in-use') {
                document.getElementById('email').setAttribute('aria-invalid', 'true');
                displayError = 'Podany adres email jest już zajęty';
            } else if (errorCode === 'auth/invalid-email') {
                document.getElementById('email').setAttribute('aria-invalid', 'true');
                displayError = 'Podany adres email jest nieprawidłowy';
            } else if (errorCode === 'auth/weak-password') {
                document.getElementById('password').setAttribute('aria-invalid', 'true');
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
        document.getElementById('password').removeAttribute('aria-invalid');
        document.getElementById('email').removeAttribute('aria-invalid');
        const formData = new FormData(event.target)
        remember(formData.get('email'), formData.get('password'), formData.get('firstName'), formData.get('lastName'), formData.get('remember')/*on, null*/)
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
                <input id="email" type="email" name="email" placeholder="Email" aria-label="Login" autocomplete="email" required>
                <input id="firstName" type="text" name="firstName" placeholder="Imię" aria-label="FirstName" required>
                <input id="lastName" type="text" name="lastName" placeholder="Nazwisko" aria-label="LastName" required>
                <input id="password" { type } name="password" placeholder="Hasło" aria-label="Password" autocomplete="current-password" required>
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
                <button type="submit">Zarejestruj</button>
            </form>
        </div>
    </article>
</main>

<!--<footer class="container-fluid">
    <small>Built with <a href="https://picocss.com" class="secondary">Pico</a> • <a href="https://github.com/picocss/examples/tree/master/sign-in/" class="secondary">Source code</a></small>
</footer>-->
</body>
<style>
    #email, #password, #firstName, #lastName {
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