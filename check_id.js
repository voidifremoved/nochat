import { getCollection } from 'astro:content';

async function main() {
  const entries = await getCollection('blog');
  entries.forEach(e => console.log('ID:', e.id));
}

main();
