<script lang="ts">
	import { onMount } from 'svelte';
	import type { Chart } from 'chart.js';
	import type { GradeDistributionItem } from '$lib/types';

	let {
		data = []
	}: {
		data?: GradeDistributionItem[];
	} = $props();

	let canvas = $state<HTMLCanvasElement | undefined>(undefined);
	let chart: Chart | null = null;

	const labels = $derived(data.map((item) => item.grade));
	const values = $derived(data.map((item) => item.count));

	onMount(() => {
		let disposed = false;

		void (async () => {
			const Chart = (await import('chart.js/auto')).default;

			if (!disposed) {
				renderChart(Chart);
			}
		})();

		return () => {
			disposed = true;
			chart?.destroy();
			chart = null;
		};
	});

	$effect(() => {
		if (!chart) return;

		chart.data.labels = labels;
		chart.data.datasets[0].data = values;
		chart.update();
	});

	async function renderChart(ChartCtor: typeof import('chart.js/auto').default) {
		if (!canvas) return;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		chart = new ChartCtor(ctx, {
			type: 'bar',
			data: {
				labels,
				datasets: [
					{
						label: 'Number of Students',
						data: values,
						backgroundColor: [
							'#10b981',
							'#059669',
							'#047857',
							'#065f46',
							'#eab308',
							'#ca8a04',
							'#a16207',
							'#92400e',
							'#dc2626',
							'#b91c1c',
							'#991b1b',
							'#7f1d1d'
						],
						borderRadius: 6,
						borderSkipped: false
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: { display: false }
				},
				scales: {
					y: {
						beginAtZero: true,
						title: {
							display: true,
							text: 'Number of Students',
							font: { size: 14, weight: 'bold' }
						},
						grid: { color: 'rgba(0,0,0,0.1)' }
					},
					x: {
						grid: { display: false }
					}
				}
			}
		});
	}
</script>

<div class="rounded-2xl border border-gray-100 bg-white p-8 shadow-lg">
	<h3 class="mb-6 text-center text-xl font-semibold text-gray-800">Grade Distribution</h3>

	{#if data.length === 0}
		<div class="h=96 flex items-center justify-center text-gray-500">
			<p>No grade distribution available.</p>
		</div>
	{:else}
		<div class="h-96">
			<canvas bind:this={canvas}></canvas>
		</div>
	{/if}
</div>
