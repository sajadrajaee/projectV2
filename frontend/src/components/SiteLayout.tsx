import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import {
  BarChart3, Building2, FilePlus2, FileText, KeyRound,
  LayoutDashboard, Mail, Menu, MessageCircle, NotebookPen, UserRound, X
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function FacebookIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z" />
    </svg>
  )
}

export function SiteLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    try { await logout() } finally { navigate('/') }
  }

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <Link className="brand" to="/">
            <strong>خانه یاب</strong>
            <span>جستجوی آسان، انتخاب مطمئن</span>
          </Link>
          <button className="menu-toggle icon-button" aria-label={menuOpen ? 'بستن فهرست' : 'باز کردن فهرست'} onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <nav className={`main-nav ${menuOpen ? 'is-open' : ''}`}>
            <NavLink to="/properties?type=KHANA">خانه</NavLink>
            <NavLink to="/properties?type=DOKAN">دکان</NavLink>
            <NavLink to="/properties?type=ZAMIN">زمین</NavLink>
            <NavLink to="/offices">دفترهای ثبت‌شده</NavLink>
            <NavLink to="/areas">مناطق ثبت‌شده</NavLink>
            {user?.user_type === 'OFFICE' && <NavLink to="/office">مدیریت دفتر</NavLink>}
          </nav>
          <div className="account-actions">
            {user ? <>
              {user.user_type === 'CUSTOMER' && <><Link className="profile-link" to="/profile">پروفایل کاربری</Link><Link className="profile-link" to="/change-password">تغییر رمز</Link></>}
              {user.user_type === 'OFFICE' && <Link className="profile-link" to="/office/profile">پروفایل دفتر</Link>}
              <button className="logout-link" onClick={handleLogout}>خروج</button>
            </> : <>
              <Link className="login-link" to="/login">وارد شدن</Link>
              <Link className="register-link" to="/register">ثبت نام</Link>
            </>}
          </div>
        </div>
      </header>
      <main>{children}</main>
      <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <strong>وبسایت خانه یاب</strong>
          <span>جستجوی آسان، انتخاب مطمئن</span>
        </div>

        <nav className="footer-links" aria-label="لینک‌های فوتر">
          <Link to="/about">درباره ما</Link>

          <a href="mailto:khanayabofficial@gmail.com">
            <Mail size={16} />
            khanayabofficial@gmail.com
          </a>

          <a
            href="https://wa.me/93795974057"
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle size={16} />
            واتساپ
          </a>

          <a
            href="https://facebook.com/your-facebook-page"
            target="_blank"
            rel="noreferrer"
          >
            <FacebookIcon size={16} />
            فیسبوک
          </a>
        </nav>

        <span className="footer-name">خانه یاب</span>
      </div>
    </footer>
    </>
  )
}

export function OfficeNav() {
  const items = [
    { to: '/office', label: 'داشبورد', icon: LayoutDashboard, end: true },
    { to: '/office/listings', label: 'املاک', icon: Building2 },
    { to: '/office/listings/new', label: 'ثبت ملک جدید', icon: FilePlus2 },
    { to: '/office/deals', label: 'معاملات', icon: FileText },
    { to: '/office/notes', label: 'یادداشت‌ها', icon: NotebookPen },
    { to: '/office/reports', label: 'گزارشات', icon: BarChart3 },
    { to: '/office/profile', label: 'پروفایل دفتر', icon: UserRound },
    { to: '/office/change-password', label: 'تغییر رمز عبور', icon: KeyRound },
  ]
  return <nav className="office-nav" aria-label="بخش‌های مدیریت دفتر">
    {items.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end}><Icon size={17} /><span>{label}</span></NavLink>)}
  </nav>
}