<script>
    import Cropper from "cropperjs";
    import 'cropperjs/dist/cropper.css';
    import {getStorage, ref, uploadBytes} from "firebase/storage";
    import {fade, fly} from "svelte/transition";
    import {quintOut} from "svelte/easing";
    import {getApp} from "firebase/app";
    import Spinner from "./Spinner.svelte";


    let app = getApp();
    const storage = getStorage(app);
    export let showImageModal;
    export let style;
    export let whereToSave;

    let loading = false;
    function closeModal(saved = false) {
        if (saved === true) {
            dispatchEvent(new CustomEvent("saved"));
        }
        loading = false;
        showImageModal = false;
    }

    let cropper;
    function initCropper() {
        if(document.getElementById('image') === null) {
            setTimeout(initCropper, 100);
        }
        else if(document.getElementById('image') !== null) {
            if (cropper){
                cropper.destroy();
            }
            cropper = new Cropper(document.getElementById('image'), {
                initialAspectRatio: 1,
                aspectRatio: style === "user" ? 1 : NaN,
                preview: '#preview',
                viewMode: 1,
                dragMode: 'move',
                autoCropArea: 1,
                guides: true,
                center: true,
                responsive: true,
                restore: true,
                highlight: true,
                rotatable: false,
                scalable: false,
                background: false
            });
            return cropper;
        }
    }

    function uploadFile(file) {
        const storageRef = ref(storage, whereToSave + file.name);
        uploadBytes(storageRef, file).then(() => {
            closeModal(true);
        });
    }

    function getAndUpload(){
        loading = true;
        if (!cropper) {
            loading = false;
            return;
        }
        const dataURL = cropper.getCroppedCanvas({fillColor: 'transparent'}).toDataURL();
        const img = new Image();
        img.src = dataURL;
        img.onload = () => {
            let px;
            style === "user" ? px = 200 : px = 500;
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            let width = img.width
            let height = img.height
            if (width > px) {
                height *= px / width
                width = px
            }
            if (height > px) {
                width *= px / height
                height = px
            }
            canvas.width = width
            canvas.height = height
            ctx.drawImage(img, 0, 0, width, height)
            const dataURL = canvas.toDataURL()
            const binaryString = window.atob(dataURL.split(',')[1]);
            const array = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                array[i] = binaryString.charCodeAt(i);
            }
            const file = new File([array], style === "user" ? "profile.png" : "logo.png", {type: "image/png"});
            uploadFile(file);
        }
    }

    let showDropZone = true;
    let imageSrc = '';
    function preventDefault(event) {
        event.preventDefault();
    }
    function handleDrop(event) {
        let file = event.dataTransfer.files[0];
        handleFile(file);
    }
    function handleFileInput(event) {
        let file = event.target.files[0];
        handleFile(file);
    }
    function handleFile(file) {
        if (!file.type.startsWith('image/')) {
            alert("Invalid file type, please select an image file");
            return;
        }
        let reader = new FileReader();
        reader.onload = (event) => {
            imageSrc = event.target.result;
            showDropZone = false;
        };
        reader.readAsDataURL(file);
        setTimeout(initCropper, 100);
    }
    function handleRemoveChange() {
        cropper.destroy();
        imageSrc = '';
        showDropZone = true;
    }

    $: if (loading) {
        if (document.getElementsByClassName('modal-overlay').length !== 0) {
            let overlays = document.getElementsByClassName('modal-overlay');
            overlays[0].style.backgroundColor = "rgba(0, 0, 0, 0.8)";
        }
    } else {
        if (document.getElementsByClassName('modal-overlay').length !== 0) {
            let overlays = document.getElementsByClassName('modal-overlay');
            overlays[0].style.backgroundColor = "rgba(0, 0, 0, 0.4)";
        }
    }
</script>

<div class="modal-overlay" class:open={showImageModal} transition:fade={{duration: 200, easing: quintOut}}>
    <div class="modal-content" class:open={showImageModal} transition:fly="{{ y: -50, duration: 400, easing: quintOut }}">
        <div>
            {#if imageSrc === ''}
                <h1>Dodaj lub zmień zdjęcie</h1>
                <input id="handSelect" type="file" on:change={handleFileInput} accept="image/*">
                <div class="drag-drop-zone" on:dragover={preventDefault} on:drop|preventDefault={handleDrop}>
                    <p>Przeciągnij zdjęcie tutaj</p>
                    <input type="file" style="display:none" on:change={handleFile} accept="image/*">
                </div>
            {:else}
                <h1>Edytuj zdjęcie</h1>
                <img id="image" src={imageSrc} alt=""/>
                <button on:click={getAndUpload} style="margin-top: var(--spacing);">Zapisz zdjęcie</button>
                <button on:click={handleRemoveChange} class="primary outline">Zmień zdjęcie</button>
            {/if}
            {#if loading}
                <div class="modal-overlay middle" style="background-color: rgba(0, 0, 0, 0.7);">
                    <Spinner/>
                </div>
            {/if}
        </div>
        <button on:click={closeModal} class="primary outline">Anuluj</button>
    </div>
</div>


<style>
    h1 {
        margin-left: var(--spacing);
    }
    .modal-overlay {
        position: fixed;
        display: flex;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        align-items: center;
        justify-content: center;
        z-index: 999;
        background-color: rgba(0, 0, 0, 0.5);
        transition: background-color 0.3s;
    }
    .modal-content {
        background-color: var(--background-color);
        padding: 1em;
        width: 90vw;
        border-radius: 15px;
        z-index: 1000;
        height: fit-content;
        max-height: calc(100vh - var(--spacing) * 2);
        overflow: auto;
    }

    .middle {
        display: flex;
        justify-content: center;
        align-items: center;
    }

    #handSelect {
        margin-left: var(--spacing);
    }
    .drag-drop-zone {
        height: 30vh;
        border: 3px dashed #ccc;
        margin: var(--spacing);
        text-align: center;
    }
    .drag-drop-zone p {
        margin: 0;
        padding: 10vh 0 0;
        font-size: 1.5em;
        color: #ccc;
    }
    img{
        width: 100%;
        height: 100%;
        max-height: 20vh;
        margin: auto auto var(--spacing);
    }
</style>
