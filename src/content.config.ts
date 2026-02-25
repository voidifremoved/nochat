import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string().optional(),
			summary: z.string().optional(),
			// Transform string to Date object
			pubDate: z.coerce.date().optional(),
			date: z.coerce.date().optional(),
			updatedDate: z.coerce.date().optional(),
			heroImage: image().optional(),
			tags: z.array(z.string()).optional(),
			categories: z.array(z.string()).optional(),
			draft: z.boolean().optional(),
			showtoc: z.boolean().optional(),
		}).transform(data => ({
			...data,
			// Normalize to standard Astro fields
			pubDate: data.pubDate || data.date || new Date(),
			description: data.description || data.summary || "",
		})),
});

export const collections = { blog };
