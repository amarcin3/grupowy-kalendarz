<script>
  import router from "page";
  import {getApp, getApps, initializeApp} from "firebase/app";
  import {firebaseConfig} from "./lib/firebaseConfig.js";
  import {getAuth, onAuthStateChanged} from "firebase/auth";
  import {getFirestore} from "firebase/firestore";
  import NavBar from "./components/NavBar.svelte";
  import {getStorage} from "firebase/storage";

  let page; // For page routing
  let currentRoute = "/";

  let isLoggedIn = false;
  let checkedLoggedIn = false;

  let showNavBarUserInfo = false;

  // Pages that require being logged in
  const protectedRoutes = ["/konto"];
  // Pages that don't allow being logged in
  const noLoginRoutes = ["/zaloguj", "/zarejestruj"];

  $: {
    if (protectedRoutes.includes(currentRoute) && !isLoggedIn && checkedLoggedIn) {
      /*sessionStorage.removeItem("profilePictureUrl");
      sessionStorage.removeItem("CompanyPictureUrl");
      sessionStorage.removeItem("userData");*/
      router.redirect("/zaloguj");
    }
  }

  $: {
    if (noLoginRoutes.includes(currentRoute) && isLoggedIn && checkedLoggedIn) {
      router.redirect("/konto");
    }
  }

  const components = {
    "/": () => import("./components/Home.svelte"),
    "/zaloguj": () => import("./components/Login.svelte"),
    "/zarejestruj": () => import("./components/Register.svelte"),
    "/konto": () => import("./components/UserProfile.svelte"),
    "*": () => import("./components/404.svelte")
  };

  Object.entries(components).forEach(([route, componentFn]) => {
    router(route, async () => {
      showNavBarUserInfo = route !== "/konto";
      currentRoute = route;
      if (protectedRoutes.includes(route) && !isLoggedIn && checkedLoggedIn) {
        router.redirect("/zaloguj");
        return;
      }

      if (noLoginRoutes.includes(route) && isLoggedIn && checkedLoggedIn) {
        router.redirect("/zaloguj");
        return;
      }

      const componentModule = await componentFn();
      page = componentModule.default;
    });
  });

  router.start();

  // Initialize Firebase
  let app
  if (getApps().length === 0) app = initializeApp(firebaseConfig);
  else app = getApp();
  const auth = getAuth(app);
  const db = getFirestore(app);
  const storage = getStorage(app);

  onAuthStateChanged(auth, (user) => {
    isLoggedIn = !!user;
    checkedLoggedIn = true;
  });


</script>
<NavBar showInfo={showNavBarUserInfo} loggedIn={isLoggedIn} auth={auth} db={db} storage={storage} />
<svelte:component this={page} loggedIn={isLoggedIn} auth={auth} db={db} storage={storage} />