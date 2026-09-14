#!/usr/bin/env node

import { access, mkdir, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

const args = process.argv.slice(2);
const slugIndex = args.indexOf('--slug');
const slugOption = slugIndex >= 0 ? args[slugIndex + 1] : undefined;
if (slugIndex >= 0) {
	args.splice(slugIndex, 2);
}

const title = args.join(' ').trim();
if (!title) {
	console.error('Usage: npm run new -- "文章标题"');
	process.exit(1);
}

const now = new Date();
const date = [
	now.getFullYear(),
	String(now.getMonth() + 1).padStart(2, '0'),
	String(now.getDate()).padStart(2, '0'),
].join('-');
const timeSlug = [
	String(now.getHours()).padStart(2, '0'),
	String(now.getMinutes()).padStart(2, '0'),
	String(now.getSeconds()).padStart(2, '0'),
].join('');

const slug = filenameSlug(slugOption || title) || `post-${timeSlug}`;
const postDir = path.join(process.cwd(), 'src/content/blog');
const postFileStem = `${date}-${slug}`;
const legacyImageDir = path.join(postDir, 'images', slug);
const imageDir = path.join(postDir, 'images', postFileStem);
const postPath = path.join(postDir, `${postFileStem}.md`);

try {
	await access(postPath);
	console.error(`Post already exists: ${postPath}`);
	process.exit(1);
} catch {
	try {
		await access(legacyImageDir);
		if (legacyImageDir !== imageDir) {
			try {
				await access(imageDir);
				console.warn(`Legacy image directory already exists: ${legacyImageDir}`);
			} catch {
				await rename(legacyImageDir, imageDir);
				console.log(`Moved legacy image folder ${legacyImageDir} -> ${imageDir}`);
			}
		}
	} catch {
		// Legacy folder does not exist; nothing to migrate.
	}

	await mkdir(imageDir, { recursive: true });
	await writeFile(
		postPath,
		`---\ntitle: "${escapeYaml(title)}"\ndescription: "一句话概括这篇文章。"\npubDate: ${date}\ndraft: true\n---\n\n## 背景\n\n\n## 正文\n\n\n## 小结\n\n`,
	);
	console.log(`Created ${postPath}`);
	console.log(`Image folder ${imageDir}`);
}

function filenameSlug(value) {
	return value
		.normalize('NFKC')
		.trim()
		.replace(/[\\/:*?"<>|#%{}[\]^`]+/g, '-')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 80);
}

function escapeYaml(value) {
	return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}
