<script lang="ts">
	import '../app.css';
	import { Toaster } from 'svelte-5-french-toast';
</script>

<Toaster />

<main class="mx-auto max-w-7xl rounded-sm">
	<slot />
</main>
