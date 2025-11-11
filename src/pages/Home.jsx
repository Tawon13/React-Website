import React from 'react'
import Header from '../components/Header'
import SpecialityMenu from '../components/SpecialityMenu'
import TopDoctors from '../components/TopInflu'
import Banner from '../components/Banner'
import Search from '../components/Search'
import Cards from '../components/Cards'
import Features from '../components/Features'

const Home = () => {
  return (
    <div>
      <Header></Header>
        {/* <Cards /> */}
        <Search/>
        <TopDoctors/>
        <Features/>
        {/* <SpecialityMenu/> */}
        <Banner/>
    </div>
  )
}

export default Home
