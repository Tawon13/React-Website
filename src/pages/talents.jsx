import React, { useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { AppContext } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { INFLUENCER_CATEGORIES } from '../constants/categories'
import { pickBestMatch } from '../utils/matching'
import SEO from '../components/SEO'

const Talents = () => {

	const {speciality} = useParams()
	const [searchParams] = useSearchParams()
	const location = useLocation()
	const [filterDoc, setFilterDoc] = useState([])
	const [showFilter, setShowFilter] = useState(false)
  const navigate = useNavigate()

	const {doctors, doctorsLoading} = useContext(AppContext)
	const { currentUser, userType } = useAuth()

	const categoryParam = searchParams.get('category')
	const maxPrice = searchParams.get('maxPrice')
	const sort = searchParams.get('sort')
	const activeCategory = speciality || categoryParam
	const hasActiveFilters = Boolean(activeCategory || maxPrice || sort)

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

	// Change de catégorie tout en conservant les autres filtres actifs (tri, prix).
	const goToCategory = (categoryValue) => {
		const params = new URLSearchParams(searchParams)
		params.delete('category')
		const path = categoryValue ? `/talents/${categoryValue}` : '/talents'
		const qs = params.toString()
		navigate(qs ? `${path}?${qs}` : path)
	}

  const applyFilter = () => {
    let filtered = doctors

    if (activeCategory) {
      filtered = filtered.filter(doc => doc.speciality?.toLowerCase() === activeCategory.toLowerCase())
    }

    if (maxPrice) {
      const max = Number(maxPrice)
      if (Number.isFinite(max)) {
        filtered = filtered.filter(doc => Number(doc.fees) <= max)
      }
    }

    if (sort === 'popular') {
      filtered = [...filtered].sort((a, b) => (b.followers?.tiktok || 0) - (a.followers?.tiktok || 0))
    } else if (sort === 'recent') {
      filtered = [...filtered].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    }

    setFilterDoc(filtered)
  }

  useEffect(() =>{
    applyFilter()
  },[doctors, activeCategory, maxPrice, sort])

  // Le profil recommandé est épinglé en premier, sans être dupliqué plus bas dans la grille.
  const displayedDoc = recommended
    ? [recommended, ...filterDoc.filter((item) => item._id !== recommended._id)]
    : filterDoc

	return (
		<div className='py-8'>
			<SEO
				title='Nos Talents'
				description="Parcourez la liste complète des influenceurs vérifiés sur Collabzz et trouvez le créateur idéal pour votre marque."
				path='/talents'
			/>
			<h1 className='text-3xl font-medium text-center mb-2'>Nos Talents</h1>
			<p className='text-gray-600 text-center mb-8'>Parcourez notre liste complète d'influenceurs de confiance.</p>

			{recommended && (
				<div className='max-w-2xl mx-auto mb-8 bg-primary/5 border border-primary/20 rounded-xl px-5 py-4 text-center'>
					<p className='text-gray-800 font-medium'>
						✨ En fonction de votre budget et de votre niche, voici le créateur que nous vous recommandons en priorité.
					</p>
				</div>
			)}

			<div className='flex flex-col sm:flex-row items-start gap-5 mt-5'>
				{/* Filter sidebar */}
				<div className='w-full sm:w-56 flex-shrink-0'>
					<h2 className='hidden sm:block text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3'>Catégorie</h2>
					<div className='flex sm:flex-col gap-2 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0 scrollbar-hide'>
						<button
							onClick={() => goToCategory(null)}
							className={`px-4 py-2 rounded-full sm:rounded-lg text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
								!activeCategory
									? 'bg-gray-900 text-white'
									: 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300'
							}`}
						>
							Toutes catégories
						</button>
						{INFLUENCER_CATEGORIES.map((cat) => (
							<button
								key={cat}
								onClick={() => goToCategory(cat)}
								className={`px-4 py-2 rounded-full sm:rounded-lg text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
									activeCategory?.toLowerCase() === cat.toLowerCase()
										? 'bg-gray-900 text-white'
										: 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300'
								}`}
							>
								{cat}
							</button>
						))}
					</div>
				</div>

				{/* Talents Grid */}
				<div className='w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 gap-y-6'>
					{displayedDoc.map((item) => {
						const isRecommended = recommended && item._id === recommended._id
						return (
							<div
								onClick={() => {navigate(`/influencer/${item._id}`); scrollTo(0,0)}}
								className={`border rounded-xl overflow-hidden cursor-pointer hover:translate-y-[-10px] transition-all duration-500 ${
									isRecommended ? 'border-primary ring-2 ring-primary/30' : 'border-blue-200'
								}`}
								key={item._id}
							>
								<div className='relative'>
									{isRecommended && (
										<span className='absolute top-2 left-2 bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full shadow'>
											⭐ Recommandé pour vous
										</span>
									)}
									<img className='bg-blue-50 w-full h-64 object-cover' src={item.image} alt={`Image of ${item.name}`} />
								</div>
								<div className='p-4'>
									<div className='flex items-center gap-2 text-sm text-center text-green-500'>
										<p className='w-2 h-2 bg-green-500 rounded-full'></p>
										<p>Disponible</p>
									</div>
									{item.tiktokUsername && (
										<p className='text-gray-900 text-lg font-medium'>@{item.tiktokUsername}</p>
									)}
									<p className='text-gray-600 text-sm'>{item.speciality}</p>
									<p className='text-primary text-lg font-semibold mt-2'>{item.fees}€</p>
								</div>
							</div>
						)
					})}
				</div>
			</div>

			{doctorsLoading ? (
				<div className='text-center py-20'>
					<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto'></div>
				</div>
			) : filterDoc.length === 0 && (
				<div className='text-center py-20'>
					<p className='text-gray-600'>Aucun talent ne correspond à ces filtres.</p>
				</div>
			)}
		</div>
	)
}

export default Talents
