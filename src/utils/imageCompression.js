// Redimensionne et compresse une image côté client avant upload, pour que les photos
// de profil s'affichent quasi instantanément (au lieu de télécharger plusieurs Mo à chaque vue).
export const compressImage = (file, { maxWidth = 1280, maxHeight = 1280, quality = 0.82 } = {}) => {
    return new Promise((resolve, reject) => {
        const img = new Image()
        const objectUrl = URL.createObjectURL(file)

        img.onload = () => {
            URL.revokeObjectURL(objectUrl)

            let { width, height } = img
            if (width > maxWidth || height > maxHeight) {
                const ratio = Math.min(maxWidth / width, maxHeight / height)
                width = Math.round(width * ratio)
                height = Math.round(height * ratio)
            }

            const canvas = document.createElement('canvas')
            canvas.width = width
            canvas.height = height
            canvas.getContext('2d').drawImage(img, 0, 0, width, height)

            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        reject(new Error('Échec de la compression de l\'image'))
                        return
                    }
                    resolve(new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' }))
                },
                'image/jpeg',
                quality
            )
        }

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl)
            reject(new Error('Impossible de charger l\'image'))
        }

        img.src = objectUrl
    })
}
