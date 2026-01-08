import React, { useState, useRef } from 'react'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from '../config/firebase'

const PhotoUpload = ({ 
    userId, 
    currentPhotoURL, 
    onPhotoUploaded, 
    label = "Photo de profil",
    folder = "profile_photos",
    maxSize = 5, // MB
    acceptedFormats = "image/jpeg,image/jpg,image/png,image/webp"
}) => {
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState('')
    const [preview, setPreview] = useState(currentPhotoURL || '')
    const fileInputRef = useRef(null)

    const handleFileSelect = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        setError('')

        // Vérifier le type de fichier
        if (!file.type.startsWith('image/')) {
            setError('Veuillez sélectionner une image')
            return
        }

        // Vérifier la taille du fichier
        if (file.size > maxSize * 1024 * 1024) {
            setError(`L'image ne doit pas dépasser ${maxSize}MB`)
            return
        }

        try {
            setUploading(true)

            // Créer une preview locale
            const reader = new FileReader()
            reader.onloadend = () => {
                setPreview(reader.result)
            }
            reader.readAsDataURL(file)

            // Créer un nom de fichier unique
            const timestamp = Date.now()
            const fileExtension = file.name.split('.').pop()
            const fileName = `${userId}_${timestamp}.${fileExtension}`
            
            // Créer une référence dans Firebase Storage
            const storageRef = ref(storage, `${folder}/${fileName}`)

            // Supprimer l'ancienne photo si elle existe
            if (currentPhotoURL && currentPhotoURL.includes('firebase')) {
                try {
                    const oldPhotoRef = ref(storage, currentPhotoURL)
                    await deleteObject(oldPhotoRef)
                } catch (error) {
                    console.log('Erreur lors de la suppression de l\'ancienne photo:', error)
                }
            }

            // Upload le fichier
            const snapshot = await uploadBytes(storageRef, file)
            
            // Obtenir l'URL de téléchargement
            const downloadURL = await getDownloadURL(snapshot.ref)

            // Notifier le parent
            onPhotoUploaded(downloadURL)

            setError('')
        } catch (error) {
            console.error('Erreur lors de l\'upload:', error)
            setError('Erreur lors de l\'upload de l\'image')
            setPreview(currentPhotoURL || '')
        } finally {
            setUploading(false)
        }
    }

    const handleRemovePhoto = async () => {
        if (!currentPhotoURL) return

        try {
            setUploading(true)

            // Supprimer du Storage si c'est une photo Firebase
            if (currentPhotoURL.includes('firebase')) {
                const photoRef = ref(storage, currentPhotoURL)
                await deleteObject(photoRef)
            }

            setPreview('')
            onPhotoUploaded('')
        } catch (error) {
            console.error('Erreur lors de la suppression:', error)
            setError('Erreur lors de la suppression de l\'image')
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className='w-full'>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
                {label}
            </label>

            <div className='flex items-center gap-4'>
                {/* Preview de l'image */}
                <div className='relative w-24 h-24 rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200'>
                    {preview ? (
                        <img 
                            src={preview} 
                            alt="Preview" 
                            className='w-full h-full object-cover'
                        />
                    ) : (
                        <div className='w-full h-full flex items-center justify-center'>
                            <svg className='w-12 h-12 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' />
                            </svg>
                        </div>
                    )}

                    {uploading && (
                        <div className='absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center'>
                            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-white'></div>
                        </div>
                    )}
                </div>

                {/* Boutons d'action */}
                <div className='flex flex-col gap-2'>
                    <input
                        ref={fileInputRef}
                        type='file'
                        accept={acceptedFormats}
                        onChange={handleFileSelect}
                        className='hidden'
                        disabled={uploading}
                    />

                    <button
                        type='button'
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className='px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors'
                    >
                        {uploading ? 'Upload...' : preview ? 'Changer' : 'Ajouter'}
                    </button>

                    {preview && (
                        <button
                            type='button'
                            onClick={handleRemovePhoto}
                            disabled={uploading}
                            className='px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors'
                        >
                            Supprimer
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <p className='mt-2 text-sm text-red-600'>{error}</p>
            )}

            <p className='mt-2 text-xs text-gray-500'>
                Formats acceptés : JPG, PNG, WEBP. Taille max : {maxSize}MB
            </p>
        </div>
    )
}

export default PhotoUpload
