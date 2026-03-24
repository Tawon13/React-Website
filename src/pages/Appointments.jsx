import React from 'react'
import { useParams } from 'react-router-dom'

const Appointments = () => {
  const { docId } = useParams()

  return (
    <div className='py-8'>
      <h1 className='text-2xl font-medium mb-2'>Rendez-vous</h1>
      <p className='text-gray-600'>Référence : {docId}</p>
    </div>
  )
}

export default Appointments
