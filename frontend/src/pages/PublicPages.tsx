import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowUp, ArrowDown, Building2, MapPin, MessageCircle, Phone, Search } from 'lucide-react'
import { api, errorMessage } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { PropertyCard } from '../components/PropertyCard'
import { DISTRICTS, LISTING_TYPES, PROPERTY_TYPES, PROVINCES, labelFor, type CustomerProfile, type OfficeDirectoryRecord, type Page, type Property, type PublicOfficeProfile, type RegisterResponse } from '../types'
import { formatDate, mediaUrl } from '../utils'

function Notice({ children, tone = 'error' }: { children: string; tone?: 'error' | 'success' }) {
  return <div className={`notice notice-${tone}`} role="status">{children}</div>
}

function RequestState({ loading, error }: { loading: boolean; error: string }) {
  if (loading) return <div className="state-message"><span className="spinner" /> داده‌ها در حال دریافت است...</div>
  if (error) return <div className="state-message state-error">{error}</div>
  return null
}

export function HomePage() {
  const [params, setParams] = useSearchParams()
  const [page, setPage] = useState<Page<Property> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(() => ({
    search: params.get('search') ?? '',
    property_type: params.get('property_type') ?? params.get('type') ?? '',
    district: params.get('district') ?? '',
    // province: params.get('province') ?? '', // add search input field for area
    //area: params.get('area') ?? '',
    listing_type: params.get('listing_type') ?? '',
  }))

  useEffect(() => {
    setForm({
      search: params.get('search') ?? '',
      property_type: params.get('property_type') ?? params.get('type') ?? '',
      district: params.get('district') ?? '',
      // province: params.get('province') ?? '',
      listing_type: params.get('listing_type') ?? '',
      // area: params.get('area'),
    })
    setError('')
    setLoading(true)
    const apiParams = {
      search: params.get('search') ?? '',
      property_type: params.get('property_type') ?? params.get('type') ?? '',
      district: params.get('district') ?? '',
      // province: params.get('province') ?? '',
      page: params.get('page') ?? '',
      listing_type: params.get('listing_type') ?? '',
    }
    api.get<Page<Property>>('home/', { params: apiParams })
      .then(({ data }) => setPage(data))
      .catch((reason: unknown) => setError(errorMessage(reason)))
      .finally(() => setLoading(false))
  }, [params])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next = new URLSearchParams()
    Object.entries(form).forEach(([key, value]) => { if (value) next.set(key, value) })
    setParams(next)
  }

  function goToPage(url: string | null) {
    if (!url) return
    const next = new URL(url, window.location.origin)
    setParams(next.searchParams)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return <>
    <section className="hero-section">
      <div className="hero-content">
        <span className="hero-kicker">جستجوی املاک</span>
        <h1>ملک مناسب خود را <span>آسان‌تر پیدا کنید</span></h1>
        <p>خانه، دکان و زمین‌های ثبت‌شده را بر اساس نوع ملک و موقعیت آن جستجو کنید.</p>
      </div>
      <div className="hero-photo-credit" dir="ltr">
        Photo: <a href="https://commons.wikimedia.org/wiki/File:Kabul,_Afghanistan_view.jpg" target="_blank" rel="noreferrer">Weaveravel</a>
        {' · '}
        <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">CC BY-SA 4.0</a>
      </div>
    </section>
    <section className="search-section section-container">
      <div className="search-heading"><span className="section-kicker">جستجوی سریع</span><h2>جستجوی ملک</h2><p>نوع ملک، ناحیه و نوع معامله مورد نظر را انتخاب کنید.</p></div>
      <form className="property-search-form" onSubmit={submit}>
        <Field label="جستجو">
          <input
            type="search"
            value={form.search}
            onChange={(event) =>
              setForm({ ...form, search: event.target.value })
            }
            placeholder="نام ساحه یا دفتر مورد نظر را وارد کنید..."
          />
        </Field>
        {/* <Field label="ولایت"><select value={form.province} onChange={(event) => setForm({ ...form, province: event.target.value })}><option value="">همه ولایات</option>{PROVINCES.map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select></Field> */}
        <Field label="نوع ملک"><select value={form.property_type} onChange={(event) => setForm({ ...form, property_type: event.target.value })}><option value="">همه</option>{PROPERTY_TYPES.map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select></Field>
        <Field label="ناحیه"><select value={form.district} onChange={(event) => setForm({ ...form, district: event.target.value })}><option value="">همه ناحیه‌ها</option>{DISTRICTS.map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select></Field>
        <Field label="نوع معامله"><select value={form.listing_type} onChange={(event) => setForm({ ...form, listing_type: event.target.value })}><option value="">همه</option>{LISTING_TYPES.map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select></Field>
        {/* we need to have a search input field here, so user can enter area's name and search for properties through area name */}
        <button type="submit" className="primary-button search-button"><Search size={17} /> جستجو</button>
      </form>
    </section>
    <section className="results-section section-container">
      <div className="results-heading"><span className="results-kicker">املاک موجود</span><h2>گزینه‌های ثبت‌شده</h2>{page && <p>{page.count.toLocaleString('fa-AF')} ملک</p>}</div>
      <RequestState loading={loading} error={error} />
      {!loading && !error && page?.results.length === 0 && <div className="empty-results"><span className="empty-results-icon">⌂</span><h3>ملکی موجود نیست</h3><p>در حال حاضر ملکی مطابق جستجوی شما موجود نیست.</p></div>}
      {!!page?.results.length && <div className="property-grid">{page.results.map((property) => <PropertyCard key={property.id} property={property} />)}</div>}
      {(page?.previous || page?.next) && <div className="pagination">
        {page.previous && <button className="pagination-link" onClick={() => goToPage(page.previous)}><ArrowUp size={16} /> نمایش قبلی</button>}
        {page.next && <button className="pagination-link" onClick={() => goToPage(page.next)}><ArrowDown size={16} /> نمایش بیشتر</button>}
      </div>}
    </section>
    <section>
      <hr />
      <div>
        <p>let's see if we actually need to add something in this section of website, maybe the guide of website's usage, download page for android app or about page </p>
        <p>I think there should be a "see more" or "دیدن بیشتر" in fa-Af, 
          and then once user clicked "see more", there should be paginated properties and posts
        </p>
        <p>
          also, if user searched or filtered anything, there should not be this section of website included, the avaiable data must get 
          returned to the user. this section of data must not get included. 
        </p>
      </div>
    </section>
  </>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="form-group"><span>{label}</span>{children}</label>
}

export function PropertyDetailPage() {
  const { id } = useParams()
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    api.get<Property>(`houses/${id}/`).then(({ data }) => setProperty(data)).catch((reason: unknown) => setError(errorMessage(reason))).finally(() => setLoading(false))
  }, [id])
  return <div className="content-container detail-page">
    <Link className="back-link" to="/"><ArrowLeft size={16} /> بازگشت</Link>
    <RequestState loading={loading} error={error} />
    {property && <>
      <header className="detail-header"><div><span className="page-label">جزئیات ملک</span><h1>{labelFor(property.property_type, PROPERTY_TYPES)}</h1><p className="location"><MapPin size={15} /> {property.area || 'منطقه ثبت نشده'} - {labelFor(property.district, DISTRICTS)} - {labelFor(property.province, PROVINCES)}</p></div><span className="listing-type">{labelFor(property.listing_type, LISTING_TYPES)}</span></header>
      <section className="panel"><div className="section-title"><h2>اطلاعات ملک</h2></div><div className="property-info">
        <InfoItem label="موقعیت">{property.area || 'ثبت نشده'} - {labelFor(property.district, DISTRICTS)} - {labelFor(property.province, PROVINCES)}</InfoItem>
        <InfoItem label="نوعیت ملک">{labelFor(property.property_type, PROPERTY_TYPES)}</InfoItem>
        <InfoItem label="نوعیت معامله">{labelFor(property.listing_type, LISTING_TYPES)}</InfoItem>
        <InfoItem label="قیمت">{property.price?.toLocaleString('fa-AF') ?? 'ثبت نشده'} افغانی</InfoItem>
        <InfoItem label="وضعیت">{labelFor(property.status, [['AVAILABLE', 'موجود'], ['SOLD', 'فروخته شده'], ['RENTED', 'کرایه داده شده']])}</InfoItem>
        <InfoItem label="تاریخ ثبت">{formatDate(property.created_at)}</InfoItem>
      </div><div className="description-section"><span className="info-label">توضیحات</span><p>{property.description || 'توضیحاتی برای این ملک ثبت نشده است.'}</p></div></section>
      <section className="panel"><div className="section-title"><h2>دفتر رهنمای منتشرکننده</h2></div>{property.office ? <Link className="office-tile" to={`/offices/${property.office.id}`}>
        {property.office.profile ? <img src={mediaUrl(property.office.profile)} alt="" /> : <span className="office-avatar">{(property.office.name || property.office.admin_name).slice(0, 1) || 'د'}</span>}
        <span><strong>{property.office.name || property.office.admin_name || 'دفتر املاک'}</strong><small>{property.office.address || property.office.introduction || 'مشاهده مشخصات دفتر'}</small></span>
      </Link> : <p>اطلاعات دفتر منتشرکننده در دسترس نیست.</p>}</section>
      <section className="panel media-section"><div className="section-title"><h2>تصاویر و ویدیوها</h2><span>فایل‌های مربوط به این ملک</span></div><div className="media-grid">
        {property.files?.filter((item) => /\.(jpe?g|png|gif|webp|mp4|webm|ogg|mov)$/i.test(item.file)).map((item) => /\.(mp4|webm|ogg|mov)$/i.test(item.file) ? <video key={item.id} controls src={mediaUrl(item.file)} /> : <a key={item.id} href={mediaUrl(item.file)} target="_blank" rel="noreferrer"><img src={mediaUrl(item.file)} alt="تصویر ملک" /></a>)}
        {!property.files?.length && <p className="empty-media-box">برای این ملک هنوز تصویر یا ویدیویی ثبت نشده است.</p>}
      </div></section>
    </>}
  </div>
}

function InfoItem({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="info-item"><span className="info-label">{label}</span><p>{children}</p></div>
}

export function OfficesPage() { // it has got the office's public info for designing purposes. 
  const [offices, setOffices] = useState<OfficeDirectoryRecord[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    api.get<Page<OfficeDirectoryRecord>>('offices/', { params: query ? { q: query } : {} }).then(({ data }) => setOffices(data.results)).catch((reason: unknown) => setError(errorMessage(reason))).finally(() => setLoading(false))
  }, [query])
  return <div className="content-container directory-page"><PageHeading label="دفترهای ثبت‌شده" title="دفترهای رهنمای معاملات" description="دفترهای ثبت‌شده و اطلاعات تماس آن‌ها" />
    <form className="directory-search" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); setQuery(String(form.get('q') || '')) }}><input name="q" placeholder="جستجوی نام دفتر" /><button className="primary-button"><Search size={16} /> جستجو</button></form>
    <RequestState loading={loading} error={error} />
    {!loading && !offices.length && <div className="empty-results">دفتری پیدا نشد.</div>}
    <div className="office-grid">{offices.map((office) => <article className="directory-office-card" key={office.id}>
      <div className="directory-office-heading">
        <Link className="directory-office-identity" to={`/offices/${office.id}`}>
          {office.profile ? <img className="directory-office-mark" src={mediaUrl(office.profile)} alt="" /> : <span className="directory-office-mark"><Building2 size={27} /></span>}
          <span className="directory-office-copy"><small>دفتر رهنمای معاملات</small><strong>{office.name || 'دفتر املاک'}</strong><span>{office.introduction || 'مشاهده مشخصات و آگهی‌های دفتر'}</span></span>
        </Link>
      </div>
      <div className="directory-office-contacts"> 
        {office.admin_phone && <a className="directory-office-contact phone-contact" href={`tel:${office.admin_phone}`} dir="ltr"><span className="directory-office-contact-icon"><Phone size={18} /></span><span><small>شماره تماس</small><strong>{office.admin_phone}</strong></span></a>}
        {office.admin_whatsapp && <a className="directory-office-contact whatsapp-contact" href={`https://wa.me/${office.admin_whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" dir="ltr"><span className="directory-office-contact-icon"><MessageCircle size={18} /></span><span><small>واتساپ</small><strong>{office.admin_whatsapp}</strong></span></a>}
        <div className="directory-office-contact address-contact"><span className="directory-office-contact-icon"><MapPin size={18} /></span><span><small>نشانی دفتر</small><strong>{office.address || 'نشانی ثبت نشده'}</strong></span></div>
      </div>
    </article>)}</div>
  </div>
}

export function OfficeDetailPage() {
  const { id } = useParams()
  const [data, setData] = useState<{ office: PublicOfficeProfile; posts: Property[] } | null>(null)
  const [error, setError] = useState('')
  useEffect(() => { api.get<{ office: PublicOfficeProfile; posts: Property[] }>(`offices/${id}/`).then(({ data: result }) => setData(result)).catch((reason: unknown) => setError(errorMessage(reason))) }, [id])
  return <div className="content-container directory-page"><RequestState loading={!data && !error} error={error} />{data && <>
    <section className="office-profile public-office-profile panel">
      {data.office.profile ? <img className="office-cover" src={mediaUrl(data.office.profile)} alt="تصویر دفتر" /> : <div className="office-cover office-cover-placeholder"><Building2 size={38} /></div>}
      <div className="public-office-details">
        <span className="page-label">دفتر رهنمای معاملات</span>
        <h1>{data.office.name || 'دفتر املاک'}</h1>
        <p>{data.office.introduction || 'معرفی ثبت نشده است.'}</p>
        <p className="muted public-office-address"><MapPin size={16} />{data.office.address || 'نشانی ثبت نشده است.'}</p>
      </div>
      <div className="office-contacts" aria-label="راه‌های تماس با رهنما">
        {data.office.admin_phone && (
          <a className="contact-card contact-card--phone" href={`tel:${data.office.admin_phone}`} dir="ltr">
            <div className="contact-card__icon">
              <Phone size={20} />
            </div>
            <div className="contact-card__info">
              <small>شماره تماس رهنما</small>
              <strong>{data.office.admin_phone}</strong>
            </div>
            <span className="contact-card__action">تماس</span>
          </a>
        )}
        {data.office.admin_whatsapp && (
          <a className="contact-card contact-card--whatsapp" href={`https://wa.me/${data.office.admin_whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" dir="ltr">
            <div className="contact-card__icon">
              <MessageCircle size={20} />
            </div>
            <div className="contact-card__info">
              <small>واتساپ رهنما</small>
              <strong>{data.office.admin_whatsapp}</strong>
            </div>
            <span className="contact-card__action">چت</span>
          </a>
        )}
        {!data.office.admin_phone && !data.office.admin_whatsapp && (
          <p className="contact-card--empty">راه‌های تماس رهنما ثبت نشده است.</p>
        )}
      </div>   
    </section>
    <PageHeading label="املاک دفتر" title="آگهی‌های ثبت‌شده" />
    {data.posts.length ? <div className="property-grid">{data.posts.map((property) => <PropertyCard key={property.id} property={property} />)}</div> : <div className="empty-results">ملکی برای نمایش ثبت نشده است.</div>}
  </>}</div>
}

export function AreasPage() {
  const [areas, setAreas] = useState<string[]>([])
  const [error, setError] = useState('')
  useEffect(() => { api.get<{ areanames: string[] }>('arealist/').then(({ data }) => setAreas([...new Set(data.areanames)].sort((a, b) => a.localeCompare(b, 'fa')))).catch((reason: unknown) => setError(errorMessage(reason))) }, [])
  return <div className="content-container directory-page"><PageHeading label="مناطق" title="لیست مناطق ثبت‌شده" description="خانه‌ها و زمین‌های موجود در مناطق ثبت‌شده" />{error && <Notice>{error}</Notice>}<div className="area-list">{areas.map((area) => <Link key={area} to={`/areas/${encodeURIComponent(area)}`}><MapPin size={16} />{area}</Link>)}</div>{!areas.length && !error && <div className="state-message">منطقه‌ای ثبت نشده است.</div>}</div>
}

export function AreaPropertiesPage() {
  const { area = '' } = useParams()
  const [page, setPage] = useState<Page<Property> | null>(null)
  const [error, setError] = useState('')
  useEffect(() => { api.get<Page<Property>>(`houses/${encodeURIComponent(area)}/`).then(({ data }) => setPage(data)).catch((reason: unknown) => setError(errorMessage(reason))) }, [area])
  return <div className="content-container directory-page"><PageHeading label="منطقه ثبت‌شده" title={area} /><RequestState loading={!page && !error} error={error} />{page && <div className="property-grid">{page.results.map((property) => <PropertyCard key={property.id} property={property} />)}</div>}</div>
}

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const signupMessage = (location.state as { notice?: string } | null)?.notice
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setBusy(true)
    const values = new FormData(event.currentTarget)
    try { await login(String(values.get('email')), String(values.get('password'))); navigate('/') }
    catch (reason) { setError(errorMessage(reason)) }
    finally { setBusy(false) }
  }
  return <AuthPage className="login-page"><section className="auth-card"><div className="auth-header"><span className="page-label">حساب کاربری</span><h1>ورود به حساب</h1><p>برای ادامه وارد حساب کاربری خود شوید.</p></div>{signupMessage && <Notice tone="success">{signupMessage}</Notice>}{error && <Notice>{error}</Notice>}<form className="auth-form" onSubmit={submit}><Field label="ایمیل"><input type="email" name="email" autoComplete="email" required placeholder="ایمیل خود را وارد کنید" /></Field><Field label="پسورد"><input type="password" name="password" autoComplete="current-password" required placeholder="پسورد خود را وارد کنید" /></Field><button className="primary-button" disabled={busy}>{busy ? 'در حال ورود...' : 'وارد شدن'}</button></form><div className="account-links"><Link to="/password-reset">رمز عبور را فراموش کرده‌اید؟</Link><Link to="/register">ایجاد حساب جدید</Link></div><Link className="back-link" to="/">بازگشت</Link></section></AuthPage>
}

export function RegisterPage() {
  const navigate = useNavigate()
  const [role, setRole] = useState<'customer' | 'office'>('customer')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setNotice(''); setBusy(true)
    const values = Object.fromEntries(new FormData(event.currentTarget).entries())
    try {
      const { data } = await api.post<RegisterResponse>(`auth/register/${role}/`, values)
      const successMessage = data.message || 'ثبت نام موفق بود. ایمیل خود را بررسی کنید.'
      setNotice(successMessage)
      navigate('/login', { state: { notice: successMessage } })
    } catch (reason) { setError(errorMessage(reason)) }
    finally { setBusy(false) }
  }
  return <AuthPage className="register-page"><section className="auth-card auth-card-wide"><div className="auth-header"><span className="page-label">ایجاد حساب</span><h1>{role === 'customer' ? 'ثبت نام مشتری' : 'ثبت نام دفتر'}</h1><p>اطلاعات خود را وارد کنید تا حساب کاربری جدید شما ایجاد شود.</p></div>
    <div className="role-switch"><button className={role === 'customer' ? 'selected' : ''} onClick={() => setRole('customer')}>مشتری</button><button className={role === 'office' ? 'selected' : ''} onClick={() => setRole('office')}>دفتر رهنمای معاملات</button></div>
    {error && <Notice>{error}</Notice>}{notice && <Notice tone="success">{notice}</Notice>}
    <form className="auth-form" onSubmit={submit}><div className="form-grid"><Field label="اسم"><input name="first_name" autoComplete="given-name" required /></Field><Field label="تخلص"><input name="last_name" autoComplete="family-name" required /></Field><Field label="شماره تماس"><input name="phone" autoComplete="tel" /></Field><Field label="ایمیل"><input type="email" name="email" required autoComplete="email" /></Field><Field label="رمز عبور"><input type="password" name="password" required autoComplete="new-password" /></Field><Field label="تکرار رمز عبور"><input type="password" name="re_password" required autoComplete="new-password" /></Field></div><button className="primary-button" disabled={busy}>{busy ? 'در حال ثبت...' : 'ثبت نام'}</button></form><Link className="back-link" to="/">بازگشت به صفحه اصلی</Link>
  </section></AuthPage>
}

export function PasswordResetPage() {
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setMessage('')
    const email = new FormData(event.currentTarget).get('email')
    try { const { data } = await api.post<{ message: string }>('auth/password-reset-request/', { email }); setMessage(data.message) }
    catch (reason) { setError(errorMessage(reason)) }
  }
  return <AuthPage className="login-page"><section className="auth-card"><div className="auth-header"><span className="page-label">حساب کاربری</span><h1>بازیابی رمز عبور</h1><p>ایمیل حساب خود را وارد کنید.</p></div>{error && <Notice>{error}</Notice>}{message && <Notice tone="success">{message}</Notice>}<form className="auth-form" onSubmit={submit}><Field label="ایمیل"><input type="email" name="email" required autoComplete="email" /></Field><button className="primary-button">ارسال لینک بازیابی</button></form><Link className="back-link" to="/login">بازگشت به ورود</Link></section></AuthPage>
}

export function PasswordResetConfirmPage() {
  const { uid = '', token = '' } = useParams()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')
    setBusy(true)
    const values = Object.fromEntries(new FormData(event.currentTarget).entries())
    try {
      const { data } = await api.post<{ message: string }>(`auth/password_reset/${encodeURIComponent(uid)}/${encodeURIComponent(token)}/`, values)
      setMessage(data.message)
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setBusy(false)
    }
  }

  return <AuthPage className="login-page"><section className="auth-card">
    <div className="auth-header"><span className="page-label">حساب کاربری</span><h1>تنظیم رمز عبور جدید</h1><p>رمز عبور جدید خود را وارد کنید.</p></div>
    {error && <Notice>{error}</Notice>}{message && <Notice tone="success">{message}</Notice>}
    {!message && <form className="auth-form" onSubmit={submit}>
      <Field label="رمز جدید"><input type="password" name="new_password" required autoComplete="new-password" /></Field>
      <Field label="تکرار رمز جدید"><input type="password" name="confirm_password" required autoComplete="new-password" /></Field>
      <button className="primary-button" disabled={busy}>{busy ? 'در حال ذخیره...' : 'ذخیره رمز جدید'}</button>
    </form>}
    <Link className="back-link" to="/login">بازگشت به ورود</Link>
  </section></AuthPage>
}

export function VerifyEmailPage() {
  const { uid = '', token = '' } = useParams()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    api.get<{ message: string }>(`auth/verify-email/${encodeURIComponent(uid)}/${encodeURIComponent(token)}/`)
      .then(({ data }) => setMessage(data.message))
      .catch((reason: unknown) => setError(errorMessage(reason)))
  }, [uid, token])

  return <AuthPage className="login-page"><section className="auth-card">
    <div className="auth-header"><span className="page-label">تایید حساب</span><h1>تایید ایمیل</h1><p>وضعیت تایید ایمیل شما</p></div>
    {error && <Notice>{error}</Notice>}{message && <Notice tone="success">{message}</Notice>}
    <Link className="primary-button" to="/login">رفتن به ورود</Link>
  </section></AuthPage>
}

function AuthPage({ children, className }: { children: React.ReactNode; className: string }) {
  return <div className={className}><div className="auth-art"><span className="section-kicker">خانه یاب</span><p>جستجوی آسان، انتخاب مطمئن</p></div>{children}</div>
}

export function CustomerProfilePage() {
  const [profile, setProfile] = useState<CustomerProfile | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  useEffect(() => { api.get<CustomerProfile>('auth/me/profile/').then(({ data }) => setProfile(data)).catch((reason: unknown) => setError(errorMessage(reason))) }, [])
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(''); setError('')
    const body = new FormData(event.currentTarget)
    try { const { data } = await api.patch<CustomerProfile>('auth/me/profile/', body); setProfile(data); setMessage('پروفایل با موفقیت به‌روز شد.') }
    catch (reason) { setError(errorMessage(reason)) }
  }
  return <div className="content-container profile-page"><PageHeading label="حساب کاربری" title="پروفایل کاربری" description="اطلاعات پروفایل خود را ویرایش کنید." />{error && <Notice>{error}</Notice>}{message && <Notice tone="success">{message}</Notice>}{profile && <form className="panel profile-form" onSubmit={submit} encType="multipart/form-data"><div className="form-grid"><Field label="اسم"><input name="first_name" defaultValue={profile.first_name} required /></Field><Field label="تخلص"><input name="last_name" defaultValue={profile.last_name} required /></Field><Field label="شماره تماس"><input name="phone" defaultValue={profile.phone || ''} /></Field><Field label="جنسیت"><select name="gender" defaultValue={profile.gender || 'MALE'}><option value="MALE">مرد</option><option value="FEMALE">زن</option></select></Field><Field label="تصویر پروفایل"><input type="file" name="profile_pic" accept="image/*" /></Field></div><button className="primary-button">ذخیره تغییرات</button></form>}</div>
}

export function PageHeading({ label, title, description }: { label: string; title: string; description?: string }) {
  return <header className="page-heading"><span className="page-label">{label}</span><h1>{title}</h1>{description && <p>{description}</p>}</header>
}

export function ChangePasswordPage() {
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setMessage('')
    const values = Object.fromEntries(new FormData(event.currentTarget).entries())
    try { const { data } = await api.post<{ message: string }>('auth/change-password/', values); setMessage(data.message) }
    catch (reason) { setError(errorMessage(reason)) }
  }
  return <AuthPage className="login-page"><section className="auth-card"><div className="auth-header"><span className="page-label">حساب کاربری</span><h1>تغییر رمز عبور</h1><p>رمز فعلی و رمز جدید خود را وارد کنید.</p></div>{error && <Notice>{error}</Notice>}{message && <Notice tone="success">{message}</Notice>}<form className="auth-form" onSubmit={submit}><Field label="رمز فعلی"><input type="password" name="old_password" required autoComplete="current-password" /></Field><Field label="رمز جدید"><input type="password" name="new_password" required autoComplete="new-password" /></Field><Field label="تکرار رمز جدید"><input type="password" name="confirm_password" required autoComplete="new-password" /></Field><button className="primary-button">ذخیره رمز جدید</button></form></section></AuthPage>
}