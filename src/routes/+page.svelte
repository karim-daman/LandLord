<script>
	import { initializeAllStores } from '$lib/stores';
	import toast from 'svelte-5-french-toast';
	import { onMount } from 'svelte';

	onMount(async () => {
		toast.promise(
			initializeAllStores().then((res) => {
				if (!res.success) throw new Error(res.message); // Convert to rejection
				return res.message; // Success case
			}),
			{
				loading: 'Initializing stores...',
				success: (message) => message,
				error: (err) => err.message
			},
			{
				position: 'bottom-right'
			}
		);
	});
</script>

<p class="rounded-sm border p-0.5 font-mono">LandLoard</p>
