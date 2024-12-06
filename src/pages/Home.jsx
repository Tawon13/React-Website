import React from 'react'
import Header from '../components/Header'
import SpecialityMenu from '../components/SpecialityMenu'
import TopDoctors from '../components/TopDoctors'
import Banner from '../components/Banner'
import Marques from '../components/marques'

const Home = () => {
  return (
    <div>
      <Header></Header>
        <SpecialityMenu/>
        <Marques/>
        <TopDoctors/>
        <Banner/>
    </div>
  )
}

export default Home
