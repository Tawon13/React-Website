import { Link } from 'react-router-dom'

const LEGAL_PAGES = [
    { to: '/terms', label: "Conditions d'utilisation" },
    { to: '/privacy', label: 'Confidentialité' },
    { to: '/mentions-legales', label: 'Mentions légales' }
]

// Mise en page commune aux pages légales : en-tête, sommaire (colonne collante sur grand
// écran) et texte en colonne de lecture confortable.
const LegalLayout = ({ title, updated, current, sections = [], children }) => (
    <div className='bg-white'>
        <header className='rounded-3xl bg-gradient-to-b from-[#FBF6EE] to-white'>
            <div className='max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-10 sm:pt-16 sm:pb-14'>
                <nav aria-label='Pages légales' className='flex flex-wrap gap-2 mb-8'>
                    {LEGAL_PAGES.map((page) => (
                        <Link
                            key={page.to}
                            to={page.to}
                            aria-current={page.to === current ? 'page' : undefined}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                                page.to === current ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-900'
                            }`}
                        >
                            {page.label}
                        </Link>
                    ))}
                </nav>
                <h1 className='text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight'>{title}</h1>
                {updated && <p className='mt-4 text-sm text-gray-500'>Dernière mise à jour : {updated}</p>}
            </div>
        </header>

        <div className='max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-16'>
            {sections.length > 0 && (
                <aside className='hidden lg:block'>
                    <nav aria-label='Sommaire' className='sticky top-28'>
                        <p className='text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4'>Sommaire</p>
                        <ol className='space-y-2.5 text-sm'>
                            {sections.map((section) => (
                                <li key={section.id}>
                                    <a href={`#${section.id}`} className='text-gray-600 hover:text-gray-900 transition-colors duration-200'>
                                        {section.title}
                                    </a>
                                </li>
                            ))}
                        </ol>
                    </nav>
                </aside>
            )}
            <article
                className='max-w-3xl text-gray-700 leading-relaxed space-y-10
                    [&_section]:scroll-mt-28 [&_h2]:text-xl [&_h2]:sm:text-2xl [&_h2]:font-semibold [&_h2]:text-gray-900 [&_h2]:tracking-tight [&_h2]:mb-3
                    [&_p+p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1.5 [&_li]:marker:text-primary
                    [&_a]:text-gray-900 [&_a]:underline [&_a]:decoration-primary [&_a]:underline-offset-4 [&_a:hover]:decoration-2'
            >
                {children}
            </article>
        </div>
    </div>
)

export default LegalLayout
