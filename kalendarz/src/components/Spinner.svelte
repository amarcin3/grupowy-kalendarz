<script>
    import {onMount} from "svelte";

    export let cssValues = {}
    let skchase = null
    onMount(() => skchase = document.querySelector('.sk-chase'))

    $: if (skchase){
        for (let [key, value] of Object.entries(cssValues)) {
            skchase.style[key] = value;
        }
    }

</script>

<div class="sk-chase">
    <div class="sk-chase-dot"></div>
    <div class="sk-chase-dot"></div>
    <div class="sk-chase-dot"></div>
    <div class="sk-chase-dot"></div>
    <div class="sk-chase-dot"></div>
    <div class="sk-chase-dot"></div>
</div>

<style>

    :root {
        --dot-delay: .1s;
    }

    .sk-chase {
        position: relative;
        height: 60px;
        width: 60px;
        animation: sk-chase 1.5s infinite linear both;
        margin: 1.34em auto 1.34em;
    }

    .sk-chase-dot {
        width: 100%;
        height: 100%;
        position: absolute;
        left: 0;
        top: 0;
        animation: sk-chase-dot 1.5s infinite ease-in-out both;
    }

    .sk-chase-dot:before {
        content: '';
        display: block;
        width: 25%;
        height: 25%;
        background-color: var(--contrast);
        border-radius: 100%;
        animation: sk-chase-dot-before 1.5s infinite ease-in-out both;
    }


    .sk-chase-dot:nth-child(1) { animation-delay: calc(var(--dot-delay) * 6); }
    .sk-chase-dot:nth-child(2) { animation-delay: calc(var(--dot-delay) * 5); }
    .sk-chase-dot:nth-child(3) { animation-delay: calc(var(--dot-delay) * 4); }
    .sk-chase-dot:nth-child(4) { animation-delay: calc(var(--dot-delay) * 3); }
    .sk-chase-dot:nth-child(5) { animation-delay: calc(var(--dot-delay) * 2); }
    .sk-chase-dot:nth-child(6) { animation-delay: calc(var(--dot-delay) * 1); }
    .sk-chase-dot:nth-child(1):before { animation-delay: calc(var(--dot-delay) * 6); }
    .sk-chase-dot:nth-child(2):before { animation-delay: calc(var(--dot-delay) * 5); }
    .sk-chase-dot:nth-child(3):before { animation-delay: calc(var(--dot-delay) * 4); }
    .sk-chase-dot:nth-child(4):before { animation-delay: calc(var(--dot-delay) * 3); }
    .sk-chase-dot:nth-child(5):before { animation-delay: calc(var(--dot-delay) * 2); }
    .sk-chase-dot:nth-child(6):before { animation-delay: calc(var(--dot-delay) * 1); }

    @keyframes sk-chase {
        100% { transform: rotate(360deg); }
    }

    @keyframes sk-chase-dot {
        80%, 100% { transform: rotate(360deg); }
    }

    @keyframes sk-chase-dot-before {
        50% {
            transform: scale(0.4);
        } 100%, 0% {
              transform: scale(1);
          }
    }
</style>