<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { browser } from '$app/environment';
	import { fade } from 'svelte/transition';

	// Type definitions
	type Position = 'cursor' | 'top' | 'bottom' | 'left' | 'right';

	interface ModalPosition {
		x: number;
		y: number;
	}

	// Props with better defaults
	export let width = 400;
	export let height = 500;
	export let offset = 10;
	export let className = '';
	export let modalClass = '';
	export let delay = 0;
	export let disabled = false;
	export let position: Position = 'cursor';
	export let followCursor = true;
	export let boundary = true;

	const dispatch = createEventDispatcher<{
		show: void;
		hide: void;
	}>();

	// State
	let showModal = false;
	let modalPosition: ModalPosition = { x: 0, y: 0 };
	let targetElement: HTMLDivElement;
	let showTimeout: number | undefined;
	let isHovering = false;

	// Calculate modal position
	function calculateModalPosition(event: MouseEvent): ModalPosition {
		if (!browser) return { x: 0, y: 0 };

		if (position === 'cursor') {
			let x = event.clientX + offset;
			let y = event.clientY + offset;

			// Boundary detection
			if (boundary) {
				const viewportWidth = window.innerWidth;
				const viewportHeight = window.innerHeight;

				// Adjust horizontal position
				if (x + width > viewportWidth) {
					x = event.clientX - width - offset;
				}

				// Adjust vertical position
				if (y + height > viewportHeight) {
					y = event.clientY - height - offset;
				}

				// Ensure minimum distance from edges
				x = Math.max(offset, Math.min(x, viewportWidth - width - offset));
				y = Math.max(offset, Math.min(y, viewportHeight - height - offset));
			}

			return { x, y };
		}

		// Position relative to target element
		if (!targetElement) return { x: 0, y: 0 };

		const rect = targetElement.getBoundingClientRect();
		let x = 0;
		let y = 0;

		switch (position) {
			case 'top':
				x = rect.left + rect.width / 2 - width / 2;
				y = rect.top - height - offset;
				break;
			case 'bottom':
				x = rect.left + rect.width / 2 - width / 2;
				y = rect.bottom + offset;
				break;
			case 'left':
				x = rect.left - width - offset;
				y = rect.top + rect.height / 2 - height / 2;
				break;
			case 'right':
				x = rect.right + offset;
				y = rect.top + rect.height / 2 - height / 2;
				break;
		}

		// Apply boundary detection for fixed positions
		if (boundary) {
			const viewportWidth = window.innerWidth;
			const viewportHeight = window.innerHeight;

			x = Math.max(offset, Math.min(x, viewportWidth - width - offset));
			y = Math.max(offset, Math.min(y, viewportHeight - height - offset));
		}

		return { x, y };
	}

	// Event handlers using Svelte's event system
	function handleMouseEnter(event: MouseEvent) {
		if (disabled) return;

		isHovering = true;
		clearShowTimeout();

		if (delay > 0) {
			showTimeout = window.setTimeout(() => {
				if (isHovering) {
					showModal = true;
					modalPosition = calculateModalPosition(event);
					dispatch('show');
				}
			}, delay);
		} else {
			showModal = true;
			modalPosition = calculateModalPosition(event);
			dispatch('show');
		}
	}

	function handleMouseLeave() {
		isHovering = false;
		clearShowTimeout();
		showModal = false;
		dispatch('hide');
	}

	function handleMouseMove(event: MouseEvent) {
		if (!showModal || !followCursor || position !== 'cursor') return;
		modalPosition = calculateModalPosition(event);
	}

	function handleKeyDown(event: KeyboardEvent) {
		// Handle Enter and Space for accessibility
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			// Simulate mouse enter for keyboard users
			const rect = targetElement.getBoundingClientRect();
			const syntheticEvent = {
				clientX: rect.left + rect.width / 2,
				clientY: rect.top + rect.height / 2
			} as MouseEvent;
			handleMouseEnter(syntheticEvent);
		} else if (event.key === 'Escape') {
			handleMouseLeave();
		}
	}

	function handleFocusOut() {
		// Hide modal when focus leaves the target
		handleMouseLeave();
	}

	function clearShowTimeout() {
		if (showTimeout) {
			clearTimeout(showTimeout);
			showTimeout = undefined;
		}
	}

	// Reactive statements
	$: cssVars = `--modal-width: ${width}px; --modal-height: ${height}px;`;

	// Cleanup timeout on component destroy
	$: if (!browser && showTimeout) {
		clearShowTimeout();
	}
</script>

<!-- Target element with Svelte event handlers -->
<div
	bind:this={targetElement}
	class="hover-target {className}"
	role="button"
	tabindex="0"
	aria-describedby={showModal ? 'hover-modal' : undefined}
	on:mouseenter={handleMouseEnter}
	on:mouseleave={handleMouseLeave}
	on:mousemove={position === 'cursor' && followCursor ? handleMouseMove : undefined}
	on:keydown={handleKeyDown}
	on:focusout={handleFocusOut}
>
	<slot name="target" />
</div>

<!-- Modal portal -->
{#if showModal && browser}
	<div
		id="hover-modal"
		class="modal-overlay"
		style="--modal-x: {modalPosition.x}px; --modal-y: {modalPosition.y}px; {cssVars}"
		in:fade={{ duration: 200 }}
		out:fade={{ duration: 150 }}
		role="tooltip"
		aria-live="polite"
	>
		<div class="modal-container {modalClass}">
			<div class="modal-content">
				<slot name="content" {showModal} />
			</div>
		</div>
	</div>
{/if}

<style>
	.hover-target {
		cursor: pointer;
		display: inline-block;
	}

	.modal-overlay {
		position: fixed;
		top: var(--modal-y);
		left: var(--modal-x);
		width: var(--modal-width);
		height: var(--modal-height);
		z-index: 9999;
		pointer-events: none;
	}

	.modal-container {
		width: 100%;
		height: 100%;
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		box-shadow:
			0 20px 25px -5px rgb(0 0 0 / 0.1),
			0 10px 10px -5px rgb(0 0 0 / 0.04);
		padding: 1rem;
	}

	.modal-content {
		height: 100%;
		overflow: auto;
		scrollbar-width: thin;
	}

	.modal-content::-webkit-scrollbar {
		width: 6px;
	}

	.modal-content::-webkit-scrollbar-track {
		background: transparent;
	}

	.modal-content::-webkit-scrollbar-thumb {
		background: #d1d5db;
		border-radius: 3px;
	}

	.modal-content::-webkit-scrollbar-thumb:hover {
		background: #9ca3af;
	}

	/* Focus styles for accessibility */
	.hover-target:focus-visible {
		outline: 2px solid #3b82f6;
		outline-offset: 2px;
	}

	/* Dark mode support */
	@media (prefers-color-scheme: dark) {
		.modal-container {
			background: #374151;
			border-color: #4b5563;
			color: white;
		}

		.modal-content::-webkit-scrollbar-thumb {
			background: #6b7280;
		}

		.modal-content::-webkit-scrollbar-thumb:hover {
			background: #9ca3af;
		}
	}
</style>
