import { Hono } from 'hono';
import identiconRoute from './routes/identicon';

const app = new Hono();

const api = new Hono();
api.route('/identicon', identiconRoute);
app.route('/api', api);

export default app;
