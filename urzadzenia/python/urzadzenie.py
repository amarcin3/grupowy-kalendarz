import datetime
import time
import firebase
from InquirerPy import prompt

if __name__ == '__main__':
    config = {
        "apiKey": "AIzaSyD6-UzUyfdk8YXxlncrYTRmdz1FudYs26Y",
        "authDomain": "grupowy-kalendarz.firebaseapp.com",
        "projectId": "grupowy-kalendarz",
        "storageBucket": "grupowy-kalendarz.appspot.com",
        "messagingSenderId": "257707037636",
        "appId": "1:257707037636:web:beb7c0031c3d9d64b40a91",
        "databaseURL": ""
    }
    app = firebase.initialize_app(config)
    db = app.firestore()

    Token = "fDsmheJNUDu73zqoXIv8"
    userUid = ""
    events = []
    '''
    print(db.collection("Users").get())
    lista_uzytkownikow = db.collection("Users").list_of_documents()
    for uzytkownik in lista_uzytkownikow:
       print(db.collection("Users").document(uzytkownik).get(field_paths=['Imie', 'Nazwisko']))
    '''


    def getUrzadzenieData():
        global userUid
        dane_urzadenia = db.collection("Urzadzenia").document(Token).get()
        print(dane_urzadenia['Nazwa'] + " " + dane_urzadenia['Opis'])
        userUid = dane_urzadenia['Uid']


    def getUserData():
        global userUid
        getUrzadzenieData()
        dane_uzytkownika = db.collection("Users").document(userUid).get()
        print(dane_uzytkownika['Imie'] + " " + dane_uzytkownika['Nazwisko'])


    def getUserEvents():
        global userUid
        global events
        getUrzadzenieData()
        events = db.collection("Wydarzenia").where("IdOsob", "array_contains", userUid).get()


    getUserData()
    getUserEvents()
    nazwy_wydarzen = []
    for indeks, wydarzenie in enumerate(events):
        tytul = ""
        for key, value in wydarzenie.items():
            if 'Tytul' in value:
                nazwy_wydarzen.append(str(indeks + 1) + "). " + value['Tytul'])

    if len(nazwy_wydarzen) == 0:
        print("Brak wydarzeń")
        exit(0)

    questions = [
        {"type": "checkbox",
         "message": "Wybierz wydarzenia, na które chcesz reagować",
         "choices": nazwy_wydarzen},
    ]
    result = prompt(questions)

    selectedEvents = []
    for event in result[0]:
        selectedEvents.append(int(event.split(")")[0]) - 1)

    fullSelectedEvents = []

    for event in selectedEvents:
        for key, value in events[event].items():
            if 'DataS' in value:
                if datetime.datetime.fromisoformat(value['DataS']) > datetime.datetime.now():
                    print("Dodano: " + value['Tytul'])
                    fullSelectedEvents.append(events[event])
                else:
                    print(value['Tytul'] + " - Wydarzenie już się odbyło")

    def wydarzenie(dataS, dataK, tytul, opis, idOsob):
        # Tutaj wpisz kod, który ma się wykonać, gdy nadejdzie wydarzenie
        print("Wydarzenie: " + tytul)


    while len(fullSelectedEvents) > 0:
        for event in fullSelectedEvents:
            for key, value in event.items():
                if 'DataS' in value:
                    if datetime.datetime.fromisoformat(value['DataS']) < datetime.datetime.now():
                        dataS = value['DataS']
                        dataK = value['DataK']
                        tytul = value['Tytul']
                        opis = value['Opis']
                        idOsob = value['IdOsob']

                        fullSelectedEvents.remove(event)
                        wydarzenie(dataS, dataK, tytul, opis, idOsob)
        time.sleep(1)
