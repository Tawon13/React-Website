import { useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, MotionConfig } from 'motion/react'
import { AppContext } from '../context/AppContext'
import { useFavorites } from '../context/FavoritesContext'
import SEO from '../components/SEO'

const HEART_PATH = 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z'

const Favorites = () => {
	const navigate = useNavigate()
	const { doctors, doctorsLoading } = useContext(AppContext)
	const { favorites, toggleFavorite } = useFavorites()

	const favoriteDoctors = doctors.filter((doc) => favorites.includes(doc._id))

	const goToTalents = () => {
		navigate('/talents')
		window.scrollTo(0, 0)
	}

	return (
		<MotionConfig reducedMotion='user'>
		<div className='pt-10 md:pt-14 pb-20'>
			<SEO title='Mes Favoris' noindex />

			<motion.div
				initial={{ opacity: 0, y: 16 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, ease: 'easeOut' }}
				className='flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10'
			>
				<div>
					<p className='text-sm font-semibold uppercase tracking-wider text-primary-dark mb-3'>Mes favoris</p>
					<h1 className='text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight'>Vos créateurs enregistrés</h1>
					<p className='text-gray-600 text-lg mt-3'>{"Retrouvez ici les profils d'influenceurs que vous avez enregistrés."}</p>
				</div>
				{favoriteDoctors.length > 0 && (
					<button
						onClick={goToTalents}
						className='cursor-pointer self-start md:self-auto rounded-full border border-gray-300 px-6 py-3 font-semibold text-gray-900 hover:border-gray-900 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
					>
						Découvrir d’autres talents
					</button>
				)}
			</motion.div>

			{doctorsLoading ? (
				<ul className='grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5'>
					{Array.from({ length: 4 }).map((_, i) => <li key={i} className='aspect-[3/4] rounded-3xl bg-gray-100 animate-pulse' />)}
				</ul>
			) : favoriteDoctors.length === 0 ? (
				<motion.div
					initial={{ opacity: 0, scale: 0.98 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.4 }}
					className='flex flex-col items-center text-center py-20 px-6 rounded-3xl border border-dashed border-gray-300'
				>
					<motion.div
						initial={{ scale: 0.6 }}
						animate={{ scale: 1 }}
						transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.15 }}
						className='w-16 h-16 rounded-2xl bg-primary/15 text-primary-dark flex items-center justify-center mb-6'
					>
						<svg className='w-8 h-8' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'>
							<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d={HEART_PATH} />
						</svg>
					</motion.div>
					<p className='text-xl font-semibold text-gray-900 mb-2'>{"Vous n'avez pas encore enregistré de profil."}</p>
					<p className='text-gray-600 mb-8 max-w-md'>
						Cliquez sur « Enregistrer » depuis le profil d’un créateur pour le retrouver ici.
					</p>
					<button
						onClick={goToTalents}
						className='cursor-pointer rounded-full bg-gray-900 text-white px-7 py-3.5 font-semibold hover:bg-gray-800 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
					>
						Découvrir les talents
					</button>
				</motion.div>
			) : (
				<>
					<p className='text-sm text-gray-600 mb-5' aria-live='polite'>
						{favoriteDoctors.length} créateur{favoriteDoctors.length > 1 ? 's' : ''} enregistré{favoriteDoctors.length > 1 ? 's' : ''}
					</p>
					<motion.ul layout className='grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5'>
						<AnimatePresence mode='popLayout'>
							{favoriteDoctors.map((item, index) => {
								const displayName = item.tiktokUsername ? `@${item.tiktokUsername}` : item.speciality
								return (
									<motion.li
										key={item._id}
										layout
										initial={{ opacity: 0, y: 16 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, scale: 0.9 }}
										transition={{ layout: { type: 'spring', stiffness: 350, damping: 34 }, duration: 0.3, delay: Math.min(index, 8) * 0.04 }}
										className='relative'
									>
										<button
											type='button'
											onClick={() => toggleFavorite(item._id)}
											aria-label={`Retirer ${displayName} des favoris`}
											className='cursor-pointer absolute top-3 right-3 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/90 backdrop-blur text-primary-dark shadow hover:scale-110 transition-transform duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
										>
											<svg className='w-5 h-5' fill='currentColor' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'>
												<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d={HEART_PATH} />
											</svg>
										</button>
										<Link
											to={`/influencer/${item._id}`}
											onClick={() => window.scrollTo(0, 0)}
											className='group block rounded-3xl overflow-hidden bg-white border border-gray-200 transition-shadow duration-300 hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary'
										>
											<div className='relative aspect-[4/5] overflow-hidden bg-gray-100'>
												<img
													src={item.image}
													alt={displayName}
													loading='lazy'
													className='w-full h-full object-cover transition-transform duration-500 group-hover:scale-105'
												/>
												<span className='absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-white/90 backdrop-blur px-2.5 py-1 text-xs font-semibold text-gray-900'>
													<span className='w-1.5 h-1.5 rounded-full bg-green-500' aria-hidden='true'></span>
													Disponible
												</span>
											</div>
											<div className='p-4'>
												<p className='text-gray-900 text-base sm:text-lg font-semibold truncate'>{displayName}</p>
												<p className='text-gray-500 text-sm truncate'>{item.speciality}</p>
												<p className='text-gray-900 text-lg font-bold mt-3 whitespace-nowrap'>{item.fees} €</p>
											</div>
										</Link>
									</motion.li>
								)
							})}
						</AnimatePresence>
					</motion.ul>
					<p className='text-xs text-gray-500 mt-8'>Vos favoris sont enregistrés sur cet appareil.</p>
				</>
			)}
		</div>
		</MotionConfig>
	)
}

export default Favorites
