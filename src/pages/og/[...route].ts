import { OGImageRoute } from 'astro-og-canvas';
import { getCollection } from 'astro:content';

const entries = await getCollection('blog');
const pages = Object.fromEntries(entries.map(({ data, id }) => [id + '.png', { data }]));

export const { getStaticPaths, GET } = await OGImageRoute({
  param: 'route',
  pages: pages,
  getImageOptions: (_, page) => ({
    title: page.data.title,
    description: page.data.description,
  }),
});
