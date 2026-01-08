import React, { useState, useRef } from 'react'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from '../config/firebase'

const PortfolioGallery = ({ 
    userId, 
    photos = [], 
    onPhotosUpdated,
    maxPhotos = 12,
    maxSize = 5 // MB
}) => {
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState('')
    const [selectedPhoto, setSelectedPhoto] = useState(null)
    const fileInputRef = useRef(null)

    const handleAddPhotos = async (e) => {
        const files = Array.from(e.target.files)
        if (!files.length) return

        // Vérifier le nombre de photos
        if (photos.length + files.length > maxPhotos) {
            setError(`Vous ne pouvez pas avoir plus de ${maxPhotos} photos`)
            return
        }

        setError('')
        setUploading(true)

        try {
            const uploadPromises = files.map(async (file) => {
                // Vérifier le type
                if (!file.type.startsWith('image/')) {
                    throw new Error('Fichier non valide')
                }

                // Vérifier la taille
                if (file.size > maxSize * 1024 * 1024) {
                    throw new Error(`Taille max ${maxSize}MB`)
                }

                // Nom unique
                const timestamp = Date.now()
                const random = Math.random().toString(36).substring(7)
                const fileExtension = file.name.split('.').pop()
                const fileName = `${userId}_portfolio_${timestamp}_${random}.${fileExtension}`
                
                // Upload
                const storageRef = ref(storage, `portfolio/${fileName}`)
                const snapshot = await uploadBytes(storageRef, file)
                const downloadURL = await getDownloadURL(snapshot.ref)

                return {
                    url: downloadURL,
                    uploadedAt: new Date().toISOString(),
                    fileName: fileName
                }
            })

            const newPhotos = await Promise.all(uploadPromises)
            const updatedPhotos = [...photos, ...newPhotos]
            
            onPhotosUpdated(updatedPhotos)
            setError('')
        } catch (error) {
            console.error('Erreur upload:', error)
            setError('Erreur lors de l\'upload des photos')
        } finally {
            setUploading(false)
        }
    }

    const handleDeletePhoto = async (photoToDelete) => {
        try {
            setUploading(true)

            // Supprimer du Storage
            if (photoToDelete.url.includes('firebase')) {
                const photoRef = ref(storage, photoToDelete.url)
                await deleteObject(photoRef)
            }

            // Mettre à jour la liste
            const updatedPhotos = photos.filter(p => p.url !== photoToDelete.url)
            onPhotosUpdated(updatedPhotos)
            setSelectedPhoto(null)
        } catch (error) {
            console.error('Erreur suppression:', error)
            setError('Erreur lors de la suppression')
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className='w-full'>
            <div className='flex items-center justify-between mb-4'>
                <div>
                    <h3 className='text-lg font-semibold text-gray-900'>Portfolio</h3>
                    <p className='text-sm text-gray-500'>
                        {photos.length} / {maxPhotos} photos
                    </p>
                </div>

                {photos.length < maxPhotos && (
                    <button
                        type='button'
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className='px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors flex items-center gap-2'
                    >
                        <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
                        </svg>
                        Ajouter des photos
                    </button>
                )}
            </div>

            <input
                ref={fileInputRef}
                type='file'
                accept='image/jpeg,image/jpg,image/png,image/webp'
                multiple
                onChange={handleAddPhotos}
                className='hidden'
                disabled={uploading}
            />

            {error && (
                <div className='mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600'>
                    {error}
                </div>
            )}

            {/* Galerie de photos */}
            <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4'>
                {photos.map((photo, index) => (
                    <div 
                        key={photo.url}
                        className='relative group aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer border-2 border-gray-200 hover:border-primary transition-colors'
                        onClick={() => setSelectedPhoto(photo)}
                    >
                        <img 
                            src={photo.url} 
                            alt={`Portfolio ${index + 1}`}
                            className='w-full h-full object-cover'
                        />

                        {/* Overlay au hover */}
                        <div className='absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center'>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeletePhoto(photo)
                                }}
                                disabled={uploading}
                                className='opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white p-2 rounded-full hover:bg-red-600 disabled:opacity-50'
                            >
                                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                                </svg>
                            </button>
                        </div>
                    </div>
                ))}

                {/* Placeholder pour ajouter plus de photos */}
                {photos.length < maxPhotos && (
                    <button
                        type='button'
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className='aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-primary transition-colors flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                        <svg className='w-12 h-12' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
                        </svg>
                        <span className='text-sm font-medium'>Ajouter</span>
                    </button>
                )}
            </div>

            {uploading && (
                <div className='mt-4 flex items-center gap-2 text-primary'>
                    <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-primary'></div>
                    <span className='text-sm'>Upload en cours...</span>
                </div>
            )}

            <p className='mt-4 text-xs text-gray-500'>
                Formats acceptés : JPG, PNG, WEBP • Taille max : {maxSize}MB par photo
            </p>

            {/* Lightbox pour voir la photo en grand */}
            {selectedPhoto && (
                <div 
                    className='fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4'
                    onClick={() => setSelectedPhoto(null)}
                >
                    <button
                        onClick={() => setSelectedPhoto(null)}
                        className='absolute top-4 right-4 text-white hover:text-gray-300 transition-colors'
                    >
                        <svg className='w-8 h-8' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                        </svg>
                    </button>
                    
                    <img 
                        src={selectedPhoto.url} 
                        alt="Photo en grand"
                        className='max-w-full max-h-full object-contain'
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    )
}

export default PortfolioGallery
