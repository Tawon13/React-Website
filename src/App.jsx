import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Talents from './pages/talents'
import LoginInfluencer from './pages/LoginInfluencer'
import LoginBrand from './pages/LoginBrand'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import About from './pages/about'
import Contact from './pages/contact'
import MyProfile from './pages/my_profil'
import MyAppointment from './pages/my_appointment'
import Appointments from './pages/Appointments'
import InfluencerProfile from './pages/InfluencerProfile'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'
import Admin from './pages/Admin'
import Messages from './pages/Messages'
import Cart from './pages/Cart'
import ForCreators from './pages/ForCreators'
import ForBrands from './pages/ForBrands'
import BrandOnboarding from './pages/BrandOnboarding'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

const App = () => {
  return (
    <div>
      <Routes>
        {/* Routes without Header/Footer */}
        <Route path='/login-influencer' element={<LoginInfluencer />} />
        <Route path='/login-brand' element={<LoginBrand />} />
        <Route path='/forgot-password' element={<ForgotPassword />} />
        <Route path='/reset-password' element={<ResetPassword />} />
        
        {/* Routes with Header/Footer */}
        <Route path='*' element={
          <div className='mx-4 sm:mx-[10%]'>
            <Navbar />
            <Routes>
              <Route path='/' element={<Home />} />
              <Route path='/talents' element={<Talents />} />
              <Route path='/talents/:speciality' element={<Talents />} />
              <Route path='/influencer/:influencerId' element={<InfluencerProfile />} />
              <Route path='/for-creators' element={<ForCreators />} />
              <Route path='/for-brands' element={<ForBrands />} />
              <Route path='/brand-onboarding' element={<BrandOnboarding />} />
              <Route path='/about' element={<About />} />
              <Route path='/contact' element={<Contact />} />
              <Route path='/my-profile' element={<MyProfile />} />
              <Route path='/my-appointments' element={<MyAppointment />} />
              <Route path='/appointment/:docId' element={<Appointments />} />
              <Route path='/terms' element={<Terms />} />
              <Route path='/privacy' element={<Privacy />} />
              <Route path='/admin' element={<Admin />} />
              <Route path='/messages' element={<Messages />} />
              <Route path='/cart' element={<Cart />} />
            </Routes>
            <Footer/>
          </div>
        } />
      </Routes>
    </div>
  )
}

export default App
