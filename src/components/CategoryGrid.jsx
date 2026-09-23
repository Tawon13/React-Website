import { useContext, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { AppContext } from '../context/AppContext'
import { INFLUENCER_CATEGORIES } from '../constants/categories'
import { categoryPath } from '../constants/seo'
import { Reveal } from './PageKit'

// Catégories avec le nombre réel de créateurs approuvés dans chacune, les plus fournies d'abord.
// On compte les influenceurs seulement : c'est la vue par défaut de la page Talents vers
// laquelle mènent ces liens, pour que le chiffre affiché corresponde aux résultats.
const CategoryGrid = () => {
  const { doctors, doctorsLoading } = useContext(AppContext)

  const categories = useMemo(() => {
    const counts = doctors.filter((doc) => doc.creatorType !== 'ugc').reduce((acc, doc) => {
      acc[doc.speciality] = (acc[doc.speciality] || 0) + 1
      return acc
    }, {})
    return INFLUENCER_CATEGORIES
      .map((name) => ({ name, count: counts[name] || 0 }))
      .sort((a, b) => b.count - a.count)
  }, [doctors])

  return (
    <section aria-labelledby='categories-title'>
      <Reveal className='max-w-2xl mb-10'>
        <h2 id='categories-title' className='text-3xl md:text-4xl font-bold text-gray-900 mb-3'>Explorez par catégorie</h2>
        <p className='text-gray-600 leading-relaxed'>Trouvez des créateurs dans la niche qui correspond à votre marque.</p>
      </Reveal>
      <motion.ul
        className='flex flex-wrap gap-2.5 sm:gap-3'
        initial='hidden'
        whileInView='visible'
        viewport={{ once: true, amount: 0.3 }}
        variants={{ visible: { transition: { staggerChildren: 0.03 } } }}
      >
        {categories.map(({ name, count }) => (
          <motion.li key={name} variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
            <Link
              to={categoryPath(name)}
              onClick={() => window.scrollTo(0, 0)}
              className={`group inline-flex items-center gap-2.5 rounded-full border px-4 sm:px-5 py-2.5 sm:py-3 font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                count > 0
                  ? 'border-gray-300 text-gray-900 hover:bg-gray-900 hover:text-white hover:border-gray-900'
                  : 'border-gray-200 text-gray-500 hover:border-gray-400'
              }`}
            >
              {name}
              {!doctorsLoading && count > 0 && (
                <span className='rounded-full bg-primary/20 text-primary-dark group-hover:bg-primary group-hover:text-gray-900 text-xs font-semibold px-2 py-0.5 tabular-nums transition-colors duration-200'>
                  {count}
                </span>
              )}
            </Link>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  )
}

export default CategoryGrid
