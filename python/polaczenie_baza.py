# Import Firebase REST API library
import firebase

# Firebase configuration
config = {
   "apiKey": "apiKey",
   "authDomain": "projectId.firebaseapp.com",
   "databaseURL": "https://databaseName.firebaseio.com",
   "projectId": "projectId",
   "storageBucket": "projectId.appspot.com",
   "messagingSenderId": "messagingSenderId",
   "appId": "appId"
}

# Instantiates a Firebase app
app = firebase.initialize_app(config)


# Firebase Authentication
auth = app.auth()

# Create new user and sign in
auth.create_user_with_email_and_password(email, password)
user = auth.sign_in_with_email_and_password(email, password)


# Firebase Realtime Database
db = app.database()

# Data to save in database
data = {
   "name": "Robert Downey Jr.",
   "email": user.get('email')
}

# Store data to Firebase Database
db.child("users").push(data, user.get('idToken'))


# Firebase Storage
storage = app.storage()

# File to store in storage
file_path = 'static/img/example.png'

# Store file to Firebase Storage
storage.child(user.get('email')).child('uploaded-picture.png').put(file_path, user.get('idToken'))