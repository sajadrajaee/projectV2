import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { SiteLayout } from './components/SiteLayout'
import {
  AreaPropertiesPage,
  AreasPage,
  ChangePasswordPage,
  CustomerProfilePage,
  HomePage,
  LoginPage,
  OfficeDetailPage,
  OfficesPage,
  PasswordResetPage,
  PasswordResetConfirmPage,
  PropertyDetailPage,
  RegisterPage,
  VerifyEmailPage,
} from './pages/PublicPages'
import {
  DealFormPage,
  DealsPage,
  OfficeChangePasswordPage,
  NoteFormPage,
  NotesPage,
  OfficeDashboardPage,
  OfficeListingsPage,
  OfficeProfilePage,
  PropertyFormPage,
  ReportsPage,
} from './pages/OfficePages'
import { AboutPage } from './pages/AboutPage.tsx'


function PublicLayout() {
  return <SiteLayout><Outlet /></SiteLayout>
}

function RequireRole({ role }: { role: 'CUSTOMER' | 'OFFICE' }) {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (user.user_type !== role) return <Navigate to={user.user_type === 'OFFICE' ? '/office' : '/'} replace />
  return <Outlet />
}

export default function App() {
  return <Routes>
    <Route element={<PublicLayout />}>
      <Route path="/" element={<HomePage />} />  
      <Route path="/about" element={<AboutPage />} />  
       {/* ??  */}
      <Route path="/properties" element={<HomePage />} />
      <Route path="/properties/:id" element={<PropertyDetailPage />} />
      <Route path="/offices" element={<OfficesPage />} />
      <Route path="/offices/:id" element={<OfficeDetailPage />} />
      <Route path="/areas" element={<AreasPage />} />
      <Route path="/areas/:area" element={<AreaPropertiesPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/password-reset" element={<PasswordResetPage />} />
      <Route path="/password-reset/:uid/:token" element={<PasswordResetConfirmPage />} />
      <Route path="/verify-email/:uid/:token" element={<VerifyEmailPage />} />
      <Route element={<RequireRole role="CUSTOMER" />}>
        <Route path="/profile" element={<CustomerProfilePage />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />
      </Route>
    </Route>
    <Route element={<RequireRole role="OFFICE" />}>
      <Route path="/office" element={<OfficeDashboardPage />} />
      <Route path="/office/listings" element={<OfficeListingsPage />} />
      <Route path="/office/listings/new" element={<PropertyFormPage />} />
      <Route path="/office/listings/:id/edit" element={<PropertyFormPage />} />
      <Route path="/office/deals" element={<DealsPage />} />
      <Route path="/office/deals/new" element={<DealFormPage />} />
      <Route path="/office/deals/:id/edit" element={<DealFormPage />} />
      <Route path="/office/notes" element={<NotesPage />} />
      <Route path="/office/notes/new" element={<NoteFormPage />} />
      <Route path="/office/notes/:id/edit" element={<NoteFormPage />} />
      <Route path="/office/reports" element={<ReportsPage />} />
      <Route path="/office/profile" element={<OfficeProfilePage />} />
      <Route path="/office/change-password" element={<OfficeChangePasswordPage />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
}