// Déclenche à l'avance le démarrage à froid d'une Cloud Function Python, pendant que
// l'utilisateur consulte la page plutôt qu'au moment où il clique sur le bouton qui
// l'appelle réellement. Une requête OPTIONS suffit : le conteneur démarre dès qu'une
// requête arrive, avant même que le code de la fonction ne s'exécute, donc elle réveille
// l'instance sans déclencher la moindre écriture ni le moindre email. Best-effort :
// échoue silencieusement (pas de connexion, fonction non configurée...).
export const warmUpFunction = (url) => {
    if (!url) return
    fetch(url, { method: 'OPTIONS' }).catch(() => {})
}
