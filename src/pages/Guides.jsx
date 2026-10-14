import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import { PAGE_SEO } from '../constants/seo'
import { GUIDES, guidePath } from '../constants/guides'

// Index des guides : liens explorables (<Link> = vrai <a href>) vers chaque article.
const Guides = () => (
  <div className='max-w-5xl mx-auto px-1 pt-10 md:pt-16 pb-16'>
    <SEO {...PAGE_SEO.guides} />
    <span className='inline-block px-4 py-1.5 rounded-full bg-primary/15 text-primary-dark text-sm font-semibold mb-6'>Ressources</span>
    <h1 className='text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight leading-[1.1] mb-5'>{"Guides du marketing d'influence"}</h1>
    <p className='text-lg text-gray-600 max-w-2xl leading-relaxed mb-12'>
      {"Tarifs, choix des créateurs, brief, budget : nos conseils concrets pour réussir vos collaborations avec des influenceurs TikTok."}
    </p>

    <ul className='grid md:grid-cols-2 gap-5'>
      {GUIDES.map((guide) => (
        <li key={guide.slug}>
          <Link
            to={guidePath(guide.slug)}
            className='block h-full rounded-3xl border border-gray-200 p-6 sm:p-8 hover:border-gray-900 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
          >
            <p className='text-sm text-gray-500 mb-3'>{guide.readingMinutes} min de lecture</p>
            <h2 className='text-xl sm:text-2xl font-bold text-gray-900 mb-3'>{guide.h1}</h2>
            <p className='text-gray-600 leading-relaxed'>{guide.excerpt}</p>
          </Link>
        </li>
      ))}
    </ul>
  </div>
)

export default Guides
