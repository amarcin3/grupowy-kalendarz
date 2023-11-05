<script>

    let notifications = [];

    function getNotifications() {
        let notificationsS = localStorage.getItem('notifications');
        if (notificationsS === null) {
            notifications =  [];
        } else {
            notifications = JSON.parse(notificationsS);
        }
    }
    getNotifications();

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

<main class="container">
    {#if notifications.length === 0}
        <h1>Brak ustawionych powiadomień</h1>
    {/if}
    <p>Przypomnienia wyświetlą się tylko gdy karta jest otwarta</p>

    {#each notifications as notification}
        <article>
            <hgroup>
                <h2>{notification.title}</h2>
                <h3>{formatDate(notification.date)}</h3>
                {#if notification.options.body}
                    <h3>{notification.options.body}</h3>
                {:else}
                    <h3>Brak opisu</h3>
                {/if}
            </hgroup>
            <button on:click={() => {
                let index = notifications.indexOf(notification);
                notifications.splice(index, 1);
                localStorage.setItem('notifications', JSON.stringify(notifications));
                getNotifications();
            }}>Usuń</button>
        </article>
    {/each}
</main>

<style>
    button {
        background-color: #880000;
        color: #ffffff;
        border: none;
        padding: 10px;
        border-radius: 5px;
        cursor: pointer;
    }
</style>