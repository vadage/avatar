import { Hono } from 'hono';
import { renderIdenticon } from '../generators/identicon';
import { sValidator } from '@hono/standard-validator';
import * as z from 'zod';

const app = new Hono();

app.get(
	'/:size/:value',
	sValidator(
		'param',
		z.object({
			size: z.enum(['16', '32', '64', '128', '256', '512']).transform((v) => parseInt(v, 10)),
			value: z.string()
		})
	),
	(c) => {
		const { size, value } = c.req.valid('param');

		const svg = renderIdenticon(value, { size });

		c.header('Content-Type', 'image/svg+xml');
		c.header('Cache-Control', 'public, immutable, max-age=31536000');
		return c.body(svg);
	}
);

export default app;
