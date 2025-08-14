<script lang="ts">
	export let isOpen: boolean;
	export let onClose: () => void;
	export let title: string;
	export let maxWidth = 'max-w-2xl';

	function handleKeyDown(e: any) {
		// Close on Enter or Space (standard keyboard interaction)
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			onClose();
		}
	}
</script>

{#if isOpen}
	<div class="fixed inset-0 z-50 overflow-y-auto">
		<div class="flex min-h-screen items-center justify-center p-4">
			<div
				role="button"
				tabindex="0"
				class="bg-opacity-50 fixed inset-0 bg-black transition-opacity"
				on:click={onClose}
				on:keydown={handleKeyDown}
				aria-label="Close modal"
			></div>

			<!-- <div class="bg-opacity-50 fixed inset-0 bg-black transition-opacity" on:click={onClose}></div> -->
			<div
				class={`relative rounded-lg bg-white shadow-xl ${maxWidth} max-h-[90vh] w-full overflow-hidden`}
			>
				<div class="flex items-center justify-between border-b border-gray-200 p-6">
					<h3 class="text-lg font-semibold text-gray-900">{title}</h3>
					<button on:click={onClose} class="rounded-lg p-2 transition-colors hover:bg-gray-100">
						<!-- X (Close) Icon -->
						<svg
							class="h-5 w-5 text-gray-400"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>
				<div class="max-h-[calc(90vh-80px)] overflow-y-auto">
					<slot />
				</div>
			</div>
		</div>
	</div>
{/if}
