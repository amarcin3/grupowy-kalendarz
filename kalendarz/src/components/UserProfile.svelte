<script>
    import {signOut} from "firebase/auth";
    import {doc, getDoc} from "firebase/firestore";
    import {getDownloadURL, ref} from "firebase/storage";
    import Spinner from "./Spinner.svelte";
    import {getImage} from "../lib/cacheUtilities.js";
    document.title = "Profil użytkownika";

    let user = {
        name: "",
        email: "",
        profilePicture: "",
        additionalInfo: ""
    }

    export let loggedIn = false;
    export let auth;
    export let db;
    export let storage;

    let dataLoading = true;
    let showImageModal = false;
    let showReAuthModal = false;
    let pictureLoading = true;
    let imgUrl = "";

    let ChangeImageModal = null;
    let ReAuthModal = null;
    let usage = "";


    function logout(){
        sessionStorage.removeItem("profilePictureUrl");
        /*sessionStorage.removeItem("CompanyPictureUrl");
        sessionStorage.removeItem("userData");*/
        signOut(auth).catch((error) => {
            console.log(error);
        });
    }
    let whereToSave;

    async function getData(){
        dataLoading = true;
        const cachedUserData = sessionStorage.getItem("userData");
        if (cachedUserData){
            const data = JSON.parse(cachedUserData);
            user.name = data.firstName + " " + data.lastName;
            user.email = data.email;
            document.title = user.name + " - Profil użytkownika";
            dataLoading = false;
        } else {
            const docRef = doc(db, "users", auth.currentUser.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                user.name = data.firstName + " " + data.lastName;
                user.email = data.email;
                document.title = user.name + " - Profil użytkownika";
                dataLoading = false;
            }
        }

    }

    function downloadProfilePicture(cache = true) {
        getImage(null, "profilePictureUrl", function(img) {
            if (img.status === "No url provided") {
                const userProfileRef = ref(storage, "users/" + auth.currentUser.uid + "/profile.png");
                getDownloadURL(ref(storage, userProfileRef)).then((url) => {
                    getImage(url, "profilePictureUrl", function(img) {
                        imgUrl = img.img;
                        pictureLoading = false;
                    }, cache);
                }).catch((error) => {
                    if (error.code === 'storage/object-not-found') {
                        getDownloadURL(ref(storage, ref(storage, 'default.png'))).then((url) => {
                            getImage(url, "profilePictureUrl", function(img) {
                                imgUrl = img.img;
                                pictureLoading = false;
                            }, cache);
                        }).catch((error) => {
                            console.log(error);
                        });
                    } else {
                        console.log(error);
                    }
                });
            } else {
                imgUrl = img.img;
                pictureLoading = false;
            }
        }, cache);
    }

    $: {
        if (loggedIn) {
            getData();
            downloadProfilePicture();
            whereToSave = "users/" + auth.currentUser.uid + "/";
        }
    }

    window.addEventListener('saved', () => {
        pictureLoading = true;
        downloadProfilePicture(false);
    });
    let style = "user";
</script>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.3.0/css/all.min.css" crossorigin="anonymous" />

<main class="container" style="padding-top: 0">
    <article>
        <div class="user-profile">
            <div class="top-highlight">
                <div id="picture-container">
                    {#if pictureLoading}
                        <div class="profile-picture">
                            <Spinner/>
                        </div>
                    {:else}
                        <img src={imgUrl} alt="" class="profile-picture" />
                        <button class="edit-picture-button" on:click={async () => {ChangeImageModal = (await import ("./ChangeImageModal.svelte")).default; showImageModal = true}} on:cropperClose={() => {showImageModal = false}}><i class="fas fa-pen"></i></button>
                    {/if}
                    {#if showImageModal}
                        <ChangeImageModal bind:showImageModal bind:style bind:whereToSave/>
                    {/if}
                </div>
                <div class="user-info">
                    {#if dataLoading}
                        <div>
                            <Spinner/>
                        </div>
                    {:else}
                        <div>
                            <h1>{user.name}</h1>
                            <p>Email: {user.email}</p>
                        </div>
                    {/if}
                </div>
            </div>
            <div class="user-additional-info">
                <p>{user.additionalInfo}</p>
            </div>
        </div>
        <button on:click={logout}>Wyloguj</button>
        <button on:click={async () => {ReAuthModal = (await import ("./ReAuthModal.svelte")).default; usage = "changePassword"; showReAuthModal = true}}>Zmień hasło</button>
        <button on:click={async () => {ReAuthModal = (await import ("./ReAuthModal.svelte")).default; usage = "deleteAccount"; showReAuthModal = true}}>Usuń konto</button>
        {#if showReAuthModal}
            <ReAuthModal bind:showReAuthModal bind:usage/>
        {/if}
    </article>
</main>

<style>

    .top-highlight {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .profile-picture {
        width: 200px;
        height: 200px;
        border-radius: 50%;
    }

    .user-info {
        display: flex;
        flex-direction: column;
        align-items: center;
        position: relative;
        width: 100%;
        height: 100%;
        margin-bottom: 20px;
    }

    h1 {
        font-size: 2em;
        margin-bottom: 10px;
        text-align: center;
    }

    p {
        text-align: center;
        font-size: 1.2em;
    }

    .user-additional-info {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        padding: 20px;
        margin-top: 1.67em;
        width: 80%;
    }

    #picture-container {
        position: relative;
        height: 200px;
    }

    .edit-picture-button {
        position: absolute;
        display: flex;
        justify-content: center;
        align-items: center;
        bottom: 0;
        right: 0;
        border-radius: 50%;
        height: 35px;
        width: 35px;
        font-size: 0.8em;
        cursor: pointer;
        padding: 15px;
        margin: 0;
    }
</style>
