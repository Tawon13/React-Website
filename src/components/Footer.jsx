import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom'

// Réseaux sociaux de Collabzz (aussi déclarés dans le balisage Organization de index.html).
const SOCIAL_LINKS = [
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/collabzz_france',
    icon: 'M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85C2.38 3.92 3.9 2.38 7.15 2.23 8.42 2.17 8.8 2.16 12 2.16zM12 0C8.74 0 8.33.01 7.05.07 2.7.27.27 2.69.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.62 6.78 6.98 6.98C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.2-4.35-2.62-6.78-6.98-6.98C15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 100 12.32 6.16 6.16 0 000-12.32zM12 16a4 4 0 110-8 4 4 0 010 8zm6.4-11.85a1.44 1.44 0 100 2.88 1.44 1.44 0 000-2.88z'
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/company/collabzz-france/',
    icon: 'M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 110-4.13 2.06 2.06 0 010 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z'
  }
]

const Footer = () => {
  const navigate = useNavigate()
  
  return (
    <div className='px-4 sm:px-6 md:mx-10'>
        <div className='flex flex-col sm:grid grid-cols-1 md:grid-cols-[3fr_1fr_1fr] gap-8 sm:gap-10 md:gap-14 my-10 mt-20 sm:mt-30 md:mt-40 text-sm'>
            {/*------------Left Section------------*/}
            <div>
                <img className='mb-4 sm:mb-5 w-32 sm:w-36 md:w-40' src={assets.logo} alt="" />
                <p className='w-full md:w-2/3 text-gray600 leading-6 text-sm'>
                    Collabzz connecte les marques avec les meilleurs influenceurs. 
                    Simplifiez vos collaborations et boostez votre visibilité en quelques clics.
                </p>
            </div>
            
            {/*------------Center Section------------*/}
            <div>
                <p className='text-lg sm:text-xl font-medium mb-4 sm:mb-5'>ENTREPRISE</p>
                <ul className='flex flex-col gap-2 text-gray600'>
                    <li onClick={() => navigate('/')} className='cursor-pointer hover:text-gray-900'>Accueil</li>
                    <li onClick={() => navigate('/about')} className='cursor-pointer hover:text-gray-900'>À propos</li>
                    <li onClick={() => navigate('/contact')} className='cursor-pointer hover:text-gray-900'>Contact</li>
                    <li onClick={() => navigate('/privacy')} className='cursor-pointer hover:text-gray-900'>Confidentialité</li>
                    <li onClick={() => navigate('/terms')} className='cursor-pointer hover:text-gray-900'>Conditions</li>
                    <li onClick={() => navigate('/mentions-legales')} className='cursor-pointer hover:text-gray-900'>Mentions légales</li>
                </ul>
            </div>
            
            {/*------------Right Section------------*/}
            <div>
                <p className='text-lg sm:text-xl font-medium mb-4 sm:mb-5'>CONTACTEZ-NOUS</p>
                <ul className='flex flex-col gap-2 text-gray600'>
                    <li className='break-all'><a href='mailto:contact@collabzz.com' className='hover:text-gray-900'>contact@collabzz.com</a></li>
                </ul>
                <div className='flex gap-3 mt-5'>
                    {SOCIAL_LINKS.map((social) => (
                        <a
                            key={social.label}
                            href={social.href}
                            target='_blank'
                            rel='noopener noreferrer'
                            aria-label={`Collabzz sur ${social.label}`}
                            className='w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
                        >
                            <svg className='w-[18px] h-[18px]' viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'><path d={social.icon} /></svg>
                        </a>
                    ))}
                </div>
            </div>
        </div>
        
        <div>
            <hr className='border-gray-300'/>
            <p className='py-4 sm:py-5 text-xs sm:text-sm text-center text-gray-600'>
                Copyright © 2024 Collabzz - Tous droits réservés.
            </p>
        </div>
    </div>
  )
}

export default Footer
