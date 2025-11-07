import React from 'react'
import Header from '../components/Header'
import SpecialityMenu from '../components/SpecialityMenu'
import TopDoctors from '../components/TopInflu'
import Banner from '../components/Banner'
import Search from '../components/Search'
import Cards from '../components/Cards'

const Home = () => {
  return (
    <div>
      <Header></Header>
        {/* <Cards /> */}
        <Search/>
        <TopDoctors/>
        {/* <SpecialityMenu/> */}
        <Banner/>
    </div>
  )
}

export default Home
