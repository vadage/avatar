import { hash32, mulberry32 } from '../utils/hash';

type Neighbors = {
	topLeft: boolean;
	top: boolean;
	topRight: boolean;
	right: boolean;
	bottomRight: boolean;
	bottom: boolean;
	bottomLeft: boolean;
	left: boolean;
};

function generatePalette(seed: number) {
	const hue = seed % 360;
	return {
		fill: `hsl(${hue} 60% 42%)`,
		background: `hsl(${hue} 20% 96%)`
	};
}

function generatePath(x: number, y: number, size: number, neighbors: Neighbors, r: number) {
	const x2 = x + size;
	const y2 = y + size;
	const arc = (rx: number, ry: number, x: number, y: number) => `A${rx},${ry} 0 0,1 ${x},${y}`;

	const { top, right, bottom, left } = neighbors;
	const tl = !top && !left;
	const tr = !top && !right;
	const br = !bottom && !right;
	const bl = !bottom && !left;

	const d = [
		`M${x + (tl ? r : 0)},${y}`,
		`H${x2 - (tr ? r : 0)}`,
		tr ? arc(r, r, x2, y + r) : '',
		`V${y2 - (br ? r : 0)}`,
		br ? arc(r, r, x2 - r, y2) : '',
		`H${x + (bl ? r : 0)}`,
		bl ? arc(r, r, x, y2 - r) : '',
		`V${y + (tl ? r : 0)}`,
		tl ? arc(r, r, x + r, y) : '',
		'Z'
	]
		.filter(Boolean)
		.join(' ');

	return `<path d="${d}" />`;
}

function generateInversePath(x: number, y: number, size: number, neighbors: Neighbors, r: number) {
	const { topLeft, top, topRight, right, bottomRight, bottom, bottomLeft, left } = neighbors;
	const x2 = x + size;
	const y2 = y + size;
	const arc = (rx: number, ry: number, x: number, y: number) => `A${rx},${ry} 0 0,0 ${x},${y}`;

	const paths: string[] = [];

	if (top && left && topLeft) {
		paths.push(`M${x},${y + r} L${x},${y} L${x + r},${y} ${arc(r, r, x, y + r)}`);
	}
	if (top && right && topRight) {
		paths.push(`M${x2 - r},${y} L${x2},${y} L${x2},${y + r} ${arc(r, r, x2 - r, y)}`);
	}
	if (bottom && right && bottomRight) {
		paths.push(`M${x2},${y2 - r} L${x2},${y2} L${x2 - r},${y2} ${arc(r, r, x2, y2 - r)}`);
	}
	if (bottom && left && bottomLeft) {
		paths.push(`M${x + r},${y2} L${x},${y2} L${x},${y2 - r} ${arc(r, r, x + r, y2)}`);
	}

	if (paths.length === 0) {
		return null;
	}
	return `<path d="${paths.join(' ')}" />`;
}

function generateIdenticon(cells: number, rand: () => number) {
	const halfWidth = Math.ceil(cells / 2);

	const grid: boolean[][] = [];
	for (let y = 0; y < cells; y++) {
		const leftHalf: boolean[] = [];
		for (let x = 0; x < halfWidth; x++) {
			leftHalf.push(rand() > 0.5);
		}

		const row: boolean[] = [];
		for (let x = 0; x < cells; x++) {
			const mirroredIndex = x < halfWidth ? x : cells - 1 - x;
			row.push(leftHalf[mirroredIndex]);
		}

		grid.push(row);
	}

	return grid;
}

function isFilled(grid: boolean[][], x: number, y: number) {
	const row = grid[y];
	return row?.[x];
}

export function renderIdenticon(value: string, options: { size: number }) {
	const { size } = options;
	const cells = 7;

	const seed = hash32(value);
	const rand = mulberry32(seed);
	const palette = generatePalette(seed);

	const cellSize = Math.floor(size / (cells + 2));
	const padding = cellSize;
	const radius = cellSize * 0.375;

	const grid = generateIdenticon(cells, rand);

	const shapes: string[] = [];

	for (let y = 0; y < cells; y++) {
		for (let x = 0; x < cells; x++) {
			const filled = isFilled(grid, x, y);

			const px = padding + x * cellSize;
			const py = padding + y * cellSize;

			const neighbors: Neighbors = {
				topLeft: isFilled(grid, x - 1, y - 1),
				top: isFilled(grid, x, y - 1),
				topRight: isFilled(grid, x + 1, y - 1),
				right: isFilled(grid, x + 1, y),
				bottomRight: isFilled(grid, x + 1, y + 1),
				bottom: isFilled(grid, x, y + 1),
				bottomLeft: isFilled(grid, x - 1, y + 1),
				left: isFilled(grid, x - 1, y)
			};

			if (filled) {
				shapes.push(generatePath(px, py, cellSize, neighbors, radius));
			} else {
				const inverse = generateInversePath(px, py, cellSize, neighbors, radius);
				if (inverse) {
					shapes.push(inverse);
				}
			}
		}
	}

	return [
		`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`,
		`<rect width="100%" height="100%" fill="${palette.background}" />`,
		`<g fill="${palette.fill}">`,
		shapes.join(''),
		'</g>',
		'</svg>'
	].join('');
}
