import firebase
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
   print(db.collection("Wydarzenia").get())