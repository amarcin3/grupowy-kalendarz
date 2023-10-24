<script>
    import {doc, getDoc} from "firebase/firestore";
    import {getDownloadURL, ref} from "firebase/storage";
    import {fade, fly} from "svelte/transition";
    import {cubicOut} from "svelte/easing";
    import {getImage} from "../lib/cacheUtilities.js";
    import Spinner from "./Spinner.svelte";

    export let showInfo = false;
    export let loggedIn = false;

    export let auth;
    export let db;
    export let storage;

    let imgUrl = "";
    let profilePictureLoading = true;

    const cssValues = {
        "position": "sticky",
        "right": "16px",
        "min-height": "1.5rem",
        "min-width": "1.5rem",
        "height": "1.5rem",
        "width": "1.5rem",
        "margin": "0.5rem",
    }

    let user = {
        Imie: "",
        Nazwisko: "",
        profilePicture: "",
    };

    let menuOpen = false;
    let disabled = false;

    const themeSwitcher = {
        _scheme: "auto",
        menuTarget: "details[role='list']",
        buttonsTarget: "p[data-theme-switcher]",
        buttonAttribute: "data-theme-switcher",
        rootAttribute: "data-theme",
        localStorageKey: "picoPreferedColorScheme",
        init() {
            this.scheme = this.schemeFromLocalStorage;
            this.initSwitchers();
        },

        get schemeFromLocalStorage() {
            if (typeof window.localStorage !== "undefined") {
                if (window.localStorage.getItem(this.localStorageKey) !== null) {
                    return window.localStorage.getItem(this.localStorageKey);
                }
            }
            return this._scheme;
        },

        get preferredColorScheme() {
            return window.matchMedia("(prefers-color-scheme: dark)").matches
                ? "dark"
                : "light";
        },

        initSwitchers() {
            const buttons = document.querySelectorAll(this.buttonsTarget);
            buttons.forEach((button) => {
                button.addEventListener("click", event => {
                    event.preventDefault();
                    this.scheme = button.getAttribute(this.buttonAttribute);
                    document.querySelector(this.menuTarget).removeAttribute("open");
                }, false);
            });
        },

        set scheme(scheme) {
            if (scheme === "auto") {
                this.preferredColorScheme === "dark"
                    ? (this._scheme = "dark")
                    : (this._scheme = "light");
            } else if (scheme === "dark" || scheme === "light") {
                this._scheme = scheme;
            }
            this.applyScheme();
            this.schemeToLocalStorage();
        },

        get scheme() {
            return this._scheme;
        },

        applyScheme() {
            document
                .querySelector("html")
                .setAttribute(this.rootAttribute, this.scheme);
        },

        schemeToLocalStorage() {
            if (typeof window.localStorage !== "undefined") {
                window.localStorage.setItem(this.localStorageKey, this.scheme);
            }
        },
    };

    window.onload = () => {
        themeSwitcher.init();
    }
    $: if (menuOpen) {
        document.body.style.overflow = "hidden";
        setTimeout(() => {
            themeSwitcher.initSwitchers();
        }, 50)
        setTimeout(() => {
            disabled = true;
        }, 250)
    } else {
        document.body.style.overflow = "auto";
        setTimeout(() => {
            disabled = false;
        }, 250)
    }

    setTimeout(() => {
        themeSwitcher.init()
        addEventListener("resize", () => {
            if (window.innerWidth >= 576) {
                menuOpen = false;
            }
        });
    }, 100)

    async function getData(){
        const cachedUserData = sessionStorage.getItem("userData");
        if (cachedUserData){
            const data = JSON.parse(cachedUserData);
            user.Imie = data.Imie
            user.Nazwisko = data.Nazwisko;
        } else {
            const docRef = doc(db, "Users", auth.currentUser.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                user.Imie = data.Imie
                user.Nazwisko = data.Nazwisko;
                sessionStorage.setItem("userData", JSON.stringify(data));
            }
        }
    }

    function downloadProfilePicture() {
        getImage(null, "profilePictureUrl", function(img) {
            if (img.status === "No url provided") {
                const userProfileRef = ref(storage, "Users/" + auth.currentUser.uid + "/profile.png");
                getDownloadURL(ref(storage, userProfileRef)).then((url) => {
                    getImage(url, "profilePictureUrl", function(img) {
                        imgUrl = img.img;
                        profilePictureLoading = false;
                    });
                }).catch((error) => {
                    if (error.code === 'storage/object-not-found') {
                        getDownloadURL(ref(storage, ref(storage, 'default.png'))).then((url) => {
                            getImage(url, "profilePictureUrl", function(img) {
                                imgUrl = img.img;
                                profilePictureLoading = false;
                            });
                        }).catch((error) => {
                            console.log(error);
                        });
                    } else {
                        console.log(error);
                    }
                });
            } else {
                imgUrl = img.img;
                profilePictureLoading = false;
            }
        });
    }

    $:{
        if (showInfo && loggedIn){
            getData();
            downloadProfilePicture();
        }
    }

</script>


<nav class="container-fluid" id="nav-flat">
    <ul>
        <li><a href="/" class="contrast"><strong>Strona główna</strong></a></li>
        <li>
            <details role="list">
                <summary aria-haspopup="listbox" role="link" class="contrast">Motyw</summary>
                <ul role="listbox">
                    <li style="padding: 0" role="menuitem"><p style="padding: calc(var(--form-element-spacing-vertical) * 0.5) var(--form-element-spacing-horizontal); margin-bottom: 0" data-theme-switcher="auto">Automatyczny</p></li>
                    <li style="padding: 0" role="menuitem"><p style="padding: calc(var(--form-element-spacing-vertical) * 0.5) var(--form-element-spacing-horizontal); margin-bottom: 0" data-theme-switcher="light">Jasny</p></li>
                    <li style="padding: 0" role="menuitem"><p style="padding: calc(var(--form-element-spacing-vertical) * 0.5) var(--form-element-spacing-horizontal); margin-bottom: 0" data-theme-switcher="dark">Ciemny</p></li>
                </ul>
            </details>
        </li>
    </ul>
    <ul style="padding: 10px var(--nav-element-spacing-horizontal);">
        {#if loggedIn}
            <li style="padding-top: 0; padding-bottom: 0;"><a href="/grupy" class="contrast" style="line-height: var(--line-height);">Grupy</a></li>
        {/if}
        {#if showInfo && loggedIn}
            <li style="padding: 0; margin-left: var(--spacing)">
                <!--on click close menu-->
                <a style="padding: calc(var(--form-element-spacing-vertical) * 0.3) calc(var(--form-element-spacing-horizontal) * 0.3);" href="/konto" class="contrast user">
                    <ul style="margin: 0; padding: 0">
                        <li style="padding-top: 0; padding-bottom: 0; padding-left: 0"><span style="line-height: var(--line-height);">{user.Imie}&nbsp;{user.Nazwisko}</span></li>
                        <li style="padding-top: 0; padding-bottom: 0; padding-right: 0">
                            {#if profilePictureLoading}
                                <Spinner cssValues={cssValues} />
                            {:else}
                                <img src={imgUrl} alt="" class="navProfilePicture"/>
                            {/if}
                        </li>
                    </ul>
                </a>
            </li>
        {/if}
    </ul>
</nav>

<!--//////////////////////////////////////////////-->
{#if menuOpen}
<div class="modal-overlay" on:click={() => {if(disabled) {menuOpen = false}}} transition:fade|local="{{ duration: 100, easing: cubicOut}}"></div>
<aside>
    <nav class="menu" transition:fly|local="{{ x: -200, duration: 400, easing: cubicOut}}">
        <ul>
            {#if showInfo && loggedIn}
                <li>
                    <a href="/konto" class="contrast user" on:click={() => {menuOpen = false}}>
                        <span style="line-height: var(--line-height); padding-right: var(--nav-element-spacing-horizontal);"><strong>{user.Imie}&nbsp;{user.Nazwisko}</strong></span>
                        <img src={imgUrl} alt="" class="navProfilePicture"/>
                    </a>
                </li>
            {/if}
            <li>
                <strong>
                    <a href="/" class="contrast" on:click={() => {menuOpen = false}}>Strona Główna</a>
                </strong>
            </li>
            {#if loggedIn}
                <li style="padding-top: 0; padding-bottom: 0;"><a href="/grupy" class="contrast" style="line-height: var(--line-height);" on:click={() => {menuOpen = false}}>Grupy</a></li>
            {/if}
            <li>
                <details role="list">
                    <summary aria-haspopup="listbox" role="link" class="contrast">Motyw</summary>
                    <ul role="listbox">
                        <li style="padding: 0" role="menuitem"><p style="padding: calc(var(--form-element-spacing-vertical) * 0.5) var(--form-element-spacing-horizontal); margin-bottom: 0" data-theme-switcher="auto">Automatyczny</p></li>
                        <li style="padding: 0" role="menuitem"><p style="padding: calc(var(--form-element-spacing-vertical) * 0.5) var(--form-element-spacing-horizontal); margin-bottom: 0" data-theme-switcher="light">Jasny</p></li>
                        <li style="padding: 0" role="menuitem"><p style="padding: calc(var(--form-element-spacing-vertical) * 0.5) var(--form-element-spacing-horizontal); margin-bottom: 0" data-theme-switcher="dark">Ciemny</p></li>
                    </ul>
                </details>
            </li>
        </ul>
    </nav>
</aside>
{/if}
<nav class="container-fluid" id="nav-vertical">
    <ul>
        <li><a href="/" class="contrast"><strong>Strona Główna</strong></a></li>
    </ul>
    <ul>
        <li id="showNavButton" style="padding-top: 0; padding-bottom: 0">
            <input type="checkbox" id="active" {disabled} bind:checked={menuOpen}>
            <label for="active" class="menu-btn" style="margin: 0"><span></span></label>
        </li>
    </ul>
</nav>
<hr style="margin-top: 0">
<style>

    .modal-overlay {
        position: fixed;
        display: flex;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        align-items: center;
        justify-content: center;
        z-index: 99;
        background-color: rgba(0, 0, 0, 0.5);
        transition: background-color 0.3s;
    }

    #nav-flat {
        background-color: var(--background-color);
    }

    .menu {
        position: fixed;
        top: 0;
        left: 0;
        height: 100%;
        width: fit-content;
        background-color: var(--card-background-color);
        padding: 20px;
        box-shadow: var(--card-box-shadow);
        border-radius: var(--border-radius);
        z-index: 100;
    }
    .navProfilePicture {
        position: sticky;
        border-radius: 50%;
        right: 16px;
        min-height: 2.5rem;
        min-width: 2.5rem;
        height: 2.5rem;
        width: 2.5rem;
    }
    #showNavButton{
        z-index: 98;
        background-color: var(--background-color);
    }

    @media (min-width: 576px) {
        .menu {
            display: none;
        }
        #nav-vertical {
            display: none;
        }
    }
    @media (max-width: 575px) {
        #nav-flat {
            display: none;
        }
    }

    .menu-btn{
        position: relative;
        z-index: 2;
        height: 20px;
        width: 50px;
        text-align: center;
        line-height: 50px;
        border-radius: 50%;
        font-size: 20px;
        cursor: pointer;
        transition: all 0.4s ease-in-out;
    }
    .menu-btn span,
    .menu-btn:before,
    .menu-btn:after{
        content: "";
        position: absolute;
        top: calc(50% - 1px);
        left: 30%;
        width: 40%;
        border-bottom: 2px solid var(--contrast);
        transition: transform .4s cubic-bezier(0.215, 0.61, 0.355, 1);
    }
    .menu-btn:before{
        transform: translateY(-8px);
    }
    .menu-btn:after{
        transform: translateY(8px);
    }

    #active:checked + .menu-btn span {
        transform: scaleX(0);
    }
    #active:checked + .menu-btn:before {
        transform: rotate(45deg);
        border-color: var(--contrast);
    }
    #active:checked + .menu-btn:after {
        transform: rotate(-45deg);
        border-color: var(--contrast);
    }

    input[type="checkbox"]{
        display: none;
    }

    .user{
        background-color: var(--form-element-disabled-background-color);
    }

    li[role="menuitem"]:hover {
        background-color: var(--dropdown-hover-background-color);
        transition: 0.2s ease-in-out;
    }
</style>

