export function scheduleNotification(date, title, options) {
    // Check if the Notification API is available in the browser
    if (!('Notification' in window)) {
        console.error('Ta przeglądarka nie obsługuje powiadomień');
        return;
    }

    // Check if the user has granted permission for notifications
    if (Notification.permission !== 'granted') {
        Notification.requestPermission().then(permission => {
            if (permission !== 'granted') {
                console.warn('Prośba o pozwolenie na powiadomienia została odrzucona');
                return;
            }
            createNotification();
        });
    } else {
        createNotification();
    }

    function createNotification() {
        // Calculate the time remaining until the scheduled date
        const now = new Date();
        const timeRemaining = date - now;


        if (timeRemaining <= 0) {
            console.error('Nieprawidłowa data');
            return;
        }

        // Schedule the notification
        setTimeout(() => {
            const notification = new Notification(title, options);
            // remove from local storage
            const notifications = loadNotifications();
            const index = notifications.findIndex(notification => notification.date === date, notification.title === title, notification.options === options);
            notifications.splice(index, 1);
            localStorage.setItem('notifications', JSON.stringify(notifications));
        }, timeRemaining);
    }
}

function loadNotifications() {
    let notifications = localStorage.getItem('notifications');
    if (notifications === null) {
        return [];
    } else {
        notifications = JSON.parse(notifications);
        const now = new Date();
        let pastNotifications = notifications.filter(notification => notification.date < now - 1000);
        pastNotifications.forEach(notification => {
            const timePassed = now.getTime() - notification.date;

            const seconds = Math.floor(timePassed / 1000);
            const minutes = Math.floor(seconds / 60);
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);

            const timePastStr = ` ${days !== 0 ? days + "d " : ""}${hours % 24 !== 0 || days !== 0 ? hours + "h " : ""}${minutes % 60 !== 0 || hours % 24 !== 0 || days !== 0 ? minutes + "m " : "" }${seconds % 60 !== 0 || minutes % 60 !== 0 || hours % 24 !== 0 || days !== 0 ? seconds + "s" : ""} temu`;

            const index = notifications.findIndex(notification1 => notification1.date === notification.date && notification1.title === notification.title && notification1.options === notification.options);
            notifications.splice(index, 1);
            localStorage.setItem('notifications', JSON.stringify(notifications));

            addNotification(new Date().setSeconds(new Date().getSeconds() + 1), "Stare przypomnienie: "+ notification.title + timePastStr, notification.options)
        });
        return notifications.filter(notification => notification.date >= now - 1000);
    }
}

export async function loadAndSetNotifications() {
    const notifications = loadNotifications();
    notifications.forEach(notification => {
        scheduleNotification(notification.date, notification.title, notification.options);
    });
}

export function addNotification(date, title, options) {
    if (Notification.permission !== 'granted') {
        Notification.requestPermission().then(permission => {
            if (permission !== 'granted') {
                console.warn('Prośba o pozwolenie na powiadomienia została odrzucona');
            }
        });
    }


    const notifications = loadNotifications();
    notifications.push({date, title, options});
    localStorage.setItem('notifications', JSON.stringify(notifications));
    scheduleNotification(date, "Przypomnienie: " + title, options);
}
