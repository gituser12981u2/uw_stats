<script lang="ts">
	import { onMount, afterUpdate } from 'svelte';
	import type { CombinedCourseData } from '../types';
	import type { Chart } from 'chart.js';

	export let data: CombinedCourseData[] = [];

	let canvas: HTMLCanvasElement;
	let chart: Chart | null = null;

	onMount(async () => {
		const Chart = (await import('chart.js/auto')).default;
		renderChart(Chart);
	});

	afterUpdate(() => {
		if (chart) {
			updateChart();
		}
	});

	async function renderChart(Chart: typeof import('chart.js/auto').default) {
		if (!canvas) return;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const gradeData = calculateGradeData();

		chart = new Chart(ctx, {
			type: 'bar',
			data: {
				labels: Object.keys(gradeData),
				datasets: [
					{
						label: 'Number of Students',
						data: Object.values(gradeData),
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

	function calculateGradeData() {
		return {
			A: data.reduce((sum, d) => sum + (d.A || 0), 0),
			'A-': data.reduce((sum, d) => sum + (d['A-'] || 0), 0),
			'B+': data.reduce((sum, d) => sum + (d['B+'] || 0), 0),
			B: data.reduce((sum, d) => sum + (d.B || 0), 0),
			'B-': data.reduce((sum, d) => sum + (d['B-'] || 0), 0),
			'C+': data.reduce((sum, d) => sum + (d['C+'] || 0), 0),
			C: data.reduce((sum, d) => sum + (d.C || 0), 0),
			'C-': data.reduce((sum, d) => sum + (d['C-'] || 0), 0),
			'D+': data.reduce((sum, d) => sum + (d['D+'] || 0), 0),
			D: data.reduce((sum, d) => sum + (d.D || 0), 0),
			'D-': data.reduce((sum, d) => sum + (d['D-'] || 0), 0),
			F: data.reduce((sum, d) => sum + (d.F || 0), 0)
		};
	}

	function updateChart() {
		if (!chart) return;

		const gradeData = calculateGradeData();
		chart.data.datasets[0].data = Object.values(gradeData);
		chart.update();
	}
</script>

<div class="rounded-2xl border border-gray-100 bg-white p-8 shadow-lg">
	<h3 class="mb-6 text-center text-xl font-semibold text-gray-800">Grade Distribution</h3>
	<div class="h-96">
		<canvas bind:this={canvas}></canvas>
	</div>
</div>
