import { MotionConfig } from 'motion/react'
import Header from '../components/Header'
import TopInflu from '../components/TopInflu'
import CategoryGrid from '../components/CategoryGrid'
import Features from '../components/Features'
import FAQ from '../components/FAQ'
import Banner from '../components/Banner'
import SEO from '../components/SEO'
import { PAGE_SEO } from '../constants/seo'

const Home = () => {
  return (
    <MotionConfig reducedMotion='user'>
      <SEO {...PAGE_SEO.home} />
      <Header />
      <div className='py-20 md:py-28 space-y-24 md:space-y-32'>
        <TopInflu />
        <CategoryGrid />
        <Features />
        <FAQ />
        <Banner />
      </div>
    </MotionConfig>
  )
}

export default Home
