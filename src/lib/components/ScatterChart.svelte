<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { CourseIndexEntry } from '$lib/types';
	import type { Chart } from 'chart.js';
	import { _isClickEvent } from 'chart.js/helpers';
	import { onMount } from 'svelte';

	let {
		data = []
	}: {
		data?: CourseIndexEntry[];
	} = $props();

	let canvas = $state<HTMLCanvasElement | undefined>(undefined);
	let chart = $state<Chart | null>(null);
	let ChartCtor = $state<typeof import('chart.js/auto').default | null>(null);

	let showMode = $state<'all' | 'sample'>('all');
	const sampleSize = 500;

	type ScatterPoint = {
		x: number;
		y: number;
		slug: string;
		courseCode: string;
		title: string;
		totalStudents: number;
		totalOfferings: number;
		hasRating: boolean;
	};

	const allChartData = $derived(
		data
			.filter((course) => course.averageGPA > 0)
			.map(
				(course): ScatterPoint => ({
					x: course.averageGPA,
					y:
						typeof course.averageRating === 'number' && course.averageRating > 0
							? course.averageRating
							: 0,
					slug: course.slug,
					courseCode: course.courseCode,
					title: course.title,
					totalStudents: course.totalStudents,
					totalOfferings: course.totalOfferings,
					hasRating: typeof course.averageRating === 'number' && course.averageRating > 0
				})
			)
	);

	const displayData = $derived(
		showMode === 'sample'
			? allChartData
					.slice()
					.sort(() => Math.random() - 0.5)
					.slice(0, Math.min(sampleSize, allChartData.length))
			: allChartData
	);

	onMount(() => {
		let disposed = false;

		void (async () => {
			const mod = await import('chart.js/auto');
			if (disposed) return;
			ChartCtor = mod.default;
		})();

		return () => {
			disposed = true;
			chart?.destroy();
			chart = null;
		};
	});

	$effect(() => {
		if (!ChartCtor || !canvas) return;

		if (displayData.length === 0) {
			chart?.destroy();
			chart = null;
			return;
		}

		if (!chart) {
			renderChart(ChartCtor);
			return;
		}

		chart.data.datasets[0].data = displayData;
		chart.update();
	});

	async function navigateToCourse(slug: string) {
		await goto(resolve(`/course/${slug}`));
	}

	function renderChart(ChartCtor: typeof import('chart.js/auto').default) {
		if (!canvas) return;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		chart?.destroy();

		chart = new ChartCtor(ctx, {
			type: 'scatter',
			data: {
				datasets: [
					{
						label: 'Courses',
						data: displayData,
						backgroundColor: 'rgba(59, 130, 246, 0.6)',
						borderColor: 'rgba(30, 64, 175, 1)',
						borderWidth: 1,
						pointRadius(context) {
							const raw = context.raw as ScatterPoint | undefined;
							if (!raw) return 4;
							return Math.max(4, Math.min(12, Math.sqrt(raw.totalStudents / 10)));
						},
						pointHoverRadius(context) {
							const raw = context.raw as ScatterPoint | undefined;
							if (!raw) return 6;
							return Math.max(6, Math.min(16, Math.sqrt(raw.totalStudents / 8)));
						}
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				onClick: async (_event, elements, chartInstance) => {
					const first = elements[0];
					if (!first) return;

					const point = chartInstance.data.datasets[first.datasetIndex].data[first.index] as
						| ScatterPoint
						| undefined;

					if (!point) return;

					await navigateToCourse(point.slug);
				},
				onHover: (event, elements) => {
					const target = event.native?.target;
					if (target instanceof HTMLCanvasElement) {
						target.style.cursor = elements.length > 0 ? 'pointer' : 'default';
					}
				},
				plugins: {
					legend: {
						display: false
					},
					tooltip: {
						callbacks: {
							label(context) {
								const raw = context.raw as ScatterPoint;
								return [
									raw.courseCode,
									raw.title,
									`GPA: ${raw.x.toFixed(2)}`,
									raw.hasRating ? `Rating: ${raw.y.toFixed(2)}` : 'Rating: N/A',
									`Students: ${raw.totalStudents.toLocaleString()}`,
									`Offerings: ${raw.totalOfferings}`
								];
							}
						}
					}
				},
				scales: {
					x: {
						title: {
							display: true,
							text: 'Average GPA',
							font: { size: 14, weight: 'bold' }
						},
						grid: { color: 'rgba(0,0,0,0.08)' }
					},
					y: {
						title: {
							display: true,
							text: 'Average Rating',
							font: { size: 14, weight: 'bold' }
						},
						grid: { color: 'rgba(0,0,0,0.08)' }
					}
				}
			}
		});
	}
</script>

<div class="rounded-2xl border border-gray-100 bg-white p-8 shadow-lg">
	<div class="mb-6 flex items-center justify-between">
		<h3 class="text-xl font-semibold text-gray-800">GPA vs Course Rating Correlation</h3>

		<div class="flex gap-2">
			<button
				type="button"
				class={`rounded px-3 py-1 text-sm ${
					showMode === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
				}`}
				onclick={() => {
					showMode = 'all';
				}}
			>
				All
			</button>
			<button
				type="button"
				class={`rounded px-3 py-1 text-sm ${
					showMode === 'sample' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
				}`}
				onclick={() => {
					showMode = 'sample';
				}}
			>
				Sample
			</button>
		</div>
	</div>

	<div class="h-96">
		{#if displayData.length === 0}
			<div class="flex h-full items-center justify-center text-gray-500">
				<p>No data available for visualization.</p>
			</div>
		{:else}
			<canvas bind:this={canvas}></canvas>
		{/if}
	</div>

	<div class="mt-4 text-center text-sm text-gray-500">
		<div>
			{#if showMode === 'sample'}
				Showing a random sample of up to {sampleSize} matching courses. Point size = total students.
			{:else}
				Showing all matching courses. Point size = total students.
			{/if}
		</div>
		<div class="text-xs text-gray-400">
			Blue points have rating data. Gray points at y = 0 indicate courses with no rating data.
		</div>
	</div>
</div>
