import { useNavigate } from 'react-router-dom'
import { Reveal, darkBtn } from './PageKit'

const Banner = () => {
  const navigate = useNavigate()
  const goTo = (path) => {
    navigate(path)
    window.scrollTo(0, 0)
  }

  return (
    <Reveal className='relative overflow-hidden rounded-3xl bg-primary px-6 py-14 md:py-20 md:px-16 grid md:grid-cols-12 gap-8 items-center'>
      <div className='absolute -top-24 -right-16 w-80 h-80 bg-white/30 rounded-full blur-3xl' aria-hidden='true'></div>
      <h2 className='relative md:col-span-8 text-3xl md:text-5xl font-bold text-gray-900 leading-tight'>
        Collaborer avec des influenceurs {"n'a"} jamais été aussi simple !
      </h2>
      <div className='relative md:col-span-4 flex flex-col gap-3'>
        <button onClick={() => goTo('/login?isSignUp=true')} className={`${darkBtn} focus-visible:ring-gray-900 focus-visible:ring-offset-primary`}>
          Créer mon compte
        </button>
        <button
          onClick={() => goTo('/for-creators')}
          className='cursor-pointer border border-gray-900 text-gray-900 px-7 py-3.5 rounded-full font-semibold hover:bg-gray-900/10 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900'
        >
          Je suis créateur
        </button>
      </div>
    </Reveal>
  )
}

export default Banner
