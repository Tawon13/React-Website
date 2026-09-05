import React, { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import { INFLUENCER_CATEGORIES } from '../constants/categories'
import SEO from '../components/SEO'

const Talents = () => {

	const {speciality} = useParams()
	const [searchParams] = useSearchParams()
	const [filterDoc, setFilterDoc] = useState([])
	const [showFilter, setShowFilter] = useState(false)
  const navigate = useNavigate()

	const {doctors, doctorsLoading} = useContext(AppContext)

	const categoryParam = searchParams.get('category')
	const maxPrice = searchParams.get('maxPrice')
	const sort = searchParams.get('sort')
	const activeCategory = speciality || categoryParam

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

	return (
		<div className='py-8'>
			<SEO
				title='Nos Talents'
				description="Parcourez la liste complète des influenceurs vérifiés sur Collabzz et trouvez le créateur idéal pour votre marque."
				path='/talents'
			/>
			<h1 className='text-3xl font-medium text-center mb-2'>Nos Talents</h1>
			<p className='text-gray-600 text-center mb-8'>Parcourez notre liste complète d'influenceurs de confiance.</p>

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
					{filterDoc.map((item, index) => (
						<div
							onClick={() => {navigate(`/influencer/${item._id}`); scrollTo(0,0)}}
							className='border border-blue-200 rounded-xl overflow-hidden cursor-pointer hover:translate-y-[-10px] transition-all duration-500'
							key={index}
						>
							<img className='bg-blue-50 w-full h-64 object-cover' src={item.image} alt={`Image of ${item.name}`} />
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
					))}
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
