// Les photos de profil Google arrivent en 96×96 (suffixe "=s96-c") : trop petit pour les cartes,
// l'image est étirée et floue. Le même lien accepte une taille plus grande via ce suffixe.
export const hdPhotoURL = (url, size = 800) => {
    if (!url || !url.includes('googleusercontent.com')) return url
    return url.replace(/=s\d+(-c)?$/, `=s${size}-c`)
}
