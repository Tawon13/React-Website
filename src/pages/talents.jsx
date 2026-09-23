import { useContext, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, MotionConfig } from 'motion/react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { AppContext } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { pickBestMatch } from '../utils/matching'
import SEO from '../components/SEO'
import { PAGE_SEO, categorySeo } from '../constants/seo'
import { INFLUENCER_CATEGORIES } from '../constants/categories'
import { useCanSeeStats } from '../hooks/useCanSeeStats'
import SmartImage from '../components/SmartImage'

const compactFormat = new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 })

// Options de tri (paramètre ?sort=). Sans paramètre, on trie par abonnés.
// Les profils sans donnée pour le critère choisi (ex. pas encore de stats TikTok)
// passent en fin de liste plutôt que d'être comptés comme 0.
const SORT_OPTIONS = [
	{ value: 'popular', label: "Le + d'abonnés", getValue: (doc) => doc.followers?.tiktok, order: 'desc' },
	{ value: 'price_asc', label: 'Les - chers', getValue: (doc) => Number(doc.fees), order: 'asc' },
	{ value: 'price_desc', label: 'Les + chers', getValue: (doc) => Number(doc.fees), order: 'desc' },
	{ value: 'engagement', label: "Le + de taux d'engagement", getValue: (doc) => doc.engagementRate, order: 'desc' },
	{ value: 'views', label: 'Le + de vues moyennes', getValue: (doc) => doc.avgViews, order: 'desc' },
	{ value: 'recent', label: 'Les plus récents', getValue: (doc) => new Date(doc.createdAt || 0).getTime(), order: 'desc' }
]

const sortTalents = (list, sortValue) => {
	const option = SORT_OPTIONS.find((opt) => opt.value === sortValue) || SORT_OPTIONS[0]
	const hasValue = (value) => value !== null && value !== undefined && Number.isFinite(value)
	return [...list].sort((a, b) => {
		const va = option.getValue(a)
		const vb = option.getValue(b)
		if (!hasValue(va) || !hasValue(vb)) return hasValue(vb) - hasValue(va)
		return option.order === 'asc' ? va - vb : vb - va
	})
}

const Talents = () => {

	const {speciality} = useParams()
	const [searchParams] = useSearchParams()
	const location = useLocation()
	const [filterDoc, setFilterDoc] = useState([])
  const navigate = useNavigate()

	const {doctors, doctorsLoading} = useContext(AppContext)
	const { currentUser, userType } = useAuth()
	const canSeeStats = useCanSeeStats()

	const categoryParam = searchParams.get('category')
	const maxPrice = searchParams.get('maxPrice')
	const sort = searchParams.get('sort')
	const activeSort = SORT_OPTIONS.some((opt) => opt.value === sort) ? sort : 'popular'
	const activeCategory = speciality || categoryParam
	const typeParam = searchParams.get('type')
	const activeType = typeParam === 'ugc' ? 'ugc' : 'influenceur'
	const searchQuery = (searchParams.get('search') || '').trim()
	const hasActiveFilters = Boolean(activeCategory || maxPrice || sort || searchQuery)
	const [searchInput, setSearchInput] = useState(searchQuery)
	useEffect(() => { setSearchInput(searchQuery) }, [searchQuery])

	// Change de catégorie tout en conservant les autres filtres actifs (tri, prix, recherche).
	const goToCategory = (categoryValue) => {
		const params = new URLSearchParams(searchParams)
		params.delete('category')
		const path = categoryValue ? `/talents/${encodeURIComponent(categoryValue)}` : '/talents'
		const qs = params.toString()
		navigate(qs ? `${path}?${qs}` : path)
	}

	// Critères de recommandation pour une marque : soit reçus juste après l'onboarding
	// (state de navigation), soit relus depuis son profil lors des visites suivantes.
	const [brandCriteria, setBrandCriteria] = useState(
		location.state?.highlightRecommended ? location.state : null
	)

	useEffect(() => {
		if (brandCriteria || userType !== 'brand' || !currentUser) return

		const loadCriteria = async () => {
			try {
				const snap = await getDoc(doc(db, 'brands', currentUser.uid))
				const onboarding = snap.exists() ? snap.data()?.onboarding : null
				if (onboarding?.completed) {
					setBrandCriteria({ budget: onboarding.budget, influencerTypes: onboarding.influencerTypes || [] })
				}
			} catch (error) {
				console.error('Erreur lors du chargement des critères de recommandation:', error)
			}
		}

		loadCriteria()
	}, [brandCriteria, userType, currentUser])

	// N'affiche la recommandation que sur la vue par défaut (aucun filtre actif), pour ne
	// pas interférer avec une recherche explicite de la marque.
	const recommended = useMemo(() => {
		if (!brandCriteria || hasActiveFilters) return null
		return pickBestMatch(doctors, brandCriteria)
	}, [doctors, brandCriteria, hasActiveFilters])

	// Bascule entre Influenceurs et Créateurs UGC, en conservant les autres filtres actifs.
	const goToType = (type) => {
		const params = new URLSearchParams(searchParams)
		if (type === 'ugc') {
			params.set('type', 'ugc')
		} else {
			params.delete('type')
		}
		const qs = params.toString()
		navigate(qs ? `${location.pathname}?${qs}` : location.pathname)
	}

	// Change le tri en conservant les autres filtres actifs ; le tri par défaut n'apparaît pas dans l'URL.
	const goToSort = (sortValue) => {
		const params = new URLSearchParams(searchParams)
		if (sortValue === 'popular') {
			params.delete('sort')
		} else {
			params.set('sort', sortValue)
		}
		const qs = params.toString()
		navigate(qs ? `${location.pathname}?${qs}` : location.pathname)
	}

  const applyFilter = () => {
    let filtered = doctors

    if (activeCategory) {
      filtered = filtered.filter(doc => doc.speciality?.toLowerCase() === activeCategory.toLowerCase())
    }

    filtered = filtered.filter(doc => (doc.creatorType || 'influenceur') === activeType)

    // Recherche par mot-clé (barre de recherche de l'accueil) : pseudo, catégorie ou ville.
    // Le vrai nom n'est jamais affiché publiquement, il n'est donc pas cherchable.
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(doc => [doc.tiktokUsername, doc.speciality, doc.city]
        .some(value => value?.toLowerCase().includes(q)))
    }

    if (maxPrice) {
      const max = Number(maxPrice)
      if (Number.isFinite(max)) {
        filtered = filtered.filter(doc => Number(doc.fees) <= max)
      }
    }

    setFilterDoc(sortTalents(filtered, activeSort))
  }

  useEffect(() =>{
    applyFilter()
  },[doctors, activeCategory, maxPrice, activeSort, activeType, searchQuery])

  // Le profil recommandé est épinglé en premier, sans être dupliqué plus bas dans la grille.
  const displayedDoc = recommended
    ? [recommended, ...filterDoc.filter((item) => item._id !== recommended._id)]
    : filterDoc

	const clearParam = (key) => {
		const params = new URLSearchParams(searchParams)
		params.delete(key)
		const qs = params.toString()
		navigate(qs ? `${location.pathname}?${qs}` : location.pathname)
	}

	const clearAll = () => navigate(activeType === 'ugc' ? '/talents?type=ugc' : '/talents')

	const submitSearch = (e) => {
		e.preventDefault()
		const params = new URLSearchParams(searchParams)
		const q = searchInput.trim()
		if (q) params.set('search', q)
		else params.delete('search')
		const qs = params.toString()
		navigate(qs ? `${location.pathname}?${qs}` : location.pathname)
	}

	const activeChips = [
		activeCategory && { key: 'category', label: activeCategory, onRemove: () => goToCategory(null) },
		searchQuery && { key: 'search', label: `« ${searchQuery} »`, onRemove: () => { setSearchInput(''); clearParam('search') } },
		maxPrice && { key: 'maxPrice', label: `Moins de ${maxPrice} €`, onRemove: () => clearParam('maxPrice') }
	].filter(Boolean)

	return (
		<MotionConfig reducedMotion='user'>
		<div className='pt-10 md:pt-14 pb-20'>
			<SEO {...(activeCategory ? categorySeo(activeCategory) : PAGE_SEO.talents)} />

			{/* En-tête */}
			<motion.div
				initial={{ opacity: 0, y: 16 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, ease: 'easeOut' }}
				className='flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10'
			>
				<div>
					<p className='text-sm font-semibold uppercase tracking-wider text-primary-dark mb-3'>Nos talents</p>
					<h1 className='text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight'>
						{activeCategory ? `Influenceurs ${activeCategory}` : 'Trouvez votre créateur'}
					</h1>
					<p className='text-gray-600 text-lg mt-3'>{"Parcourez notre liste complète d'influenceurs de confiance."}</p>
				</div>
				<div role='radiogroup' aria-label='Type de créateur' className='inline-flex self-start md:self-auto rounded-full bg-gray-100 p-1'>
					{[{ id: 'influenceur', label: 'Influenceurs' }, { id: 'ugc', label: 'Créateurs UGC' }].map((type) => (
						<button
							key={type.id}
							role='radio'
							aria-checked={activeType === type.id}
							onClick={() => goToType(type.id)}
							className={`cursor-pointer relative px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${activeType === type.id ? 'text-white' : 'text-gray-600 hover:text-gray-900'}`}
						>
							{activeType === type.id && (
								<motion.span layoutId='talent-type-pill' className='absolute inset-0 rounded-full bg-gray-900' transition={{ type: 'spring', stiffness: 400, damping: 34 }} />
							)}
							<span className='relative'>{type.label}</span>
						</button>
					))}
				</div>
			</motion.div>

			{/* Recherche + catégorie */}
			<div className='flex flex-col md:flex-row gap-3 mb-5'>
				<form onSubmit={submitSearch} role='search' className='flex-1 flex items-center gap-2 rounded-full border border-gray-300 bg-white pl-4 pr-1.5 py-1.5 focus-within:border-gray-900 transition-colors duration-200'>
					<svg className='w-5 h-5 text-gray-400 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' /></svg>
					<label htmlFor='talent-search' className='sr-only'>Rechercher un créateur</label>
					<input
						id='talent-search'
						type='search'
						value={searchInput}
						onChange={(e) => setSearchInput(e.target.value)}
						placeholder='Pseudo, niche…'
						className='flex-1 min-w-0 py-1.5 text-base bg-transparent outline-none placeholder:text-gray-400'
					/>
					<button type='submit' className='cursor-pointer rounded-full bg-gray-900 text-white text-sm font-semibold px-5 py-2 hover:bg-gray-800 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'>
						Rechercher
					</button>
				</form>
				<label htmlFor='talent-category' className='sr-only'>Catégorie</label>
				<select
					id='talent-category'
					value={INFLUENCER_CATEGORIES.find((c) => c.toLowerCase() === activeCategory?.toLowerCase()) || ''}
					onChange={(e) => goToCategory(e.target.value || null)}
					className='cursor-pointer md:w-64 rounded-full border border-gray-300 bg-white px-5 py-3 text-base text-gray-900 outline-none focus-visible:border-gray-900 focus-visible:ring-2 focus-visible:ring-primary/40'
				>
					<option value=''>Toutes catégories</option>
					{INFLUENCER_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
				</select>
			</div>

			{/* Trier par */}
			<div className='flex items-center gap-3 mb-6'>
				<span className='text-sm font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap flex-shrink-0'>Trier par</span>
				<div className='flex gap-2 overflow-x-auto pb-1 scrollbar-hide lg:flex-wrap lg:overflow-visible'>
					{SORT_OPTIONS.map((option) => (
						<button
							key={option.value}
							onClick={() => goToSort(option.value)}
							aria-pressed={activeSort === option.value}
							className={`cursor-pointer px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
								activeSort === option.value
									? 'bg-primary text-gray-900'
									: 'bg-white border border-gray-200 text-gray-700 hover:border-gray-400'
							}`}
						>
							{option.label}
						</button>
					))}
				</div>
			</div>

			{/* Nombre de résultats + filtres actifs */}
			<div className='flex flex-wrap items-center gap-2 mb-8 min-h-[2.25rem]'>
				<p className='text-sm text-gray-600 mr-2' aria-live='polite'>
					{doctorsLoading ? 'Chargement…' : `${displayedDoc.length} créateur${displayedDoc.length > 1 ? 's' : ''}`}
				</p>
				<AnimatePresence initial={false}>
					{activeChips.map((chip) => (
						<motion.span
							key={chip.key}
							layout
							initial={{ opacity: 0, scale: 0.9 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.9 }}
							className='inline-flex items-center gap-1 rounded-full bg-gray-900 text-white pl-3.5 pr-1 py-1 text-sm'
						>
							{chip.label}
							<button type='button' onClick={chip.onRemove} aria-label={`Retirer le filtre ${chip.label}`} className='cursor-pointer w-7 h-7 rounded-full hover:bg-white/15 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'>
								<svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2.5' d='M6 18L18 6M6 6l12 12' /></svg>
							</button>
						</motion.span>
					))}
				</AnimatePresence>
				{activeChips.length > 1 && (
					<button type='button' onClick={clearAll} className='cursor-pointer text-sm font-semibold text-gray-900 underline underline-offset-4 ml-1'>Tout effacer</button>
				)}
			</div>

			{recommended && (
				<div className='flex items-center gap-3 mb-8 rounded-2xl bg-primary/10 border border-primary/30 px-5 py-4'>
					<svg className='w-6 h-6 text-primary-dark flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' /></svg>
					<p className='text-gray-900 font-medium'>
						En fonction de votre budget et de votre niche, voici le créateur que nous vous recommandons en priorité.
					</p>
				</div>
			)}

			{/* Grille : les cartes glissent vers leur nouvelle place au changement de tri/filtre */}
			{doctorsLoading ? (
				<ul className='grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5'>
					{Array.from({ length: 8 }).map((_, i) => <li key={i} className='aspect-[3/4] rounded-3xl bg-gray-100 animate-pulse' />)}
				</ul>
			) : displayedDoc.length > 0 ? (
				<motion.ul layout className='grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5'>
					<AnimatePresence mode='popLayout'>
						{displayedDoc.map((item, index) => {
							const isRecommended = recommended && item._id === recommended._id
							const displayName = item.tiktokUsername ? `@${item.tiktokUsername}` : item.speciality
							return (
								<motion.li
									key={item._id}
									layout
									initial={{ opacity: 0, scale: 0.94, y: 12 }}
									animate={{ opacity: 1, scale: 1, y: 0 }}
									exit={{ opacity: 0, scale: 0.94 }}
									transition={{ layout: { type: 'spring', stiffness: 350, damping: 34 }, duration: 0.3, delay: Math.min(index, 8) * 0.03 }}
								>
									<Link
										to={`/influencer/${item._id}`}
										onClick={() => window.scrollTo(0, 0)}
										className={`group block rounded-3xl overflow-hidden bg-white border transition-shadow duration-300 hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary ${isRecommended ? 'border-primary ring-2 ring-primary/40' : 'border-gray-200'}`}
									>
										<div className='relative aspect-[4/5] overflow-hidden bg-gray-100'>
											<SmartImage width={320}
												src={item.image}
												alt={displayName}
												loading={index < 8 ? 'eager' : 'lazy'}
												className='w-full h-full object-cover transition-transform duration-500 group-hover:scale-105'
											/>
											<span className={`absolute top-3 left-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${isRecommended ? 'bg-primary text-gray-900' : 'bg-white/90 backdrop-blur text-gray-900'}`}>
												{isRecommended ? 'Recommandé pour vous' : (
													<>
														<span className='w-1.5 h-1.5 rounded-full bg-green-500' aria-hidden='true'></span>
														Disponible
													</>
												)}
											</span>
											{canSeeStats ? item.followers?.tiktok > 0 && (
												<span className='absolute bottom-3 left-3 rounded-full bg-black/60 backdrop-blur text-white px-2.5 py-1 text-xs font-semibold'>
													{compactFormat.format(item.followers.tiktok)} abonnés
												</span>
											) : (
												<span className='absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur text-white px-2.5 py-1 text-xs font-semibold'>
													<svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' /></svg>
													Stats réservées aux membres
												</span>
											)}
										</div>
										<div className='p-4'>
											<p className='text-gray-900 text-base sm:text-lg font-semibold truncate'>{displayName}</p>
											<p className='text-gray-500 text-sm truncate'>{item.speciality}</p>
											<div className='flex items-end justify-between gap-2 mt-3'>
												<p className='text-gray-900 text-lg font-bold whitespace-nowrap'>{item.fees} €</p>
												{canSeeStats && item.engagementRate != null && (
													<p className='text-xs text-gray-500 text-right whitespace-nowrap'>
														<span className='block font-semibold text-gray-900 text-sm'>{item.engagementRate.toLocaleString('fr-FR')} %</span>
														engagement
													</p>
												)}
											</div>
										</div>
									</Link>
								</motion.li>
							)
						})}
					</AnimatePresence>
				</motion.ul>
			) : (
				<div className='text-center py-20 rounded-3xl border border-dashed border-gray-300'>
					<p className='text-lg font-semibold text-gray-900 mb-2'>Aucun talent ne correspond à ces filtres.</p>
					<p className='text-gray-600 mb-6'>Essayez une autre catégorie ou retirez un filtre.</p>
					<button type='button' onClick={clearAll} className='cursor-pointer rounded-full bg-gray-900 text-white px-6 py-3 font-semibold hover:bg-gray-800 transition-colors duration-200'>
						Voir tous les talents
					</button>
				</div>
			)}
		</div>
		</MotionConfig>
	)
}

export default Talents
