// import { useState } from 'react'
// import { Link, NavLink, useNavigate } from 'react-router-dom'
// import {
//   BarChart3, Building2, FilePlus2, FileText, KeyRound,
//   LayoutDashboard, Mail, Menu, MessageCircle, NotebookPen, UserRound, X
// } from 'lucide-react'
// import { useAuth } from '../context/AuthContext'

// export function HomePage() {
//   const [params, setParams] = useSearchParams()
//   const [page, setPage] = useState<Page<Property> | null>(null)
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState('')
//   const [form, setForm] = useState(() => ({
//     search: params.get('search') ?? '',
//     property_type: params.get('property_type') ?? params.get('type') ?? '',
//     district: params.get('district') ?? '',
//     // province: params.get('province') ?? '', // add search input field for area
//     //area: params.get('area') ?? '',
//     listing_type: params.get('listing_type') ?? '',
//   }))

//   useEffect(() => {
//     setForm({
//       search: params.get('search') ?? '',
//       property_type: params.get('property_type') ?? params.get('type') ?? '',
//       district: params.get('district') ?? '',
//       // province: params.get('province') ?? '',
//       listing_type: params.get('listing_type') ?? '',
//       // area: params.get('area'),
//     })
//     setError('')
//     setLoading(true)
//     const apiParams = {
//       search: params.get('search') ?? '',
//       property_type: params.get('property_type') ?? params.get('type') ?? '',
//       district: params.get('district') ?? '',
//       // province: params.get('province') ?? '',
//       page: params.get('page') ?? '',
//       listing_type: params.get('listing_type') ?? '',
//     }
//     api.get<Page<Property>>('home/', { params: apiParams })
//       .then(({ data }) => setPage(data))
//       .catch((reason: unknown) => setError(errorMessage(reason)))
//       .finally(() => setLoading(false))
//   }, [params])

//   function submit(event: FormEvent<HTMLFormElement>) {
//     event.preventDefault()
//     const next = new URLSearchParams()
//     Object.entries(form).forEach(([key, value]) => { if (value) next.set(key, value) })
//     setParams(next)
//   }

//   function goToPage(url: string | null) {
//     if (!url) return
//     const next = new URL(url, window.location.origin)
//     setParams(next.searchParams)
//     window.scrollTo({ top: 0, behavior: 'smooth' })
//   }

//   return <>
//     <section className="hero-section">
//       <div className="hero-content">
//         <span className="hero-kicker">جستجوی املاک</span>
//         <h1>ملک مناسب خود را <span>آسان‌تر پیدا کنید</span></h1>
//         <p>خانه، دکان و زمین‌های ثبت‌شده را بر اساس نوع ملک و موقعیت آن جستجو کنید.</p>
//       </div>
//       <div className="hero-photo-credit" dir="ltr">
//         Photo: <a href="https://commons.wikimedia.org/wiki/File:Kabul,_Afghanistan_view.jpg" target="_blank" rel="noreferrer">Weaveravel</a>
//         {' · '}
//         <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">CC BY-SA 4.0</a>
//       </div>
//     </section>
//     <section className="search-section section-container">
//       <div className="search-heading"><span className="section-kicker">جستجوی سریع</span><h2>جستجوی ملک</h2><p>نوع ملک، ناحیه و نوع معامله مورد نظر را انتخاب کنید.</p></div>
//       <form className="property-search-form" onSubmit={submit}>
//         <Field label="جستجو">
//           <input
//             type="search"
//             value={form.search}
//             onChange={(event) =>
//               setForm({ ...form, search: event.target.value })
//             }
//             placeholder="نام ساحه یا دفتر مورد نظر را وارد کنید..."
//           />
//         </Field>
//         {/* <Field label="ولایت"><select value={form.province} onChange={(event) => setForm({ ...form, province: event.target.value })}><option value="">همه ولایات</option>{PROVINCES.map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select></Field> */}
//         <Field label="نوع ملک"><select value={form.property_type} onChange={(event) => setForm({ ...form, property_type: event.target.value })}><option value="">همه</option>{PROPERTY_TYPES.map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select></Field>
//         <Field label="ناحیه"><select value={form.district} onChange={(event) => setForm({ ...form, district: event.target.value })}><option value="">همه ناحیه‌ها</option>{DISTRICTS.map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select></Field>
//         <Field label="نوع معامله"><select value={form.listing_type} onChange={(event) => setForm({ ...form, listing_type: event.target.value })}><option value="">همه</option>{LISTING_TYPES.map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select></Field>
//         <button type="submit" className="primary-button search-button"><Search size={17} /> جستجو</button>
//       </form>
//     </section>
//     <section className="results-section section-container">
//       <div className="results-heading"><span className="results-kicker">املاک موجود</span><h2>گزینه‌های ثبت‌شده</h2>{page && <p>{page.count.toLocaleString('fa-AF')} ملک</p>}</div>
//       <RequestState loading={loading} error={error} />
//       {!loading && !error && page?.results.length === 0 && <div className="empty-results"><span className="empty-results-icon">⌂</span><h3>ملکی موجود نیست</h3><p>در حال حاضر ملکی مطابق جستجوی شما موجود نیست.</p></div>}
//       {!!page?.results.length && <div className="property-grid">{page.results.map((property) => <PropertyCard key={property.id} property={property} />)}</div>}
//       {(page?.previous || page?.next) && <div className="pagination">
//         {page.previous && <button className="pagination-link" onClick={() => goToPage(page.previous)}><ArrowUp size={16} /> نمایش قبلی</button>}
//         {page.next && <button className="pagination-link" onClick={() => goToPage(page.next)}><ArrowDown size={16} /> نمایش بیشتر</button>}
//       </div>}
//     </section>
//   </>
// }


// function FacebookIcon({ size = 16 }: { size?: number }) {
//   return (
//     <svg
//       width={size}
//       height={size}
//       viewBox="0 0 24 24"
//       fill="currentColor"
//       aria-hidden="true"
//     >
//       <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z" />
//     </svg>
//   )
// }

// export function SiteLayout({ children }: { children: React.ReactNode }) {
//   const [menuOpen, setMenuOpen] = useState(false)
//   const { user, logout } = useAuth()
//   const navigate = useNavigate()

//   async function handleLogout() {
//     try { await logout() } finally { navigate('/') }
//   }

//   return (
//     <>
//       <header className="site-header">
//         <div className="header-inner">
//           <Link className="brand" to="/">
//             <strong>خانه یاب</strong>
//             <span>جستجوی آسان، انتخاب مطمئن</span>
//           </Link>
//           <button className="menu-toggle icon-button" aria-label={menuOpen ? 'بستن فهرست' : 'باز کردن فهرست'} onClick={() => setMenuOpen(!menuOpen)}>
//             {menuOpen ? <X size={20} /> : <Menu size={20} />}
//           </button>
//           <nav className={`main-nav ${menuOpen ? 'is-open' : ''}`}>
//             <NavLink to="/properties?type=KHANA">خانه</NavLink>
//             <NavLink to="/properties?type=DOKAN">دکان</NavLink>
//             <NavLink to="/properties?type=ZAMIN">زمین</NavLink>
//             <NavLink to="/offices">دفترهای ثبت‌شده</NavLink>
//             <NavLink to="/areas">مناطق ثبت‌شده</NavLink>
//             {user?.user_type === 'OFFICE' && <NavLink to="/office">مدیریت دفتر</NavLink>}
//           </nav>
//           <div className="account-actions">
//             {user ? <>
//               {user.user_type === 'CUSTOMER' && <><Link className="profile-link" to="/profile">پروفایل کاربری</Link><Link className="profile-link" to="/change-password">تغییر رمز</Link></>}
//               {user.user_type === 'OFFICE' && <Link className="profile-link" to="/office/profile">پروفایل دفتر</Link>}
//               <button className="logout-link" onClick={handleLogout}>خروج</button>
//             </> : <>
//               <Link className="login-link" to="/login">وارد شدن</Link>
//               <Link className="register-link" to="/register">ثبت نام</Link>
//             </>}
//           </div>
//         </div>
//       </header>
//       <main>{children}</main>
//       <footer className="site-footer">
//       <div className="footer-inner">
//         <div className="footer-brand">
//           <strong>وبسایت خانه یاب</strong>
//           <span>جستجوی آسان، انتخاب مطمئن</span>
//         </div>

//         <nav className="footer-links" aria-label="لینک‌های فوتر">
//           <Link to="/about">درباره ما</Link>

//           <a href="mailto:khanayabofficial@gmail.com">
//             <Mail size={16} />
//             khanayabofficial@gmail.com
//           </a>

//           <a
//             href="https://wa.me/93795974057"
//             target="_blank"
//             rel="noreferrer"
//           >
//             <MessageCircle size={16} />
//             واتساپ
//           </a>

//           <a
//             href="https://facebook.com/your-facebook-page"
//             target="_blank"
//             rel="noreferrer"
//           >
//             <FacebookIcon size={16} />
//             فیسبوک
//           </a>
//         </nav>

//         <span className="footer-name">خانه یاب</span>
//       </div>
//     </footer>
//     </>
//   )
// }

// export function OfficeNav() {
//   const items = [
//     { to: '/office', label: 'داشبورد', icon: LayoutDashboard, end: true },
//     { to: '/office/listings', label: 'املاک', icon: Building2 },
//     { to: '/office/listings/new', label: 'ثبت ملک جدید', icon: FilePlus2 },
//     { to: '/office/deals', label: 'معاملات', icon: FileText },
//     { to: '/office/notes', label: 'یادداشت‌ها', icon: NotebookPen },
//     { to: '/office/reports', label: 'گزارشات', icon: BarChart3 },
//     { to: '/office/profile', label: 'پروفایل دفتر', icon: UserRound },
//     { to: '/office/change-password', label: 'تغییر رمز عبور', icon: KeyRound },
//   ]
//   return <nav className="office-nav" aria-label="بخش‌های مدیریت دفتر">
//     {items.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end}><Icon size={17} /><span>{label}</span></NavLink>)}
//   </nav>
// }