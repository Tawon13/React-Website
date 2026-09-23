import { motion } from 'motion/react'
import { Reveal, Icon, ICONS } from './PageKit'

const FEATURES = [
  { icon: 'wallet', title: 'Sans frais initiaux', desc: 'Recherchez des influenceurs gratuitement. Aucun abonnement, contrat ou frais cachés.' },
  { icon: 'check', title: 'Influenceurs vérifiés', desc: 'Chaque influenceur est vérifié par nos soins. Recevez toujours du contenu de haute qualité et professionnel.' },
  { icon: 'chat', title: 'Chat instantané', desc: 'Discutez avec les influenceurs et restez en contact tout au long de la collaboration.' },
  { icon: 'lock', title: 'Achats sécurisés', desc: "Votre argent est conservé en sécurité jusqu'à ce que vous approuviez le travail de l'influenceur." }
]

const Features = () => {
  return (
    <section aria-labelledby='features-title' className='rounded-3xl bg-gray-900 text-white px-6 sm:px-10 lg:px-14 py-14 md:py-20'>
      <Reveal className='max-w-2xl mb-12'>
        <p className='text-sm font-semibold uppercase tracking-wider text-primary mb-3'>Pourquoi Collabzz</p>
        <h2 id='features-title' className='text-3xl md:text-4xl font-bold'>{"Le marketing d'influence rendu simple."}</h2>
      </Reveal>
      <div className='grid sm:grid-cols-2 lg:grid-cols-4 gap-4'>
        {FEATURES.map((feature, i) => (
          <Reveal key={feature.title} delay={i * 0.07} className='h-full'>
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className='h-full rounded-2xl bg-white/5 border border-white/10 p-6 hover:bg-white/[0.08] transition-colors duration-200'
            >
              <div className='w-11 h-11 rounded-xl bg-primary text-gray-900 flex items-center justify-center mb-5'>
                <Icon path={ICONS[feature.icon]} />
              </div>
              <h3 className='text-lg font-semibold mb-2'>{feature.title}</h3>
              <p className='text-gray-300 leading-relaxed text-[15px]'>{feature.desc}</p>
            </motion.div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

export default Features
