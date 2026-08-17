import React, { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import { useFavorites } from '../context/FavoritesContext'

const Favorites = () => {
	const navigate = useNavigate()
	const { doctors, doctorsLoading } = useContext(AppContext)
	const { favorites, toggleFavorite } = useFavorites()

	const favoriteDoctors = doctors.filter((doc) => favorites.includes(doc._id))

	return (
		<div className='py-8'>
			<h1 className='text-3xl font-medium text-center mb-2'>Mes Favoris</h1>
			<p className='text-gray-600 text-center mb-8'>Retrouvez ici les profils d'influenceurs que vous avez enregistrés.</p>

			{doctorsLoading ? (
				<div className='text-center py-20'>
					<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto'></div>
				</div>
			) : favoriteDoctors.length === 0 ? (
				<div className='text-center py-20'>
					<p className='text-gray-600 mb-4'>Vous n'avez pas encore enregistré de profil.</p>
					<button
						onClick={() => navigate('/talents')}
						className='px-5 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors'
					>
						Découvrir les talents
					</button>
				</div>
			) : (
				<div className='w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 gap-y-6'>
					{favoriteDoctors.map((item) => (
						<div
							className='relative border border-blue-200 rounded-xl overflow-hidden hover:translate-y-[-10px] transition-all duration-500'
							key={item._id}
						>
							<button
								onClick={(e) => {
									e.stopPropagation()
									toggleFavorite(item._id)
								}}
								className='absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 text-primary hover:bg-white shadow-sm'
								title='Retirer des favoris'
							>
								<svg className='w-4 h-4' fill='currentColor' stroke='currentColor' viewBox='0 0 24 24'>
									<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' />
								</svg>
							</button>
							<div
								onClick={() => { navigate(`/influencer/${item._id}`); scrollTo(0, 0) }}
								className='cursor-pointer'
							>
								<img className='bg-blue-50 w-full h-64 object-cover' src={item.image} alt={item.tiktokUsername ? `@${item.tiktokUsername}` : 'Influenceur'} />
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
						</div>
					))}
				</div>
			)}
		</div>
	)
}

export default Favorites
