// Frais de service Collabzz, facturés à la marque en plus du prix de l'influenceur.
// L'influenceur reçoit toujours 100% du prix qu'il a fixé.
export const SERVICE_FEE_RATE = 0.15

// Prix payé par la marque pour un prix créateur donné, frais d'agence inclus, arrondi à
// l'euro. Même calcul côté serveur (functions/main.py) : le prix affiché aux marques est
// exactement celui facturé.
export const brandPrice = (creatorPrice) => Math.round(Number(creatorPrice || 0) * (1 + SERVICE_FEE_RATE))
