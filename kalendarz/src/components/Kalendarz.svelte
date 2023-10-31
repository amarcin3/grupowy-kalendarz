<script>

    import {collection, getDocs, limit, query, where} from "firebase/firestore";
    import Spinner from "./Spinner.svelte";

    export let db;
    export let auth;
    export let loggedIn;
    export let storage;

    let poprzednieDni = [];
    let dni = [];
    let nastepneDni = [];
    let zaznaczoneDni = [];
    let dniWydarzen = [];

    let groupName = "";
    let grupa = {};
    let eventsLoading = true;
    let daneWydarzen = [];

    let nazwyMiesiacy = ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"];
    let date = new Date();
    date.setDate(1) // Zaraz mi się coś stanie
    date.setMonth(date.getMonth());
    let month = date.getMonth();
    let year = date.getFullYear();
    wyswietlDni()

    function Day(day, month, year, today) {
        this.day = day;
        this.month = month;
        this.year = year;
        this.today = today;
    }

    $: if(loggedIn){
        let url = window.location.href;
        groupName = url.split("/")[4];
        groupName = decodeURI(groupName);
        getGrupy().then(() => {
            getWydarzenia();
        });
    }

    async function getGrupy(){
        const q = query(collection(db, "Users", auth.currentUser.uid, "Grupy"), where("Nazwa", "==", groupName), limit(1));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            grupa = {Id: doc.id, data: doc.data()};
            document.title = grupa.data.Nazwa + " - Grupa";

        });
    }

    async function getWydarzenia(){
        eventsLoading = true;
        await getDocs(query(collection(db, "Wydarzenia"), where("IdGrupy", "==", grupa.Id))).then((querySnapshot) => {
            daneWydarzen = [];
            dniWydarzen = [];
            querySnapshot.forEach((doc) => {
                daneWydarzen.push(doc);
                const d = new Date(doc.data().DataS);
                dniWydarzen.push(new Day(d.getDate(), d.getMonth(), d.getFullYear(), false));
            });
        }).catch((error) => {
            console.log(error);
        });
        eventsLoading = false;
    }

    async function getUsers(ids){
        let users = [];
        await getDocs(query(collection(db, "Users"), where("__name__", "in", ids))).then((doc) => {
            doc.forEach((doc) => {
                users.push({Id: doc.id, data:doc.data()});
            });
        });

        users = users.sort((a, b) => {
            return a.data.Imie.localeCompare(b.data.Imie);
        });

        users = users.sort((a, b) => {
            return a.data.Nazwisko.localeCompare(b.data.Nazwisko);
        });

        users = users.sort((a, b) => {
            if (a.Id === auth.currentUser.uid){
                return -1;
            } else if (b.Id === auth.currentUser.uid){
                return 1;
            } else {
                return 0;
            }
        });

        return users;
    }

    function nastepnyMiesiac(){
        date.setMonth(date.getMonth() + 1);
        wyswietlDni()
    }
    function poprzedniMiesiac(){
        date.setMonth(date.getMonth() - 1);
        wyswietlDni()
    }

    function wyswietlDni(){
        month = date.getMonth();
        year = date.getFullYear();

        let firstDay = new Date(year, month, 1);

        if (firstDay.getDay() !== 1) {
            let lastDayOfPreviousMonth = new Date(year, month, 0).getDate();
            poprzednieDni = [];
            for (let i = firstDay.getDay() === 0 ? 7: firstDay.getDay(); i > 1; i--) {
                poprzednieDni[i-2] = (new Day(lastDayOfPreviousMonth, month - 1, year, lastDayOfPreviousMonth === new Date().getDate() && month - 1 === new Date().getMonth() && year === new Date().getFullYear()));
                lastDayOfPreviousMonth--;
            }
        } else {
            poprzednieDni = [];
        }

        dni = [];
        for (let i = 1; i <= new Date(year, month + 1, 0).getDate(); i++) {
            dni.push(new Day(i, month, year, i === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear()));
        }

        if (new Date(year, month + 1, 0).getDay() !== 0) {
            nastepneDni = [];
            for (let i = 1; i <= 7 - new Date(year, month + 1, 0).getDay(); i++) {
                nastepneDni.push(new Day(i, month + 1, year, i === new Date().getDate() && month + 1 === new Date().getMonth() && year === new Date().getFullYear()));
            }
        } else {
            nastepneDni = [];
        }

        let daysToAdd = (6 - (Math.ceil((poprzednieDni.length + dni.length + nastepneDni.length) / 7))) * 7;
        let startDay = (nastepneDni[nastepneDni.length - 1] ? nastepneDni[nastepneDni.length - 1].day : 0) + 1;
        for (let i = startDay; i < daysToAdd + startDay; i++) {
            nastepneDni.push(new Day(i, month + 1, year, i === new Date().getDate() && month + 1 === new Date().getMonth() && year === new Date().getFullYear()));
        }
    }

    function zmienZaznaczDzien(dzien){
        if (zaznaczoneDni.filter(item => item.day !== dzien.day || item.month !== dzien.month || item.year !== dzien.year).length !== zaznaczoneDni.length) {
            zaznaczoneDni = zaznaczoneDni.filter(item => item.day !== dzien.day || item.month !== dzien.month || item.year !== dzien.year)
        } else {
            zaznaczoneDni.push(dzien)
        }
        zaznaczoneDni = zaznaczoneDni.sort((a, b) => a.day - b.day).sort((a, b) => a.month - b.month).sort((a, b) => a.year - b.year)
    }

    function podswietl(id){
        /*highlight using css*/
        let element = document.getElementById(id);
        element.scrollIntoView({behavior: "smooth", block: "center", inline: "nearest"})
        element.classList.add("highlight");
        setTimeout(() => {
            element.classList.remove("highlight");
        }, 3000);
    }

</script>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css" crossorigin="anonymous" />
<main class="container">
    <!--powrót-->
    <a href="/grupy/{groupName}" class="button"><i class="fa-solid fa-arrow-left"></i> Powrót</a>
    <div class="calendar">
        <div class="button-grid">
            <button class="change-button" on:click={() => {poprzedniMiesiac()}}><i class="fa-solid fa-chevron-left"></i></button><h1 class="calendar-month">{nazwyMiesiacy[month]}&nbsp;{year}</h1><button class="change-button" on:click={() => {nastepnyMiesiac()}}><i class="fa-solid fa-chevron-right"></i></button>
        </div>
        <div class="calendar-grid">
            <div class="calendar-header">Pon</div>
            <div class="calendar-header">Wt</div>
            <div class="calendar-header">Śr</div>
            <div class="calendar-header">Czw</div>
            <div class="calendar-header">Pią</div>
            <div class="calendar-header">Sob</div>
            <div class="calendar-header">Nie</div>
            {#each poprzednieDni as dzien}
                <div class="calendar-day {dzien.today ? 'dzisiaj' : ''}
                        {zaznaczoneDni.filter(item => item.day !== dzien.day || item.month !== dzien.month || item.year !== dzien.year).length !== zaznaczoneDni.length ? 'wybrane' : ''}
                        {dniWydarzen.filter(item => item.day !== dzien.day || item.month !== dzien.month || item.year !== dzien.year).length !== dniWydarzen.length ? 'wydarzenie' : ''}"
                     on:click={() => {zmienZaznaczDzien(dzien)}}>
                    <span class="last">
                        {dzien.day}
                    </span>
                </div>
            {/each}
            {#each dni as dzien}
                <div class="calendar-day {dzien.today ? 'dzisiaj' : ''}
                        {zaznaczoneDni.filter(item => item.day !== dzien.day || item.month !== dzien.month || item.year !== dzien.year).length !== zaznaczoneDni.length ? 'wybrane' : ''}
                        {dniWydarzen.filter(item => item.day !== dzien.day || item.month !== dzien.month || item.year !== dzien.year).length !== dniWydarzen.length ? 'wydarzenie' : ''}"
                     on:click={() => {zmienZaznaczDzien(dzien)}}>
                    {dzien.day}
                </div>
            {/each}
            {#each nastepneDni as dzien}
                <div class="calendar-day {dzien.today ? 'dzisiaj' : ''}
                        {zaznaczoneDni.filter(item => item.day !== dzien.day || item.month !== dzien.month || item.year !== dzien.year).length !== zaznaczoneDni.length ? 'wybrane' : ''}
                        {dniWydarzen.filter(item => item.day !== dzien.day || item.month !== dzien.month || item.year !== dzien.year).length !== dniWydarzen.length ? 'wydarzenie' : ''}"
                     on:click={() => {zmienZaznaczDzien(dzien)}}>
                    <span class="next">
                        {dzien.day}
                    </span>
                </div>
            {/each}
        </div>
    </div>

    {#if zaznaczoneDni.length > 0}<h1>Wybrane dni:</h1>{/if}
    {#each zaznaczoneDni as dzien}
        {#if dniWydarzen.filter(item => item.day !== dzien.day || item.month !== dzien.month || item.year !== dzien.year).length !== dniWydarzen.length}
            <div class="calendar-day zaznaczoneDniLi wydarzenie {dzien.today ? 'dzisiaj' : ''}">
                {dzien.day}.{dzien.month+1}.{dzien.year} -
                {daneWydarzen.filter(item => {const d = new Date(item.data().DataS); return d.getDate() === dzien.day && d.getMonth() === dzien.month && d.getFullYear() === dzien.year}).length} wydarze{daneWydarzen.filter(item => {const d = new Date(item.data().DataS); return d.getDate() === dzien.day && d.getMonth() === dzien.month && d.getFullYear() === dzien.year}).length === 1 ? 'nie': 'nia'}
                <div style="width: fit-content; margin-left: auto; margin-right: auto">
                    {#each daneWydarzen.filter(item => {const d = new Date(item.data().DataS); return d.getDate() === dzien.day && d.getMonth() === dzien.month && d.getFullYear() === dzien.year}) as wydarzenie}
                        <button class="pokazWydarzenieButton" data-tooltip="Zobacz szczegóły wydarzenia" data-placement="right" on:click={() => {podswietl(wydarzenie.id)}}>{wydarzenie.data().Tytul}</button>
                    {/each}
                </div>

            </div>
        {:else}
            <div class="calendar-day zaznaczoneDniLi wybrane {dzien.today ? 'dzisiaj' : ''}">
                {dzien.day}.{dzien.month+1}.{dzien.year}
            </div>
        {/if}
    {/each}
    <br>
    <h1>Wszystkie wydarzenia:</h1>
    {#if eventsLoading}
        <Spinner/>
    {:else if daneWydarzen.length === 0}
        <p>Brak wydarzeń</p>
    {/if}
    {#each daneWydarzen as daneWydarzenia}
        <article id="{daneWydarzenia.id}" class="wydarzenieArticle">
            <div>
                <p>Nazwa: {daneWydarzenia.data().Tytul}</p>
                <p>Opis: {daneWydarzenia.data().Opis}</p>
                <p>Data początkowa: {daneWydarzenia.data().DataS}</p>
                <p>Data końcowa: {daneWydarzenia.data().DataK}</p>
                <p>Miejsce: {daneWydarzenia.data().Miejsce}</p>
                <p>Utworzył: {daneWydarzenia.data().Utworzyl}</p>
                Uczestnicy:
                <ol>
                    {#await getUsers(daneWydarzenia.data().IdOsob)}
                        {#each daneWydarzenia.data().IdOsob as IdOsoby}
                            <li>{IdOsoby}<li>
                        {/each}
                    {:then users}
                        {#each users as user}
                            <li>{user.data.Imie} {user.data.Nazwisko}</li>
                        {/each}
                    {:catch error}
                        <p>{error.message}</p>
                    {/await}
                </ol>
            </div>
        </article>
    {/each}
</main>

<!--suppress CssUnusedSymbol -->
<style>

    h1, .calendar {
        margin: 0;
        padding: 0;
    }

    .calendar {
        min-width: fit-content;
        margin: auto;

    }

    .calendar-header, .calendar-month, .calendar-day {
        text-align: center;
        padding: 10px;
    }

    .calendar-month {
        align-self: center;
        justify-self: center;
    }

    .calendar-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
    }

    @media (hover: none) {
        .calendar-day:hover {
            background-color: transparent;
        }

        .dzisiaj:not(.wybrane):hover {
            background-color: var(--primary);
        }

        .dzisiaj:not(.wydarzenie):hover {
            background-color: rgb(132, 72, 189);;
        }

        .wydarzenie:hover {
            background-color: rgb(132, 72, 189);;
        }

        .wybrane:hover {
            background-color: var(--secondary);
        }
    }

    .button-grid {
        border: 1px solid #ccc;
        display: grid;
        grid-template-columns: 1fr 5fr 1fr;
    }

    .calendar-header, .calendar-day {
        padding: 10px;
        border: 1px solid #ccc;
        font-weight: bold;
    }

    .calendar-header:nth-child(6), .calendar-header:nth-child(7) {
        background-color: rgba(136, 136, 136, 0.38);
    }

    .last, .next {
        opacity: 50%;
    }

    .change-button {
        width: fit-content;
        aspect-ratio: 1;
        background-color: var(--card-background-color);
        border: none;
        border-radius: 50%;
        margin: var(--spacing);
        align-self: center;
        justify-self: center;
        display: flex;
    }

    i {
        color: var(--contrast);
        align-self: center;
        justify-self: center;
    }

    .dzisiaj {
        background-color: var(--primary);
        color: white;
    }

    .wydarzenie {
        background-color: rgb(132, 72, 189);
        color: white;
    }

    .wybrane {
        background-color: var(--secondary);
        color: white;
    }
    .zaznaczoneDniLi.dzisiaj {
        background-color: var(--primary);
        color: white;
    }

    .calendar-day:not(.zaznaczoneDniLi):hover {
        background-color: rgba(136, 136, 136, 0.38);
    }

    /*.highlight changes background color of .wydarzenieArticle, and when highlight is removed slowly return to original background color*/
    .wydarzenieArticle:not(.highlight) {
        background-color: var(--card-background-color);
        transition: background-color 3s;
    }

    :global(.highlight) {
        background-color: rgba(136, 136, 136, 0.38);
        transition: background-color 0s;
    }

    .pokazWydarzenieButton {
        margin: 0 auto calc(var(--spacing) / 8)  auto;
        padding: calc(var(--spacing) / 8) calc(var(--spacing) / 4);
        width: 100%;
    }

</style>