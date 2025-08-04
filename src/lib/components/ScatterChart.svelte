<script lang="ts">
	import { onMount } from 'svelte';
	import type { CombinedCourseData } from '$lib/types';

	export let data: CombinedCourseData[] = [];

	let chartContainer: HTMLDivElement;
	let showMode: 'sample' | 'aggregated' = 'aggregated';
	let sampleSize = 500;

	// Process data for better visualization
	function processDataForChart() {
		// Filter to only courses with both GPA and rating data
		const validData = data.filter(
			(d) => d.Average_GPA > 0 && d.evalMedian?.MedianGlobal && d.evalMedian.MedianGlobal > 0
		);

		if (showMode === 'sample') {
			// Random sampling for performance
			const shuffled = [...validData].sort(() => 0.5 - Math.random());
			return shuffled.slice(0, Math.min(sampleSize, shuffled.length)).map((d) => ({
				x: d.Average_GPA,
				y: d.evalMedian!.MedianGlobal,
				course: `${d.department} ${d.courseNumber}`,
				title: d.Course_Title,
				instructor: d.Primary_Instructor,
				students: d.Student_Count,
				size: Math.max(3, Math.min(15, Math.sqrt(d.Student_Count || 1)))
			}));
		} else {
			// Aggregate by course (multiple offerings become one point)
			const courseMap = new Map<
				string,
				{
					gpaSum: number;
					ratingSum: number;
					count: number;
					totalStudents: number;
					title: string;
					instructors: Set<string>;
				}
			>();

			validData.forEach((d) => {
				const key = `${d.department}-${d.courseNumber}`;
				if (!courseMap.has(key)) {
					courseMap.set(key, {
						gpaSum: 0,
						ratingSum: 0,
						count: 0,
						totalStudents: 0,
						title: d.Course_Title,
						instructors: new Set()
					});
				}

				const course = courseMap.get(key)!;
				course.gpaSum += d.Average_GPA;
				course.ratingSum += d.evalMedian!.MedianGlobal;
				course.count++;
				course.totalStudents += d.Student_Count || 0;
				course.instructors.add(d.Primary_Instructor);
			});

			return Array.from(courseMap.entries()).map(([key, course]) => ({
				x: course.gpaSum / course.count,
				y: course.ratingSum / course.count,
				course: key.replace('-', ' '),
				title: course.title,
				instructor:
					course.instructors.size === 1
						? Array.from(course.instructors)[0]
						: `${course.instructors.size} instructors`,
				students: course.totalStudents,
				offerings: course.count,
				size: Math.max(4, Math.min(20, Math.sqrt(course.totalStudents / 10)))
			}));
		}
	}

	function createChart() {
		if (!chartContainer) return;

		const chartData = processDataForChart();

		if (chartData.length === 0) {
			chartContainer.innerHTML = `
        <div class="flex items-center justify-center h-64 text-gray-500">
          <p>No data available for visualization</p>
        </div>
      `;
			return;
		}

		// Chart dimensions
		const margin = { top: 20, right: 20, bottom: 50, left: 60 };
		const width = 600 - margin.left - margin.right;
		const height = 400 - margin.top - margin.bottom;

		// Clear previous chart
		chartContainer.innerHTML = '';

		// Create SVG
		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		svg.setAttribute('width', '100%');
		svg.setAttribute('height', '400');
		svg.setAttribute('viewBox', `0 0 600 400`);
		chartContainer.appendChild(svg);

		// Calculate scales
		const xExtent = [
			Math.min(...chartData.map((d) => d.x)) - 0.1,
			Math.max(...chartData.map((d) => d.x)) + 0.1
		];
		const yExtent = [
			Math.min(...chartData.map((d) => d.y)) - 0.2,
			Math.max(...chartData.map((d) => d.y)) + 0.2
		];

		const xScale = (value: number) =>
			margin.left + ((value - xExtent[0]) / (xExtent[1] - xExtent[0])) * width;
		const yScale = (value: number) =>
			margin.top + height - ((value - yExtent[0]) / (yExtent[1] - yExtent[0])) * height;

		// Create grid lines
		const gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
		gridGroup.setAttribute('class', 'grid');
		svg.appendChild(gridGroup);

		// Vertical grid lines
		for (let i = 0; i <= 10; i++) {
			const x = margin.left + (i * width) / 10;
			const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
			line.setAttribute('x1', x.toString());
			line.setAttribute('y1', margin.top.toString());
			line.setAttribute('x2', x.toString());
			line.setAttribute('y2', (margin.top + height).toString());
			line.setAttribute('stroke', '#f0f0f0');
			line.setAttribute('stroke-width', '1');
			gridGroup.appendChild(line);
		}

		// Horizontal grid lines
		for (let i = 0; i <= 8; i++) {
			const y = margin.top + (i * height) / 8;
			const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
			line.setAttribute('x1', margin.left.toString());
			line.setAttribute('y1', y.toString());
			line.setAttribute('x2', (margin.left + width).toString());
			line.setAttribute('y2', y.toString());
			line.setAttribute('stroke', '#f0f0f0');
			line.setAttribute('stroke-width', '1');
			gridGroup.appendChild(line);
		}

		// Create data points
		chartData.forEach((d, i) => {
			const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
			circle.setAttribute('cx', xScale(d.x).toString());
			circle.setAttribute('cy', yScale(d.y).toString());
			circle.setAttribute('r', d.size.toString());
			circle.setAttribute('fill', '#3b82f6');
			circle.setAttribute('fill-opacity', '0.6');
			circle.setAttribute('stroke', '#1e40af');
			circle.setAttribute('stroke-width', '1');
			circle.style.cursor = 'pointer';

			// Tooltip
			const tooltip = document.createElement('div');
			tooltip.className =
				'absolute bg-gray-800 text-white p-2 rounded shadow-lg text-sm z-10 pointer-events-none opacity-0 transition-opacity';
			tooltip.innerHTML = `
        <div class="font-semibold">${d.course}</div>
        <div class="text-gray-300">${d.title}</div>
        <div class="mt-1">
          <div>GPA: ${d.x.toFixed(2)}</div>
          <div>Rating: ${d.y.toFixed(2)}</div>
          <div>Students: ${d.students.toLocaleString()}</div>
          ${showMode === 'aggregated' && 'offerings' in d ? `<div>Offerings: ${d.offerings}</div>` : ''}
          <div class="text-gray-300 text-xs mt-1">${d.instructor}</div>
        </div>
      `;

			circle.addEventListener('mouseenter', (e) => {
				tooltip.style.opacity = '1';
				const rect = chartContainer.getBoundingClientRect();
				tooltip.style.left = e.clientX - rect.left + 10 + 'px';
				tooltip.style.top = e.clientY - rect.top - 10 + 'px';
			});

			circle.addEventListener('mouseleave', () => {
				tooltip.style.opacity = '0';
			});

			circle.addEventListener('mousemove', (e) => {
				const rect = chartContainer.getBoundingClientRect();
				tooltip.style.left = e.clientX - rect.left + 10 + 'px';
				tooltip.style.top = e.clientY - rect.top - 10 + 'px';
			});

			svg.appendChild(circle);
			chartContainer.appendChild(tooltip);
		});

		// Create axes
		const xAxisGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
		const yAxisGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');

		// X-axis
		const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
		xAxis.setAttribute('x1', margin.left.toString());
		xAxis.setAttribute('y1', (margin.top + height).toString());
		xAxis.setAttribute('x2', (margin.left + width).toString());
		xAxis.setAttribute('y2', (margin.top + height).toString());
		xAxis.setAttribute('stroke', '#374151');
		xAxis.setAttribute('stroke-width', '2');
		xAxisGroup.appendChild(xAxis);

		// X-axis labels
		for (let i = 0; i <= 5; i++) {
			const value = xExtent[0] + (i * (xExtent[1] - xExtent[0])) / 5;
			const x = margin.left + (i * width) / 5;

			const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
			text.setAttribute('x', x.toString());
			text.setAttribute('y', (margin.top + height + 20).toString());
			text.setAttribute('text-anchor', 'middle');
			text.setAttribute('fill', '#374151');
			text.setAttribute('font-size', '12');
			text.textContent = value.toFixed(1);
			xAxisGroup.appendChild(text);
		}

		// Y-axis
		const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
		yAxis.setAttribute('x1', margin.left.toString());
		yAxis.setAttribute('y1', margin.top.toString());
		yAxis.setAttribute('x2', margin.left.toString());
		yAxis.setAttribute('y2', (margin.top + height).toString());
		yAxis.setAttribute('stroke', '#374151');
		yAxis.setAttribute('stroke-width', '2');
		yAxisGroup.appendChild(yAxis);

		// Y-axis labels
		for (let i = 0; i <= 5; i++) {
			const value = yExtent[0] + (i * (yExtent[1] - yExtent[0])) / 5;
			const y = margin.top + height - (i * height) / 5;

			const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
			text.setAttribute('x', (margin.left - 10).toString());
			text.setAttribute('y', (y + 4).toString());
			text.setAttribute('text-anchor', 'end');
			text.setAttribute('fill', '#374151');
			text.setAttribute('font-size', '12');
			text.textContent = value.toFixed(1);
			yAxisGroup.appendChild(text);
		}

		svg.appendChild(xAxisGroup);
		svg.appendChild(yAxisGroup);

		// Axis labels
		const xLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
		xLabel.setAttribute('x', (margin.left + width / 2).toString());
		xLabel.setAttribute('y', (height + margin.top + 40).toString());
		xLabel.setAttribute('text-anchor', 'middle');
		xLabel.setAttribute('fill', '#374151');
		xLabel.setAttribute('font-size', '14');
		xLabel.setAttribute('font-weight', '600');
		xLabel.textContent = 'Average GPA';
		svg.appendChild(xLabel);

		const yLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
		yLabel.setAttribute('x', '20');
		yLabel.setAttribute('y', (margin.top + height / 2).toString());
		yLabel.setAttribute('text-anchor', 'middle');
		yLabel.setAttribute('fill', '#374151');
		yLabel.setAttribute('font-size', '14');
		yLabel.setAttribute('font-weight', '600');
		yLabel.setAttribute('transform', `rotate(-90, 20, ${margin.top + height / 2})`);
		yLabel.textContent = 'Course Rating (MedianGlobal)';
		svg.appendChild(yLabel);
	}

	onMount(() => {
		createChart();
	});

	$: if (data && chartContainer) {
		createChart();
	}
</script>

<div class="rounded-2xl border border-gray-100 bg-white p-8 shadow-lg">
	<div class="mb-6 flex items-center justify-between">
		<h3 class="text-xl font-semibold text-gray-800">GPA vs Course Rating Correlation</h3>

		<div class="flex gap-2">
			<button
				class="rounded px-3 py-1 {showMode === 'aggregated'
					? 'bg-blue-600 text-white'
					: 'bg-gray-200 text-gray-700'} text-sm"
				on:click={() => {
					showMode = 'aggregated';
					createChart();
				}}
			>
				By Course
			</button>
			<button
				class="rounded px-3 py-1 {showMode === 'sample'
					? 'bg-blue-600 text-white'
					: 'bg-gray-200 text-gray-700'} text-sm"
				on:click={() => {
					showMode = 'sample';
					createChart();
				}}
			>
				Sample
			</button>
		</div>
	</div>

	<div bind:this={chartContainer} class="relative w-full"></div>

	<div class="mt-4 text-center text-sm text-gray-500">
		{#if showMode === 'aggregated'}
			Showing courses aggregated across all offerings. Circle size = total students.
		{:else}
			Showing random sample of {sampleSize} course offerings. Circle size = class size.
		{/if}
	</div>
</div>
