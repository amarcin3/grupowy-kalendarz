<script>
    import {fade, fly} from "svelte/transition";
    import {quintOut} from "svelte/easing";
    import Spinner from "./Spinner.svelte";
    import {
        collection,
        getFirestore,
        query,
        getDocs,
        where,
        getDoc,
        doc,
        addDoc,
        serverTimestamp
    } from "firebase/firestore";
    import {getApp} from "firebase/app";
    import {getAuth} from "firebase/auth";
    import {onMount} from "svelte";

    export let showAddEventModal;
    export let grupa;
    export let dateToPass = new Date();

    let dataS
    onMount(() => {
        setTimeout(() => {
            if (document.getElementById('DataS') !== null) {
                dataS = document.getElementById('DataS');
                dataS.value = dateToPass.getFullYear() + "-" + (dateToPass.getMonth()+1).toString().padStart(2, '0') + "-" + dateToPass.getDate().toString().padStart(2, '0') + "T" + dateToPass.getHours().toString().padStart(2, '0') + ":" + dateToPass.getMinutes().toString().padStart(2, '0');
            }
        }, 10);
    });

    let app = getApp();
    const auth = getAuth(app);
    const db = getFirestore(app);

    let displayError = "";
    let loading = false;
    let users = [];
    let name = "";
    function closeModal(saved = false) {
        if (saved === true) {
            dispatchEvent(new CustomEvent("eventSent"));
        }
        loading = false;
        showAddEventModal = false;
    }

    getUsers();

    async function getUsers(){
        let userIds = [];
        await getDoc(doc(db, "Grupy", grupa.Id)).then((doc) => {
            userIds.push(doc.data().IdZalozyciela);
        }).then(async() => {
            await getDocs(query(collection(db, "Grupy", grupa.Id, "Users"))).then((doc) => {
                doc.forEach((doc) => {
                    userIds.push(doc.data().IdUzytkownika);
                });
            }).then(async () => {
                await getDocs(query(collection(db, "Users"), where("__name__", "in", userIds))).then((doc) => {
                    doc.forEach((doc) => {
                        users.push({Id: doc.id, data:doc.data()});
                    });
                });
            });
        });
        let CU = users.filter((user) => {
            return user.Id === auth.currentUser.uid;
        });

        name = CU[0].data.Imie + " " + CU[0].data.Nazwisko;

        users = users.filter((user) => {
            return user.Id !== auth.currentUser.uid;
        });
        users = users.sort((a, b) => {
            return a.data.Nazwisko.localeCompare(b.data.Nazwisko);
        });
    }


    async function addEvent(data) {
        let pUsers = [];
        pUsers.push(auth.currentUser.uid)
        for (let i = 5; i < data.length; i++) {
            if (data[i][1] === "on") {
                pUsers.push(data[i][0]);
            }
        }
        await addDoc(collection(db, "Wydarzenia"), {
            IdGrupy: grupa.Id,
            Tytul: data[0][1],
            Opis: data[1][1],
            DataS: data[2][1],
            DataK: data[3][1],
            Miejsce: data[4][1],
            IdOsob: pUsers,
            Utworzyl: name,
            DataDodania: serverTimestamp(),

        }).then(() => {
            loading = false;
            closeModal(true);
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

    const submitForm = (event) => {
        loading = true;
        const formData = new FormData(event.target)
        const data = [...formData.entries()];
        addEvent(data);
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
            <input type="text" name="Miejsce" placeholder="Miejsce"/>
            <details role="list">
                <summary aria-haspopup="listbox">Osoby</summary>
                <ul role="listbox">
                    {#each users as user}
                        <li>
                            <label>
                                <input type="checkbox" name="{user.Id}">
                                {user.data.Imie} {user.data.Nazwisko}
                            </label>
                        </li>
                    {/each}
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