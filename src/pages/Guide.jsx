import { lazy, Suspense } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import SEO from '../components/SEO'
import NotFound from './NotFound'
import { outlineBtn } from '../components/PageKit'
import { DEFAULT_IMAGE, SITE_NAME, SITE_URL } from '../constants/seo'
import { findGuide, guidePath } from '../constants/guides'

// Corps des guides, chargés à la demande (un fichier JSX par guide).
const GUIDE_BODIES = {
  'combien-coute-un-influenceur-tiktok': lazy(() => import('../guides/CombienCouteInfluenceurTiktok'))
}

const formatDate = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

// Mise en forme du texte des guides (pas de plugin typography : sélecteurs enfants).
const articleClass = [
  'text-gray-700 leading-relaxed text-base sm:text-[17px]',
  '[&_p]:mb-5',
  '[&_h2]:text-2xl [&_h2]:sm:text-3xl [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:tracking-tight [&_h2]:mt-12 [&_h2]:mb-4',
  '[&_h3]:text-lg [&_h3]:sm:text-xl [&_h3]:font-semibold [&_h3]:text-gray-900 [&_h3]:mt-8 [&_h3]:mb-2',
  '[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-5 [&_li]:mb-2 [&_strong]:text-gray-900'
].join(' ')

const Guide = () => {
  const { slug } = useParams()
  const guide = findGuide(slug)
  const Body = GUIDE_BODIES[slug]
  if (!guide || !Body) return <NotFound />

  const url = `${SITE_URL}${guidePath(guide.slug)}`
  const schemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: guide.h1,
      description: guide.description,
      datePublished: guide.datePublished,
      dateModified: guide.dateModified,
      inLanguage: 'fr-FR',
      mainEntityOfPage: url,
      image: DEFAULT_IMAGE,
      author: { '@type': 'Organization', name: SITE_NAME, url: `${SITE_URL}/` },
      publisher: { '@type': 'Organization', name: SITE_NAME, logo: { '@type': 'ImageObject', url: `${SITE_URL}/favicon.png` } }
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: 'Guides', item: `${SITE_URL}/guides` },
        { '@type': 'ListItem', position: 3, name: guide.h1, item: url }
      ]
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: guide.faq.map(({ question, answer }) => ({
        '@type': 'Question',
        name: question,
        acceptedAnswer: { '@type': 'Answer', text: answer }
      }))
    }
  ]

  return (
    <article className='max-w-3xl mx-auto px-1 pt-10 md:pt-16 pb-16'>
      <SEO title={guide.title} description={guide.description} path={guidePath(guide.slug)} />
      <Helmet>
        {schemas.map((schema) => (
          <script key={schema['@type']} type='application/ld+json'>{JSON.stringify(schema)}</script>
        ))}
      </Helmet>

      <nav aria-label="Fil d'Ariane" className='text-sm text-gray-500 mb-8'>
        <ol className='flex flex-wrap gap-2'>
          <li><Link to='/' className='hover:text-gray-900'>Accueil</Link> /</li>
          <li><Link to='/guides' className='hover:text-gray-900'>Guides</Link> /</li>
          <li aria-current='page' className='text-gray-700'>{guide.h1}</li>
        </ol>
      </nav>

      <header className='mb-10'>
        <span className='inline-block px-4 py-1.5 rounded-full bg-primary/15 text-primary-dark text-sm font-semibold mb-6'>Guide marques</span>
        <h1 className='text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight leading-[1.15] mb-5'>{guide.h1}</h1>
        <p className='text-sm text-gray-500'>
          Mis à jour le <time dateTime={guide.dateModified}>{formatDate(guide.dateModified)}</time> · {guide.readingMinutes} min de lecture
        </p>
      </header>

      <div className={articleClass}>
        <Suspense fallback={<p className='text-gray-500'>Chargement du guide…</p>}>
          <Body />
        </Suspense>
      </div>

      <section aria-labelledby='guide-faq' className='mt-14'>
        <h2 id='guide-faq' className='text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-6'>Questions fréquentes</h2>
        <div className='flex flex-col gap-3'>
          {guide.faq.map((item) => (
            <details key={item.question} className='group rounded-2xl border border-gray-200 bg-gray-50 open:bg-white open:border-gray-900 p-5 sm:p-6'>
              <summary className='cursor-pointer list-none font-semibold text-gray-900 flex justify-between gap-4'>
                {item.question}
                <span aria-hidden='true' className='text-primary-dark transition-transform group-open:rotate-45'>+</span>
              </summary>
              <p className='mt-3 text-gray-600 leading-relaxed'>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <aside className='mt-14 rounded-3xl bg-gray-900 text-white p-8 sm:p-10'>
        <h2 className='text-2xl sm:text-3xl font-bold mb-3'>Comparez les tarifs de vrais créateurs</h2>
        <p className='text-gray-300 leading-relaxed mb-6'>
          Sur Collabzz, chaque influenceur TikTok affiche son prix et ses statistiques vérifiées. Sans abonnement, paiement libéré à la validation du contenu.
        </p>
        <div className='flex flex-col sm:flex-row gap-3'>
          <Link to='/talents' className='bg-primary text-gray-900 px-7 py-3.5 rounded-full font-semibold text-center hover:bg-[#EDC085] transition-colors duration-200'>Voir les influenceurs</Link>
          <Link to='/for-brands' className='border border-gray-600 text-white px-7 py-3.5 rounded-full font-semibold text-center hover:border-white transition-colors duration-200'>Comment ça marche</Link>
        </div>
      </aside>

      <div className='mt-10'>
        <Link to='/guides' className={`${outlineBtn} inline-block`}>← Tous les guides</Link>
      </div>
    </article>
  )
}

export default Guide
