<script lang="ts">
	import '../app.css';
	import { inject } from '@vercel/analytics';

	inject();

	let { children } = $props();
</script>

<nav class="fixed top-4 right-4 z-50">
	<div
		class="flex gap-4 rounded-full border border-gray-200/50 bg-white/90 px-4 py-2 text-sm shadow-sm backdrop-blur-sm"
	>
		<a href="/" class="text-gray-600 transition-colors hover:text-gray-900">Home</a>
		<a href="/about" class="text-gray-600 transition-colors hover:text-gray-900">About</a>
	</div>
</nav>

{@render children()}
