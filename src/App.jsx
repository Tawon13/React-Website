import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import CookieConsent from './components/CookieConsent'
import ScrollToTop from './components/ScrollToTop'

// Pages chargées à la demande : un visiteur de l'accueil ne télécharge ni l'admin, ni la
// messagerie, ni les formulaires d'inscription. L'accueil reste dans le bundle initial.
const Talents = lazy(() => import('./pages/talents'))
const Login = lazy(() => import('./pages/Login'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const About = lazy(() => import('./pages/about'))
const Contact = lazy(() => import('./pages/contact'))
const MyProfile = lazy(() => import('./pages/my_profil'))
const MyAppointment = lazy(() => import('./pages/my_appointment'))
const Appointments = lazy(() => import('./pages/Appointments'))
const InfluencerProfile = lazy(() => import('./pages/InfluencerProfile'))
const Terms = lazy(() => import('./pages/Terms'))
const Privacy = lazy(() => import('./pages/Privacy'))
const MentionsLegales = lazy(() => import('./pages/MentionsLegales'))
const Admin = lazy(() => import('./pages/Admin'))
const Messages = lazy(() => import('./pages/Messages'))
const Cart = lazy(() => import('./pages/Cart'))
const Favorites = lazy(() => import('./pages/Favorites'))
const ForCreators = lazy(() => import('./pages/ForCreators'))
const ForBrands = lazy(() => import('./pages/ForBrands'))
const BrandOnboarding = lazy(() => import('./pages/BrandOnboarding'))
const BrandRecommendation = lazy(() => import('./pages/BrandRecommendation'))
const InfluencerOnboarding = lazy(() => import('./pages/InfluencerOnboarding'))
const NotFound = lazy(() => import('./pages/NotFound'))

const PageLoader = () => (
  <div className='flex justify-center py-32' role='status' aria-label='Chargement de la page'>
    <div className='w-10 h-10 rounded-full border-2 border-gray-200 border-t-gray-900 animate-spin' />
  </div>
)

const App = () => {
  return (
    <div>
      <ScrollToTop />
      <CookieConsent />
      <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Routes without Header/Footer */}
        <Route path='/login' element={<Login />} />
        <Route path='/login-influencer' element={<Login />} />
        <Route path='/login-brand' element={<Login />} />
        <Route path='/forgot-password' element={<ForgotPassword />} />
        <Route path='/reset-password' element={<ResetPassword />} />
        <Route path='/brand-onboarding' element={<BrandOnboarding />} />
        <Route path='/influencer-onboarding' element={<InfluencerOnboarding />} />
        
        {/* Routes with Header/Footer */}
        <Route path='*' element={
          <div className='mx-4 sm:mx-[10%]'>
            <Navbar />
            <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path='/' element={<Home />} />
              <Route path='/talents' element={<Talents />} />
              <Route path='/talents/:speciality' element={<Talents />} />
              <Route path='/influencer/:influencerId' element={<InfluencerProfile />} />
              <Route path='/for-creators' element={<ForCreators />} />
              <Route path='/for-brands' element={<ForBrands />} />
              <Route path='/brand-recommendation' element={<BrandRecommendation />} />
              <Route path='/about' element={<About />} />
              <Route path='/contact' element={<Contact />} />
              <Route path='/my-profile' element={<MyProfile />} />
              <Route path='/my-appointments' element={<MyAppointment />} />
              <Route path='/appointment/:docId' element={<Appointments />} />
              <Route path='/terms' element={<Terms />} />
              <Route path='/privacy' element={<Privacy />} />
              <Route path='/mentions-legales' element={<MentionsLegales />} />
              <Route path='/admin' element={<Admin />} />
              <Route path='/messages' element={<Messages />} />
              <Route path='/cart' element={<Cart />} />
              <Route path='/favoris' element={<Favorites />} />
              <Route path='*' element={<NotFound />} />
            </Routes>
            </Suspense>
            <Footer/>
          </div>
        } />
      </Routes>
      </Suspense>
    </div>
  )
}

export default App
