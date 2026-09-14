// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig, fontProviders } from 'astro/config';

const repository = process.env.GITHUB_REPOSITORY ?? 'your-github-username/blog';
const [owner = 'your-github-username', repo = 'blog'] = repository.split('/');
const isUserSite = repo === `${owner}.github.io`;
const defaultBase = process.env.GITHUB_ACTIONS === 'true' && !isUserSite ? `/${repo}` : undefined;
const base = process.env.BASE_PATH === '/' ? undefined : (process.env.BASE_PATH ?? defaultBase);
const site = process.env.SITE_URL ?? `https://${owner}.github.io`;

// https://astro.build/config
export default defineConfig({
	site,
	...(base ? { base } : {}),
	integrations: [mdx(), sitemap()],
	fonts: [
		{
			provider: fontProviders.local(),
			name: 'Atkinson',
			cssVariable: '--font-atkinson',
			fallbacks: ['sans-serif'],
			options: {
				variants: [
					{
						src: ['./src/assets/fonts/atkinson-regular.woff'],
						weight: 400,
						style: 'normal',
						display: 'swap',
					},
					{
						src: ['./src/assets/fonts/atkinson-bold.woff'],
						weight: 700,
						style: 'normal',
						display: 'swap',
					},
				],
			},
		},
	],
});
