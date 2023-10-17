<script>
    import {signOut} from "firebase/auth";
    import {collection, doc, getDoc, getDocs, query} from "firebase/firestore";

    export let loggedIn = false;
    export let auth;
    export let db;
    export let storage;

    let dataLoading = true;
    let grupy = [];



    $: if(loggedIn){
        getGrupy();
    }

    async function getGrupy(){
        const q = query(collection(db, "Users", auth.currentUser.uid, "Grupy"));

        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            grupy.push({Id: doc.id, data: doc.data()});
        });
        grupy = grupy.sort((a, b) => a.data.Nazwa.localeCompare(b.data.Nazwa));
    }
</script>

{#each grupy as grupa}
    <section>
        <h2>{grupa.data.Nazwa}</h2>
        <p>{grupa.Id}</p>
        <p>{grupa.data.IdWGrupie}</p>
    </section>

{/each}