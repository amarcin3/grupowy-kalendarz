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
   
   Token = "MZgK1Q25kDoggHrg61Ke"
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
      userUid = dane_urzadenia['Uid']
   
   def getUserData():
      global userUid
      getUrzadzenieData()
      dane_uzytkownika = db.collection("Users").document(userUid).get()
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
            nazwy_wydarzen.append(str(indeks+1) + "). " + value['Tytul'])

   questions = [
      {"type": "checkbox",
      "message": "Wybierz wydarzenia, na które chcesz reagować",
      "choices": nazwy_wydarzen},
    ]
   result = prompt(questions)

   selectedEvents = []
   for event in result[0]:
      selectedEvents.append(int(event.split(")")[0])-1)

   for event in selectedEvents:
      print(events[event])