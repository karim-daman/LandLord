<script>
	import { initializeAllStores } from '$lib/stores';
	import toast from 'svelte-5-french-toast';
	import { onMount } from 'svelte';

	onMount(async () => {
		initializeAllStores();

		toast.success('Welcome Back!', {
			position: 'bottom-right'
		});
	});
</script>

<p class="rounded-sm border p-0.5 font-mono">LandLoard</p>
