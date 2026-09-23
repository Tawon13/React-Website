// Post-build : le site est une SPA, donc toutes les URL servaient le même index.html
// (même titre, même canonical = accueil). Ce script génère un fichier HTML par page
// publique avec ses propres balises <head>, et régénère le sitemap avec les catégories
// et les profils d'influenceurs approuvés. Vercel (cleanUrls) sert /talents depuis
// dist/talents.html avant d'appliquer la réécriture SPA.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
    CATEGORY_SEO, DEFAULT_DESCRIPTION, DEFAULT_IMAGE, PAGE_SEO, SITE_NAME, SITE_URL,
    formatTitle, influencerSeo
} from '../src/constants/seo.js'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = join(ROOT, 'dist')

const escapeHtml = (value) => String(value)
    .replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// Variables Firebase : celles de l'environnement de build (Vercel), sinon les fichiers .env locaux.
const readEnv = (key) => {
    if (process.env[key]) return process.env[key]
    for (const file of ['.env.production', '.env']) {
        const path = join(ROOT, file)
        if (!existsSync(path)) continue
        const match = readFileSync(path, 'utf8').match(new RegExp(`^${key}=(.*)$`, 'm'))
        if (match) return match[1].trim().replace(/^["']|["']$/g, '')
    }
    return ''
}

const fetchApprovedInfluencers = async () => {
    const projectId = readEnv('VITE_FIREBASE_PROJECT_ID')
    const apiKey = readEnv('VITE_FIREBASE_API_KEY')
    if (!projectId || !apiKey) return []

    const influencers = []
    let pageToken = ''
    do {
        const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/influencers?pageSize=300&key=${apiKey}${pageToken ? `&pageToken=${pageToken}` : ''}`
        const res = await fetch(url)
        if (!res.ok) throw new Error(`Firestore ${res.status}`)
        const body = await res.json()
        for (const doc of body.documents || []) {
            const f = doc.fields || {}
            if (f.approved?.booleanValue !== true) continue
            const tiktok = f.socialAccounts?.mapValue?.fields?.tiktok?.mapValue?.fields || {}
            influencers.push({
                id: doc.name.split('/').pop(),
                tiktokUsername: tiktok.username?.stringValue || '',
                category: f.category?.stringValue || '',
                city: f.city?.stringValue || '',
                image: f.photoURL?.stringValue || tiktok.avatarUrl?.stringValue || '',
                lastmod: (doc.updateTime || '').slice(0, 10)
            })
        }
        pageToken = body.nextPageToken || ''
    } while (pageToken)
    return influencers
}

const renderHead = ({ title, description = DEFAULT_DESCRIPTION, path, image = DEFAULT_IMAGE }) => {
    const fullTitle = escapeHtml(formatTitle(title))
    const desc = escapeHtml(description)
    const url = escapeHtml(`${SITE_URL}${path}`)
    const img = escapeHtml(image)
    return [
        `<title>${fullTitle}</title>`,
        `<meta data-rh="true" name="description" content="${desc}" />`,
        `<link data-rh="true" rel="canonical" href="${url}" />`,
        `<meta data-rh="true" property="og:type" content="website" />`,
        `<meta data-rh="true" property="og:site_name" content="${SITE_NAME}" />`,
        `<meta data-rh="true" property="og:locale" content="fr_FR" />`,
        `<meta data-rh="true" property="og:title" content="${fullTitle}" />`,
        `<meta data-rh="true" property="og:description" content="${desc}" />`,
        `<meta data-rh="true" property="og:url" content="${url}" />`,
        `<meta data-rh="true" property="og:image" content="${img}" />`,
        `<meta data-rh="true" name="twitter:card" content="summary_large_image" />`,
        `<meta data-rh="true" name="twitter:title" content="${fullTitle}" />`,
        `<meta data-rh="true" name="twitter:description" content="${desc}" />`,
        `<meta data-rh="true" name="twitter:image" content="${img}" />`
    ].map((line) => `    ${line}`).join('\n')
}

// "/" -> index.html, "/talents" -> talents.html, "/talents/Beauté" -> talents/Beauté.html
const outputFile = (path) => {
    if (path === '/') return join(DIST, 'index.html')
    return join(DIST, `${decodeURIComponent(path).slice(1)}.html`)
}

const main = async () => {
    const template = readFileSync(join(DIST, 'index.html'), 'utf8')
    const markerRe = /<!-- seo:start[\s\S]*?<!-- seo:end -->/
    if (!markerRe.test(template)) throw new Error('Marqueurs seo:start/seo:end introuvables dans dist/index.html')

    let influencers = []
    try {
        influencers = await fetchApprovedInfluencers()
    } catch (error) {
        console.warn(`[prerender-seo] Profils influenceurs ignorés : ${error.message}`)
    }

    const pages = [
        ...Object.values(PAGE_SEO),
        ...CATEGORY_SEO.map((page) => ({ ...page, changefreq: 'weekly', priority: '0.7' })),
        ...influencers.map((inf) => ({ ...influencerSeo(inf), changefreq: 'weekly', priority: '0.6', lastmod: inf.lastmod }))
    ]

    for (const page of pages) {
        const file = outputFile(page.path)
        mkdirSync(dirname(file), { recursive: true })
        writeFileSync(file, template.replace(markerRe, renderHead(page)))
    }

    const today = new Date().toISOString().slice(0, 10)
    const urls = pages.map((page) => [
        '  <url>',
        `    <loc>${escapeHtml(`${SITE_URL}${page.path}`)}</loc>`,
        `    <lastmod>${page.lastmod || today}</lastmod>`,
        `    <changefreq>${page.changefreq}</changefreq>`,
        `    <priority>${page.priority}</priority>`,
        '  </url>'
    ].join('\n'))
    writeFileSync(join(DIST, 'sitemap.xml'),
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`)

    console.log(`[prerender-seo] ${pages.length} pages pré-rendues (${influencers.length} profils influenceurs), sitemap mis à jour.`)
}

main().catch((error) => {
    console.error(`[prerender-seo] ${error.message}`)
    process.exit(1)
})
