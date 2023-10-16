<script>
    import router from "page";
    import {doc, getDoc} from "firebase/firestore";


    document.title = "Strona główna";

    export let loggedIn = false;
    export let auth;
    export let db;
    export let storage;

    let name = "";
    let dataLoading = true;

    function redirect(path) {
        history.pushState({}, '', window.location.href);
        router.redirect(path);
    }

    async function getData(){
        const cachedUserData = sessionStorage.getItem("userData");
        if (cachedUserData){
            const data = JSON.parse(cachedUserData);
            name = data.firstName + " " + data.lastName;

        } else {
            const docRef = doc(db, "users", auth.currentUser.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                name = data.firstName + " " + data.lastName;
            }
        }
        dataLoading = false;
    }

    $: {
        if (loggedIn) {
            getData();
        }
    }

</script>

<main class="grid">
    <article>
        <hgroup>
            <h1>Strona główna</h1>
            {#if !loggedIn}
                <h2>Zaloguj się lub zarejestruj</h2>
            {:else}
                <h2>Witaj, {name}</h2>
            {/if}
        </hgroup>
        {#if !loggedIn}
            <button on:click={() => {redirect("/zaloguj")}}>Zaloguj się</button>
            <button on:click={() => {redirect("/zarejestruj")}}>Zarejestruj się</button>
        {:else}
            <button on:click={() => {redirect("/konto")}}>Profil użytkownika</button>
        {/if}

    </article>
</main>
<style>
    article {
        margin: var(--spacing);
    }
</style>