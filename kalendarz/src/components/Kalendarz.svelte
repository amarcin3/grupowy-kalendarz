<script>

    export let db;
    export let auth;
    export let loggedIn;
    export let storage;

    let poprzednieDni = [];
    let dni = [];
    let nastepneDni = [];
    let nazwyMiesiacy = ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
        "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"];
    let date = new Date();
    let month = date.getMonth();
    let year = date.getFullYear();
    wyswietlDni()

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
                poprzednieDni[i-2] = lastDayOfPreviousMonth;
                lastDayOfPreviousMonth--;
            }
        } else {
            poprzednieDni = [];
        }

        dni = [];
        for (let i = 1; i <= new Date(year, month + 1, 0).getDate(); i++) {
            dni.push(i);
        }

        if (new Date(year, month + 1, 0).getDay() !== 0) {
            nastepneDni = [];
            for (let i = 1; i <= 7 - new Date(year, month + 1, 0).getDay(); i++) {
                nastepneDni.push(i);
            }
        } else {
            nastepneDni = [];
        }

        let daysToAdd = (6 - (Math.ceil((poprzednieDni.length + dni.length + nastepneDni.length) / 7))) * 7;
        let startDay = (nastepneDni[nastepneDni.length - 1] ? nastepneDni[nastepneDni.length - 1] : 0) + 1;
        for (let i = startDay; i < daysToAdd + startDay; i++) {
            nastepneDni.push(i);
        }
    }
</script>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css" crossorigin="anonymous" />
<main class="container">
        <div class="calendar">
            <div class="button-grid">
                <button class="change-button" on:click={() => {poprzedniMiesiac()}}><i class="fa-solid fa-chevron-left"></i></button><h1 class="calendar-month">{nazwyMiesiacy[month]} {year}</h1><button class="change-button" on:click={() => {nastepnyMiesiac()}}><i class="fa-solid fa-chevron-right"></i></button>
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
                    <div class="calendar-day"><span class="last">{dzien}</span></div>
                {/each}
                {#each dni as dzien}
                    <div class="calendar-day">{dzien}</div>
                {/each}
                {#each nastepneDni as dzien}
                    <div class="calendar-day"><span class="next">{dzien}</span></div>
                {/each}
            </div>
        </div>
</main>

<style>
    h1, .calendar {
        margin: 0;
        padding: 0;
    }

    .calendar {
        border: 1px solid #ccc;
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

    .button-grid {
        display: grid;
        grid-template-columns: 1fr 5fr 1fr;
    }

    .calendar-header, .calendar-day {
        padding: 10px;
        border: 1px solid #ccc;
        font-weight: bold;
    }

    /* Example of different styling for the weekend days */
    .calendar-header:nth-child(6), .calendar-header:nth-child(7) {
        background-color: rgba(136, 136, 136, 0.38);
    }

    /* Example of different styling for today's date */
    .calendar-header[data-today="true"] {
        background-color: #4caf50;
        color: #fff;
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

</style>