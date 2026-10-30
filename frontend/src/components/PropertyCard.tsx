import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { DISTRICTS, LISTING_TYPES, PROPERTY_TYPES, PROVINCES, labelFor, type Property } from '../types'
import { mediaUrl } from '../utils'

export function PropertyCard({ property }: { property: Property }) {
  const firstFile = property.files?.[0]
  const image = firstFile && /\.(jpe?g|png|gif|webp)$/i.test(firstFile.file)
  const video = firstFile && /\.(mp4|webm|ogg|mov)$/i.test(firstFile.file)

  return <article className="property-card">
    <Link className="property-media" to={`/properties/${property.id}`}>
      {image ? <img src={mediaUrl(firstFile.file)} alt="تصویر ملک" /> : video ? <video src={mediaUrl(firstFile.file)} muted playsInline /> :
        <span className="empty-media"><span className="empty-media-icon">⌂</span>عکس یا فیلمی موجود نیست</span>}
      {image && <span className="media-label">تصویر ملک</span>}
    </Link>
    <div className="property-content">
      <div className="property-badges">
        <span className="property-badge">{labelFor(property.listing_type, LISTING_TYPES)}</span>
        <span className="property-status">{labelFor(property.status, [['AVAILABLE', 'موجود'], ['SOLD', 'فروخته شده'], ['RENTED', 'کرایه داده شده']])}</span>
      </div>
      <h3><Link to={`/properties/${property.id}`}>{labelFor(property.property_type, PROPERTY_TYPES)}</Link></h3>
      <p className="property-description">{property.description || 'توضیحاتی برای این ملک ثبت نشده است.'}</p>
      <div className="property-location"><MapPin size={15} /><span>{property.area || 'منطقه ثبت نشده'}، {labelFor(property.district, DISTRICTS)}، {labelFor(property.province, PROVINCES)}</span></div>
      <div className="property-price"><span>قیمت</span><strong>{property.price?.toLocaleString('fa-AF') ?? 'ثبت نشده'} افغانی</strong></div>
    </div>
  </article>
}