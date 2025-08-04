<script lang="ts">
	export let value: string | number;
	export let label: string;
	export let gradient: string = 'from-blue-500 to-purple-600';
</script>

<div
	class="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-8 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
>
	<div class="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r {gradient}"></div>
	<div class="text-center">
		<div class="bg-gradient-to-r text-4xl font-bold {gradient} mb-2 bg-clip-text text-transparent">
			{value}
		</div>
		<div class="text-sm font-medium tracking-wide text-gray-600 uppercase">
			{label}
		</div>
	</div>
</div>
