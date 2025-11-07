import React, { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppContext } from '../context/AppContext'

const Talents = () => {

	const {speciality} = useParams()
	const [filterDoc, setFilterDoc] = useState([])
	const [showFilter, setShowFilter] = useState(false)
  const navigate = useNavigate()

	const {doctors} = useContext(AppContext)

  const applyFilter = () => {
    if (speciality) {
      setFilterDoc(doctors.filter(doc => doc.speciality === speciality))
    } else {
      setFilterDoc(doctors)
    }
  }

  useEffect(() =>{
    applyFilter()
  },[doctors,speciality])
    
	return (
		<div className='py-8'>
			<h1 className='text-3xl font-medium text-center mb-2'>Nos Talents</h1>
			<p className='text-gray-600 text-center mb-8'>Parcourez notre liste complète d'influenceurs de confiance.</p>
			
			<div className='flex flex-col sm:flex-row items-start gap-5 mt-5'>
				{/* Filter sidebar */}
				<button 
					onClick={() => setShowFilter(!showFilter)} 
					className={`py-1 px-3 border rounded text-sm transition-all sm:hidden ${showFilter ? 'bg-primary text-white' : ''}`}
				>
					Filtres
				</button>
				
				<div className={`flex-col gap-4 text-sm text-gray-600 ${showFilter ? 'flex' : 'hidden sm:flex'}`}>
					<p onClick={() => speciality === 'Fashion' ? navigate('/talents') : navigate('/talents/Fashion')} 
						 className={`w-[94vw] sm:w-auto pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${speciality === 'Fashion' ? 'bg-indigo-50 text-black' : ''}`}>
						Fashion
					</p>
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
								<p className='text-gray-900 text-lg font-medium'>{item.name}</p>
								<p className='text-gray-600 text-sm'>{item.speciality}</p>
								<p className='text-primary text-lg font-semibold mt-2'>${item.fees}</p>
							</div>
						</div>
					))}
				</div>
			</div>

			{filterDoc.length === 0 && (
				<div className='text-center py-20'>
					<p className='text-gray-600'>Aucun talent trouvé pour cette catégorie.</p>
				</div>
			)}
		</div>
	)
}

export default Talents
