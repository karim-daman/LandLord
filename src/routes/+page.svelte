<script>
	import { initializeAllStores } from '$lib/stores';
	import { onMount } from 'svelte';

	onMount(async () => {
		initializeAllStores();
	});
</script>
