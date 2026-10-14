import { Link } from 'react-router-dom'
import { categoryPath } from '../constants/seo'
import { SERVICE_FEE_RATE } from '../constants/fees'

// Fourchettes indicatives observées sur le marché français (une vidéo TikTok publiée sur
// le compte du créateur, droits d'utilisation standard). Ce sont des ordres de grandeur,
// pas une grille : chaque créateur reste libre de son prix.
const PRICE_TIERS = [
  { tier: 'Nano-influenceur', followers: '1 000 à 10 000 abonnés', price: '50 à 200 €' },
  { tier: 'Micro-influenceur', followers: '10 000 à 50 000 abonnés', price: '150 à 600 €' },
  { tier: 'Influenceur intermédiaire', followers: '50 000 à 250 000 abonnés', price: '500 à 2 500 €' },
  { tier: 'Macro-influenceur', followers: '250 000 à 1 million d\'abonnés', price: '2 000 à 10 000 €' },
  { tier: 'Méga-influenceur', followers: 'Plus d\'1 million d\'abonnés', price: '10 000 € et plus' }
]

// Tarifs réellement affichés sur Collabzz (prix d'une vidéo TikTok, profils validés),
// relevés le 14/10/2026. Seules les tranches d'au moins 10 créateurs sont publiées.
const COLLABZZ_PRICES = {
  date: 'octobre 2026',
  creators: 63,
  median: 215,
  p25: 150,
  p75: 330,
  tiers: [
    { label: "Moins de 1 000 abonnés (surtout créateurs UGC)", median: 150 },
    { label: '1 000 à 10 000 abonnés', median: 215 },
    { label: '50 000 à 250 000 abonnés', median: 350 }
  ]
}

const linkClass = 'font-semibold text-gray-900 underline decoration-primary decoration-2 underline-offset-4 hover:decoration-gray-900'

const CombienCouteInfluenceurTiktok = () => {
  const feePct = Math.round(SERVICE_FEE_RATE * 100)
  const examplePrice = 300
  const exampleTotal = Math.round(examplePrice * (1 + SERVICE_FEE_RATE))

  return (
    <>
      <p className='text-lg'>
        {"C'est la première question que se pose une marque avant de se lancer sur TikTok : combien faut-il payer un influenceur pour une vidéo ? La réponse courte : de 50 € pour un petit compte à plus de 10 000 € pour une star de la plateforme. La réponse utile, c'est de comprendre ce qui fait varier ce prix, pour savoir si un tarif est justifié et construire un budget réaliste."}
      </p>

      <h2>{"Les tarifs moyens d'un influenceur TikTok selon sa taille"}</h2>
      <p>
        {"Le nombre d'abonnés reste le premier repère, même s'il n'est pas le meilleur (on y revient plus bas). Voici les fourchettes couramment pratiquées en France pour une vidéo TikTok publiée sur le compte du créateur :"}
      </p>
      <div className='overflow-x-auto my-8 rounded-2xl border border-gray-200'>
        <table className='w-full text-left text-sm sm:text-base'>
          <thead className='bg-gray-50 text-gray-900'>
            <tr>
              <th scope='col' className='p-4 font-semibold'>Profil</th>
              <th scope='col' className='p-4 font-semibold'>Abonnés</th>
              <th scope='col' className='p-4 font-semibold'>Prix par vidéo</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-200 text-gray-700'>
            {PRICE_TIERS.map((row) => (
              <tr key={row.tier}>
                <th scope='row' className='p-4 font-medium text-gray-900'>{row.tier}</th>
                <td className='p-4'>{row.followers}</td>
                <td className='p-4 whitespace-nowrap'>{row.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        {"Ces chiffres sont des ordres de grandeur : deux créateurs de même taille peuvent facturer du simple au triple. Sur TikTok, les tarifs sont souvent un peu plus bas que sur Instagram à audience égale, parce que la portée d'une vidéo dépend davantage de l'algorithme que du nombre d'abonnés."}
      </p>

      <aside className='my-8 rounded-2xl bg-primary/10 border border-primary/30 p-6'>
        <p className='font-semibold text-gray-900 mb-2'>
          {`Les prix réels sur Collabzz (${COLLABZZ_PRICES.date})`}
        </p>
        <p className='mb-3'>
          {`Sur les ${COLLABZZ_PRICES.creators} créateurs TikTok validés qui affichent un tarif, le prix médian d'une vidéo est de ${COLLABZZ_PRICES.median} €, et la moitié d'entre eux demandent entre ${COLLABZZ_PRICES.p25} et ${COLLABZZ_PRICES.p75} €. Prix médian par taille de compte :`}
        </p>
        <ul className='!mb-0'>
          {COLLABZZ_PRICES.tiers.map((tier) => (
            <li key={tier.label}>{`${tier.label} : ${tier.median} €`}</li>
          ))}
        </ul>
      </aside>

      <h2>Ce qui fait vraiment varier le prix</h2>
      <h3>Les vues moyennes, plus que les abonnés</h3>
      <p>
        {"Sur TikTok, un compte de 20 000 abonnés peut faire 100 000 vues par vidéo, et un compte de 200 000 abonnés seulement 8 000. Le bon indicateur est donc le nombre de vues moyen sur les dernières vidéos. Beaucoup de marques raisonnent en coût pour 1 000 vues (CPM) : on divise le prix par les vues moyennes, puis on multiplie par 1 000. Un CPM entre 10 et 30 € est courant ; au-delà, le tarif doit se justifier par une audience très ciblée ou un contenu particulièrement travaillé."}
      </p>
      <h3>{"La niche et l'audience"}</h3>
      <p>
        {"Une audience qui achète vaut plus cher. Les créateurs "}
        <Link to={categoryPath('Beauté')} className={linkClass}>beauté</Link>
        {", "}
        <Link to={categoryPath('Fashion')} className={linkClass}>mode</Link>
        {" ou "}
        <Link to={categoryPath('Technologie')} className={linkClass}>tech</Link>
        {", dont les abonnés suivent leurs recommandations d'achat, sont souvent mieux payés que des comptes d'humour à audience équivalente. À l'inverse, une niche très précise (parentalité, "}
        <Link to={categoryPath('Animaux & Animaux de compagnie')} className={linkClass}>animaux</Link>
        {", "}
        <Link to={categoryPath('Santé & Fitness')} className={linkClass}>fitness</Link>
        {"…) peut offrir un excellent rapport qualité-prix si elle correspond exactement à votre cible."}
      </p>
      <h3>Le format et le travail demandé</h3>
      <p>
        {"Une vidéo de 30 secondes tournée chez soi ne demande pas le même travail qu'un tournage en extérieur avec plusieurs prises, un script validé et des allers-retours. Plus le brief est contraignant (texte imposé, plusieurs versions, délai court), plus le prix monte. Une story ou un live se facturent différemment d'une vidéo permanente."}
      </p>
      <h3>{"Les droits d'utilisation"}</h3>
      <p>
        {"Si vous souhaitez réutiliser la vidéo dans vos publicités (Spark Ads, Meta Ads) ou sur votre site, précisez-le dès le départ : ces droits s'ajoutent généralement au prix de base, souvent de 30 à 100 % en plus selon la durée et les supports. C'est aussi le cas de l'exclusivité (interdiction de travailler avec un concurrent pendant une période)."}
      </p>

      <h2>Influenceur ou créateur UGC : deux prestations différentes</h2>
      <p>
        {"On confond souvent les deux. Un influenceur publie la vidéo sur son propre compte : vous payez à la fois le contenu et l'exposition à son audience. Un créateur UGC produit une vidéo que vous publiez vous-même (sur votre compte ou en publicité) : vous payez le contenu et ses droits, pas l'audience. Si votre objectif est la notoriété, l'influence est plus adaptée ; si vous cherchez des vidéos pour vos campagnes publicitaires, l'UGC peut suffire."}
      </p>

      <h2>Quel budget pour une première campagne ?</h2>
      <p>
        {"Pour une marque qui débute, mieux vaut plusieurs petits créateurs qu'un seul gros compte. Avec un budget de 1 000 à 1 500 €, vous pouvez par exemple travailler avec trois à cinq micro-influenceurs de votre niche. Vous multipliez les audiences, vous testez différents angles, et vous identifiez vite les profils qui convertissent le mieux pour les rappeler ensuite."}
      </p>
      <p>
        {"Pensez à prévoir, en plus du prix des créateurs :"}
      </p>
      <ul>
        <li>{"l'envoi des produits (et leur coût) ;"}</li>
        <li>{"les éventuels droits de réutilisation publicitaire ;"}</li>
        <li>{"les frais de l'intermédiaire : commission d'agence ou frais de plateforme ;"}</li>
        <li>{"un peu de marge pour reconduire les créateurs qui ont bien fonctionné."}</li>
      </ul>

      <h2>Agence, plateforme ou contact direct ?</h2>
      <p>
        {"Contacter un créateur en message privé ne coûte rien, mais prend du temps, sans garantie de réponse ni protection en cas de contenu non livré. Une agence s'occupe de tout, mais facture souvent une commission de 20 à 40 % ou des frais de gestion fixes, difficiles à amortir pour une petite marque."}
      </p>
      <p>
        {"Une plateforme comme Collabzz se situe entre les deux : les créateurs affichent leurs tarifs, leurs statistiques viennent directement de leur compte TikTok connecté, et le paiement n'est versé qu'une fois le contenu livré et validé. Sur Collabzz, les frais de service sont de "}{feePct}{" % pour la marque, sans abonnement : pour une vidéo à "}{examplePrice}{" €, vous payez "}{exampleTotal}{" € et le créateur reçoit l'intégralité de ses "}{examplePrice}{" €. Pour en savoir plus, consultez la page "}
        <Link to='/for-brands' className={linkClass}>Collabzz pour les marques</Link>
        {"."}
      </p>

      <h2>Les pièges à éviter</h2>
      <ul>
        <li>
          <strong>{"Se fier aux abonnés seuls."}</strong>
          {" Regardez les vues des dix dernières vidéos et le taux d'engagement (likes, commentaires, partages rapportés aux vues)."}
        </li>
        <li>
          <strong>{"Accepter des captures d'écran comme preuve."}</strong>
          {" Elles se retouchent facilement. Privilégiez des statistiques issues du compte connecté."}
        </li>
        <li>
          <strong>{"Payer 100 % d'avance sans protection."}</strong>
          {" Un paiement sous séquestre, libéré à la validation du contenu, protège les deux parties."}
        </li>
        <li>
          <strong>{"Oublier la mention de partenariat."}</strong>
          {" Depuis la loi de 2023 sur l'influence commerciale, la collaboration doit être clairement signalée (mention « publicité » ou « collaboration commerciale »). C'est aussi votre responsabilité de marque."}
        </li>
        <li>
          <strong>{"Écrire un brief trop rigide."}</strong>
          {" Sur TikTok, les vidéos qui marchent ressemblent à du contenu natif. Donnez les messages clés, laissez le créateur choisir le ton."}
        </li>
      </ul>

      <h2>En résumé</h2>
      <p>
        {"Comptez de 50 à 600 € par vidéo pour des nano et micro-influenceurs, de 500 à 2 500 € pour des comptes intermédiaires, et bien plus pour les grands noms. Jugez un tarif à l'aune des vues moyennes et de la proximité avec votre cible, pas du seul nombre d'abonnés, et commencez par plusieurs petits créateurs pour tester. Pour comparer des profils et leurs prix, "}
        <Link to='/talents' className={linkClass}>parcourez les influenceurs TikTok vérifiés de Collabzz</Link>
        {"."}
      </p>
    </>
  )
}

export default CombienCouteInfluenceurTiktok
