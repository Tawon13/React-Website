import { Link } from 'react-router-dom'
import { INFLUENCER_CATEGORIES } from '../constants/categories'
import { categoryPath } from '../constants/seo'

// Liens explorables vers chaque page catégorie (/talents/<catégorie>) : sans eux, Google ne
// découvre ces pages que par le sitemap et les laisse en « Détectée, non indexée ».
const CategoryLinks = ({ className = '', linkClassName = '', prefix = '' }) => (
  <ul className={className}>
    {INFLUENCER_CATEGORIES.map((category) => (
      <li key={category}>
        <Link to={categoryPath(category)} className={linkClassName}>{`${prefix}${category}`}</Link>
      </li>
    ))}
  </ul>
)

export default CategoryLinks
