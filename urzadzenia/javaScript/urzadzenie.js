import {getApp, getApps, initializeApp} from "firebase/app";
import {collection, getDocs, getFirestore, query, where} from "firebase/firestore";
import inquirer from "enquirer";

export const firebaseConfig = {
    apiKey: "AIzaSyD6-UzUyfdk8YXxlncrYTRmdz1FudYs26Y",
    authDomain: "grupowy-kalendarz.firebaseapp.com",
    projectId: "grupowy-kalendarz",
    storageBucket: "grupowy-kalendarz.appspot.com",
    messagingSenderId: "257707037636",
    appId: "1:257707037636:web:beb7c0031c3d9d64b40a91"
};

// Wpisz własny token
const Token = "";
//

let userUid;
let events = [];
let app
if (getApps().length === 0) app = initializeApp(firebaseConfig);
else app = getApp();
const db = getFirestore(app);

async function getUserData(uid){
    await getDocs(query(collection(db, "Users"), where("__name__", "==", uid))).then((doc) => {
        doc.forEach((doc) => {
            console.log(doc.data().Imie + " " + doc.data().Nazwisko);
            console.log(doc.data().Email);

        });
    });
}
async function getUrzadzenieData() {
    await getDocs(query(collection(db, "Urzadzenia"), where("__name__", "==", Token))).then( async(doc) => {
        if (doc.empty) {
            console.log("Niepoprawny Token");
            return
        }
        doc.forEach((doc) => {
            console.log(doc.data().Nazwa);
            console.log(doc.data().Opis);
            userUid = doc.data().Uid;

        });
        await getUserData(userUid);
    });
}
async function checkEvents() {
    console.log(userUid)
    await getDocs(query(collection(db, "Wydarzenia"), where("IdOsob", "array-contains", userUid))).then((doc) => {
        doc.forEach((doc) => {
            events.push(doc.data());
        });
    });
}
async function setReminder(event) {
    const now = new Date();
    const eventDate = new Date(event.DataS);
    const timeDifference = eventDate.getTime() - now.getTime();

    if (timeDifference < 0) {
        console.log(event.Tytul + " - Wydarzenie już się odbyło");
        return;
    }
    console.log(event.Tytul + " - Wydarzenie za " + Math.floor(timeDifference/1000) + " sekund");

    setTimeout(() => {
        Wydarzenie(event);
    }, timeDifference);
}
getUrzadzenieData().then(() => {
    if (userUid){
        checkEvents().then(() => {
            const options = events.map((event, index) => {
                return index+1 + "). " + event.Tytul;
            });

            inquirer.prompt([{

                type: 'multiselect',
                name: 'events',
                message: 'Wybierz wydarzenia, na które chcesz reagować',
                choices: options

            }]).then((answers) => {
                const selectedEvents = answers.events.map((event) => {
                    return parseInt(event.split(")")[0])-1;
                });
                selectedEvents.forEach((event) => {
                    setReminder(events[event]);
                });

            });
        });
    }
});


function Wydarzenie(event){
    /* Tutaj wpisz kod, który ma się wykonać, gdy nadejdzie wydarzenie */

    // console.log("Wydarzenie: " + event.Tytul);

}