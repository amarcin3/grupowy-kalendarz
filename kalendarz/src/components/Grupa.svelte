<script>
    import {collection, getDocs, query, where, limit, doc, deleteDoc} from "firebase/firestore";
    import {addNotification} from "../lib/notifications.js";
    import Spinner from "./Spinner.svelte";
    import {fade} from "svelte/transition";
    import {quintOut} from "svelte/easing";

    export let loggedIn = false;
    export let auth;
    export let db;
    export let storage;

    document.title = "Grupa";

    let groupName = "";
    let grupa = {
        Id: "",
        data: {
            Nazwa: "",
            IdWGrupie: 1
        }
    };

    let buttonEl;
    let buttonEl1;

    let pendingLoading = true;
    let daneOczekujacych = [];
    let iloscOczekujacych = 0;

    let PendingModal;
    let showPendingModal = false;


    let eventsLoading = true;
    let daneWydarzen = [];
    let dateToPass;

    let AddEventModal;
    let showAddEventModal = false;


    let poprzednieDni = [];
    let dni = [];
    let nastepneDni = [];
    let zaznaczoneDni = [];
    let dniWydarzen = [];
    let upcomingEvents = [];

    const nazwyMiesiacy = ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"];

    let date = new Date();
    date.setDate(1);
    let month = date.getMonth();
    let year = date.getFullYear();
    wyswietlDni()

    $: if(showAddEventModal){
        document.body.style.overflow = "hidden";
    } else {
        document.body.style.overflow = "auto";
    }

    $: if(showPendingModal){
        document.body.style.overflow = "hidden";
    } else {
        document.body.style.overflow = "auto";
    }

    $: if(loggedIn){
        let url = window.location.href;
        groupName = url.substring(url.lastIndexOf('/') + 1);
        groupName = decodeURI(groupName);
        getGrupy().then(() => {
            getWydarzenia();
        });
    }

    window.addEventListener('refresh', () => {
        getOczekujacePotwierdzenia(grupa.Id);
    });
    window.addEventListener('eventSent', () => {
        getWydarzenia();
    });

    async function getGrupy(){
        const q = query(collection(db, "Users", auth.currentUser.uid, "Grupy"), where("Nazwa", "==", groupName), limit(1));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            grupa = {Id: doc.id, data: doc.data()};
            document.title = grupa.data.Nazwa + " - Grupa";
            if (grupa.data.IdWGrupie === 0){
                getOczekujacePotwierdzenia(grupa.Id)
            }
        });
    }

    async function getOczekujacePotwierdzenia(IdGrupy){
        pendingLoading = true;
        await getDocs(query(collection(db, "OczekujacePotwierdzenia"), where("IdGrupy", "==", IdGrupy))).then((querySnapshot) => {
            daneOczekujacych = [];
            iloscOczekujacych = 0;
            querySnapshot.forEach((doc) => {
                if (doc.data().StanOczekiwania !== "zatwierdzona"){
                    daneOczekujacych.push(doc);
                    iloscOczekujacych++;
                }
            });
        });
        pendingLoading = false;
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

            daneWydarzen = daneWydarzen.sort((a, b) => {
                const d1 = new Date(a.data().DataS);
                const d2 = new Date(b.data().DataS);
                return (d1.getTime() - d2.getTime()) > 0 ? 1 : -1;
            });
            let today = new Date();
            let temp = daneWydarzen.filter(item => {
                const d = new Date(item.data().DataS);
                return d <= today;
            });

            daneWydarzen = daneWydarzen.filter(item => {
                const d = new Date(item.data().DataS);
                return d >= today;
            });

            daneWydarzen = [...daneWydarzen, ...temp];

            getUpcomingEvents(3);
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

    async function deleteEvent(id){
        daneWydarzen = [...daneWydarzen.filter(item => item.id !== id)]
        await deleteDoc(doc(db, "Wydarzenia", id));
        getWydarzenia();
    }

    function nastepnyMiesiac(){
        date.setMonth(date.getMonth() + 1);
        wyswietlDni()
    }

    function poprzedniMiesiac(){
        date.setMonth(date.getMonth() - 1);
        wyswietlDni()
    }

    function Day(day, month, year, today) {
        this.day = day;
        this.month = month;
        this.year = year;
        this.today = today;
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

        for (let i = 0; i < poprzednieDni.length; i++) {
            if (poprzednieDni[i].month === -1) {
                poprzednieDni[i].month = 11;
                poprzednieDni[i].year--;
            }
        }
        for (let i = 0; i < nastepneDni.length; i++) {
            if (nastepneDni[i].month === 12) {
                nastepneDni[i].month = 0;
                nastepneDni[i].year++;
            }
        }

    }

    function getUpcomingEvents(howMany) {
        upcomingEvents = daneWydarzen;
        let today = new Date();

        upcomingEvents = upcomingEvents.filter(item => {
            const d = new Date(item.data().DataS);
            return d >= today;
        });
        upcomingEvents = upcomingEvents.sort((a, b) => {
            const d1 = new Date(a.data().DataS);
            const d2 = new Date(b.data().DataS);
            return (d1.getTime() - d2.getTime()) > 0 ? 1 : -1;
        });
        upcomingEvents = upcomingEvents.slice(0, howMany);
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

    function dodajPrzypomnienie(id, dataS) {
        let timeBefore = document.getElementById(id + "t").value;
        let date = new Date(dataS);

        switch (timeBefore) {
            case "0":
                date = new Date(date.getTime() - 60000);
                break;
            case "1":
                date = new Date(date.getTime() - 900000);
                break;
            case "2":
                date = new Date(date.getTime() - 3600000);
                break;
            case "3":
                date = new Date(date.getTime() - 21600000);
                break;
            case "4":
                date = new Date(date.getTime() - 86400000);
                break;
            case "5":
                date = new Date(date.getTime() - 604800000);
                break;
        }

        if (date < new Date()) {
            addNotification(new Date().setSeconds(new Date().getSeconds() + 1), "Błąd", {body: "Nie można dodać przypomnienia do wydarzenia, które już się odbyło"})
            document.getElementById(id + "b").innerHTML = "Błąd";

        } else {
            addNotification(date.getTime(), daneWydarzen.filter(item => item.id === id)[0].data().Tytul, {body: daneWydarzen.filter(item => item.id === id)[0].data().Opis});
            document.getElementById(id + "b").innerHTML = "Dodano";
        }
        setTimeout(() => {
            document.getElementById(id + "b").innerHTML = "Dodaj przypomnienie";
        }, 3000);
    }

    function formatDate(time){
        let date = new Date(time);
        let day = date.getDate();
        let month = date.getMonth() + 1;
        let year = date.getFullYear();
        let hour = date.getHours();
        let minutes = date.getMinutes();
        let seconds = date.getSeconds();
        let dayS
        let monthS
        let hourS
        let minutesS
        let secondsS

        if (day < 10) dayS = '0' + day;
        else dayS = day;
        if (month < 10) monthS = '0' + month;
        else monthS = month;

        if (hour < 10) hourS = '0' + hour;
        else hourS = hour;
        if (minutes < 10) minutesS = '0' + minutes;
        else minutesS = minutes;
        if (seconds < 10) secondsS = '0' + seconds;
        else secondsS = seconds;


        return `${dayS}.${monthS}.${year} ${hourS}:${minutesS}:${secondsS}`;
    }

</script>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css" crossorigin="anonymous" />
<main class="container-fluid">
    <a href="/grupy" class="button"><i class="fa-solid fa-arrow-left"></i> Powrót</a>
    <div class="grid">
        <div style="margin-top: var(--spacing)">
            {#if grupa}
                <h1>{grupa.data.Nazwa}</h1>
                <h3 style="margin-bottom: 0">Id: {grupa.Id}</h3>
            {/if}
            {#if grupa.data.IdWGrupie === 0}
                <button class="refresh-button calendar-day zaznaczoneDniLi" style="margin-bottom: 0"
                        on:click={async () => {
                        buttonEl.classList.add("spin");
                        await getOczekujacePotwierdzenia(grupa.Id)
                    }}>
                    <svg bind:this={buttonEl} id="reload" on:animationend={() => {
                    if (!pendingLoading)
                        {buttonEl.classList.remove("spin");
                    } else {
                        buttonEl.classList.remove("spin");
                        setTimeout(() => {buttonEl.classList.add("spin");
                        },10)
                    }
                }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Pro 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 FontIcons, Inc. --><path d="M142.9 142.9c62.2-62.2 162.7-62.5 225.3-1L327 183c-6.9 6.9-8.9 17.2-5.2 26.2s12.5 14.8 22.2 14.8H463.5c0 0 0 0 0 0H472c13.3 0 24-10.7 24-24V72c0-9.7-5.8-18.5-14.8-22.2s-19.3-1.7-26.2 5.2L413.4 96.6c-87.6-86.5-228.7-86.2-315.8 1C73.2 122 55.6 150.7 44.8 181.4c-5.9 16.7 2.9 34.9 19.5 40.8s34.9-2.9 40.8-19.5c7.7-21.8 20.2-42.3 37.8-59.8zM16 312v7.6 .7V440c0 9.7 5.8 18.5 14.8 22.2s19.3 1.7 26.2-5.2l41.6-41.6c87.6 86.5 228.7 86.2 315.8-1c24.4-24.4 42.1-53.1 52.9-83.7c5.9-16.7-2.9-34.9-19.5-40.8s-34.9 2.9-40.8 19.5c-7.7 21.8-20.2 42.3-37.8 59.8c-62.2 62.2-162.7 62.5-225.3 1L185 329c6.9-6.9 8.9-17.2 5.2-26.2s-12.5-14.8-22.2-14.8H48.4h-.7H40c-13.3 0-24 10.7-24 24z"/></svg>
                </button>
                {#if iloscOczekujacych > 0}
                    <button class="calendar-day zaznaczoneDniLi" on:click={async () => {PendingModal = (await import("./OczekujacePotwierdzeniaModal.svelte")).default; showPendingModal = true}} style="margin-bottom: calc(var(--spacing) * 0.5)">
                        Oczekujące prośby o dołączenie: {iloscOczekujacych}
                    </button>
                    {#if showPendingModal}
                        <PendingModal bind:showPendingModal bind:daneOczekujacych/>
                    {/if}
                {:else}
                    <button class="calendar-day zaznaczoneDniLi">
                        Brak oczekujących próśb o dołączenie
                    </button>
                {/if}
            {/if}

            {#if upcomingEvents.length === 0}
                Brak nadchodzących wydarzeń
            {:else}
                <h3 style="margin-bottom: 0">Nadchodzące wydarzenia:</h3>
            {/if}
            {#each upcomingEvents as event, x}
                <button class="calendar-day wydarzenie zaznaczoneDniLi" style="margin-bottom: 0" on:click={() => {podswietl(event.id)}} in:fade|local="{{duration: 1000, easing: quintOut, delay: x*200 + 300}}">
                    <div style="width: fit-content; margin-left: auto; margin-right: auto">
                        {event.data().Tytul}
                    </div>
                </button>
            {/each}

            {#if zaznaczoneDni.length > 0}<h3 style="margin-bottom: 0">Wybrane dni:</h3>{/if}
            {#each zaznaczoneDni as dzien, x}
                {#if dniWydarzen.filter(item => item.day !== dzien.day || item.month !== dzien.month || item.year !== dzien.year).length !== dniWydarzen.length}
                    <div class="calendar-day zaznaczoneDniLi wydarzenie {dzien.today ? 'dzisiaj' : ''}">
                        <div style="width: fit-content; margin-left: auto; margin-right: auto">
                            {dzien.day}.{dzien.month+1}.{dzien.year}
                            <button on:click={async () => {dateToPass = new Date(dzien.year, dzien.month, dzien.day); AddEventModal = (await import("./DodajWydarzenieModal.svelte")).default; showAddEventModal = true}} class="dodajWydarzenieButton">Dodaj wydarzenie</button>
                            {daneWydarzen.filter(item => {const d = new Date(item.data().DataS); return d.getDate() === dzien.day && d.getMonth() === dzien.month && d.getFullYear() === dzien.year}).length} wydarze{daneWydarzen.filter(item => {const d = new Date(item.data().DataS); return d.getDate() === dzien.day && d.getMonth() === dzien.month && d.getFullYear() === dzien.year}).length === 1 ? 'nie': 'nia'} tego dnia
                            {#each daneWydarzen.filter(item => {const d = new Date(item.data().DataS); return d.getDate() === dzien.day && d.getMonth() === dzien.month && d.getFullYear() === dzien.year}) as wydarzenie}
                                <button class="pokazWydarzenieButton" data-tooltip="Zobacz szczegóły wydarzenia" data-placement="right" on:click={() => {podswietl(wydarzenie.id)}}>{wydarzenie.data().Tytul}</button>
                            {/each}
                        </div>

                    </div>
                {:else}
                    <div class="calendar-day zaznaczoneDniLi wybrane {dzien.today ? 'dzisiaj' : ''}">
                        {dzien.day}.{dzien.month+1}.{dzien.year}
                        <div style="width: fit-content; margin-left: auto; margin-right: auto">
                            <button on:click={async () => {dateToPass = new Date(dzien.year, dzien.month, dzien.day); AddEventModal = (await import("./DodajWydarzenieModal.svelte")).default; showAddEventModal = true}} class="dodajWydarzenieButton">Dodaj wydarzenie</button>
                        </div>
                    </div>
                {/if}
            {/each}

        </div>

        <div class="calendar">
            <div class="button-grid">
                <button class="change-button" on:click={() => {poprzedniMiesiac()}}><i class="fa-solid fa-chevron-left"></i></button>
                <h1 class="calendar-month">{nazwyMiesiacy[month]}&nbsp;{year}</h1>
                <button class="change-button" on:click={() => {nastepnyMiesiac()}}><i class="fa-solid fa-chevron-right"></i></button>
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
    </div>
    <br>
    <div>
        <button class="refresh-button-wydarzenia" data-tooltip="Odśwież" data-placement="right"
                on:click={async () => {
                    buttonEl1.classList.add("spin");
                    await getWydarzenia()
                }}>
            <svg bind:this={buttonEl1} class="reload" on:animationend={() => {
                if (!eventsLoading)
                    {buttonEl1.classList.remove("spin");
                } else {
                    buttonEl1.classList.remove("spin");
                    setTimeout(() => {buttonEl1.classList.add("spin");
                    },10)
                }
            }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Pro 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 FontIcons, Inc. --><path d="M142.9 142.9c62.2-62.2 162.7-62.5 225.3-1L327 183c-6.9 6.9-8.9 17.2-5.2 26.2s12.5 14.8 22.2 14.8H463.5c0 0 0 0 0 0H472c13.3 0 24-10.7 24-24V72c0-9.7-5.8-18.5-14.8-22.2s-19.3-1.7-26.2 5.2L413.4 96.6c-87.6-86.5-228.7-86.2-315.8 1C73.2 122 55.6 150.7 44.8 181.4c-5.9 16.7 2.9 34.9 19.5 40.8s34.9-2.9 40.8-19.5c7.7-21.8 20.2-42.3 37.8-59.8zM16 312v7.6 .7V440c0 9.7 5.8 18.5 14.8 22.2s19.3 1.7 26.2-5.2l41.6-41.6c87.6 86.5 228.7 86.2 315.8-1c24.4-24.4 42.1-53.1 52.9-83.7c5.9-16.7-2.9-34.9-19.5-40.8s-34.9 2.9-40.8 19.5c-7.7 21.8-20.2 42.3-37.8 59.8c-62.2 62.2-162.7 62.5-225.3 1L185 329c6.9-6.9 8.9-17.2 5.2-26.2s-12.5-14.8-22.2-14.8H48.4h-.7H40c-13.3 0-24 10.7-24 24z"/></svg>
        </button>
        <h1>Wszystkie wydarzenia:</h1>
        {#if eventsLoading}
            <Spinner/>
        {:else if daneWydarzen.length === 0}
            <p>Brak wydarzeń</p>
        {/if}
        {#each daneWydarzen as daneWydarzenia, x}
            <article id="{daneWydarzenia.id}" class="wydarzenieArticle" in:fade|local="{{duration: 1000, easing: quintOut, delay: x*200 +300}}">
                <div>

                    <h3>{daneWydarzenia.data().Tytul}</h3>
                    {#if daneWydarzenia.data().Opis}
                        <p>Opis: {daneWydarzenia.data().Opis}</p>
                    {/if}
                    <p>Data początkowa: {formatDate(daneWydarzenia.data().DataS)}</p>
                    {#if daneWydarzenia.data().DataK}
                        <p>Data końcowa: {daneWydarzenia.data().DataK}</p>
                    {/if}
                    {#if daneWydarzenia.data().Miejsce}
                        <p>Miejsce: {daneWydarzenia.data().Miejsce}</p>
                    {/if}
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
                <div class="grid">
                    <select id={daneWydarzenia.id + "t"}>
                        <option value="x">Rozpoczęcie</option>
                        <option value="0">1 min przed</option>
                        <option value="1">15 min przed</option>
                        <option value="2">1 godz przed</option>
                        <option value="3">6 godz przed</option>
                        <option value="4">1 dzień przed</option>
                        <option value="5">1 tydzień przed</option>
                    </select>
                    <button class="button" id={daneWydarzenia.id + "b"} on:click={() => {dodajPrzypomnienie(daneWydarzenia.id, daneWydarzenia.data().DataS)}}>Dodaj przypomnienie</button>
                </div>

                <button class="button" on:click={() => {deleteEvent(daneWydarzenia.id)}}>Usuń wydarzenie</button>
            </article>
        {/each}
        {#if showAddEventModal}
            <AddEventModal bind:showAddEventModal bind:grupa bind:dateToPass/>
        {/if}

    </div>
</main>
<!--suppress CssUnusedSymbol -->
<style>

    .refresh-button {
        height: fit-content;
        background-color: var(--card-background-color);
    }
    :global(.spin) {
        animation: spin 1s ease-out 1;
    }

    #reload {
        height: var(--spacing);
        color: var(--contrast);
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(540deg); }
    }

    h1, .calendar {
        margin: 0;
        padding: 0;
    }

    .calendar {
        width: 100%;
        min-width: fit-content;
        margin-left: auto;
        margin-right: auto;
        margin-top: var(--spacing);
    }

    .calendar-header, .calendar-month, .calendar-day {
        text-align: center;
        padding: 10px;
    }

    .zaznaczoneDniLi {
        border-radius: 10px;
    }

    .calendar-month {
        align-self: center;
        justify-self: center;
    }

    .calendar-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
    }

    @media (hover: hover) {
        .calendar-day:not(.zaznaczoneDniLi):hover {
            background-color: rgba(136, 136, 136, 0.38);
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
        margin: var(--spacing) 0 ;
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

    .wydarzenieArticle:not(.highlight) {
        background-color: var(--card-background-color);
        transition: background-color 3s;
    }

    :global(.highlight) {
        background-color: rgba(136, 136, 136, 0.38);
        transition: background-color 0s;
    }

    .pokazWydarzenieButton, .dodajWydarzenieButton {
        background-color: var(--contrast);
        border: none;
        color: var(--card-background-color);
        margin: 0 auto calc(var(--spacing) / 8)  auto;
        padding: calc(var(--spacing) / 8) calc(var(--spacing) / 4);
        width: 100%;
    }

    .refresh-button-wydarzenia {
        height: fit-content;
        background-color: var(--card-background-color);
        width: fit-content;
    }

    .reload {
        height: var(--spacing);
        color: var(--contrast);
    }


</style>