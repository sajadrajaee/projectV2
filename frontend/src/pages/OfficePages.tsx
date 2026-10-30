import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Building2, Eye, FilePlus2, FileText, Home, MapPin, NotebookPen, Pencil, Phone, UserRound, Trash2 } from 'lucide-react'
import { OfficeNav } from '../components/SiteLayout'
import { useAuth } from '../context/AuthContext'
import { PropertyCard } from '../components/PropertyCard'
import { api, errorMessage } from '../services/api'
import { DISTRICTS, LISTING_TYPES, PROPERTY_TYPES, PROVINCES, labelFor, type Deal, type Note, type Office, type OfficeProfile, type Page, type Property, type Report } from '../types'
import { formatDate, mediaUrl } from '../utils'
import { PageHeading } from './PublicPages'
import { ArrowUp, ArrowDown } from 'lucide-react'

function Notice({ children, tone = 'error' }: { children: string; tone?: 'error' | 'success' }) {
  return <div className={`notice notice-${tone}`} role="status">{children}</div>
}

function RequestState({ loading, error }: { loading: boolean; error: string }) {
  if (loading) return <div className="state-message"><span className="spinner" /> داده‌ها در حال دریافت است...</div>
  if (error) return <div className="state-message state-error">{error}</div>
  return null
}

function OfficeFrame({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const name = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'راهنمای املاک'
  const initial = name.slice(0, 1)
  return <div className="office-shell">
    <header className="office-topbar">
      <Link className="office-brand" to="/" aria-label="خانه‌یاب، صفحه اصلی">
        <span className="office-brand-mark"><Building2 size={22} /></span>
        <span><strong>خانه‌یاب</strong><small>سامانه املاک و رهنمای معاملات</small></span>
      </Link>
      <nav className="office-top-links" aria-label="پیوندهای اصلی">
        <Link to="/">صفحه اصلی</Link><Link to="/offices">دفاتر رهنمای معاملات</Link><Link to="/properties">فهرست املاک</Link>
      </nav>
      <div className="office-top-actions">
        <Link className="office-top-profile" to="/office/profile" aria-label="پروفایل دفتر"><UserRound size={19} /></Link>
        <span className="office-top-user"><span className="office-user-avatar">{initial}</span><span><strong>{name}</strong><small>راهنمای املاک</small></span></span>
      </div>
    </header>
    <div className="office-workspace">
      <aside className="office-sidebar">
        <div className="office-sidebar-identity"><span className="office-sidebar-mark"><Building2 size={19} /></span><span><strong>{name}</strong><small>دفتر رهنمای معاملات</small></span></div>
        <span className="office-sidebar-label">مدیریت دفتر</span>
        <OfficeNav />
        <Link className="office-sidebar-site-link" to="/"><ArrowLeft size={16} /> مشاهده وب‌سایت</Link>
      </aside>
      <main className="office-main">
        <header className="office-header"><div><span className="page-label">پنل مدیریت</span><h1>مدیریت دفتر</h1></div><Link className="back-link" to="/"><ArrowLeft size={16} /> مشاهده سایت</Link></header>
        {children}
      </main>
    </div>
  </div>
}

export function OfficeDashboardPage() {
  const [houses, setHouses] = useState<Page<Property> | null>(null)
  const [office, setOffice] = useState<Office | null>(null)
  const [reports, setReports] = useState<Report | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    Promise.all([api.get<Page<Property>>('office/houses/'), api.get<Office>('office/profile/'), api.get<Report>('reports/')])
      .then(([housesResult, officeResult, reportResult]) => { setHouses(housesResult.data); setOffice(officeResult.data); setReports(reportResult.data) })
      .catch((reason: unknown) => setError(errorMessage(reason)))
  }, [])
  return <OfficeFrame><section className="dashboard-intro"><div><span className="section-label">داشبورد</span><h2>املاک خود را مدیریت کنید</h2><p>خانه‌های ثبت‌شده، معاملات، گزارشات و سایر بخش‌های دفتر را از اینجا مدیریت کنید.</p><p className="office-name-line">{office?.name || 'دفتر املاک'}</p></div><div className="quick-actions"><Link className="primary-button" to="/office/listings/new"><FilePlus2 size={17} /> ایجاد پست جدید</Link><Link className="secondary-button" to="/office/deals">مدیریت معاملات</Link><Link className="secondary-button" to="/office/reports">گزارشات</Link><Link className="secondary-button" to="/office/notes">یادداشت‌ها</Link></div></section>
    {error && <Notice>{error}</Notice>}
    <section className="stat-grid compact-stats">{[
      ['املاک ثبت‌شده', houses?.count], ['املاک موجود', reports?.available], ['معاملات انجام‌شده', reports?.dealed], ['در حال معامله', reports?.dealing],
    ].map(([title, value], index) => {
      const Icon = [Home, Building2, FileText, NotebookPen][index]
      return <article className="stat-card" key={String(title)}><span className="stat-icon"><Icon size={21} /></span><div className="stat-copy"><span>{title}</span><strong>{Number(value ?? 0).toLocaleString('fa-AF')}</strong></div></article>
    })}</section>
    <section className="office-section"><div className="section-heading"><div><span className="section-label">املاک</span><h2>آخرین املاک ثبت‌شده</h2></div><Link className="text-link" to="/office/listings">مشاهده همه املاک</Link></div><RequestState loading={!houses && !error} error="" />{!!houses?.results.length && <div className="property-grid">{houses.results.slice(0, 6).map((property) => <PropertyCard key={property.id} property={property} />)}</div>}{houses?.results.length === 0 && <div className="empty-results">هنوز ملکی ثبت نکرده‌اید.</div>}</section>
  </OfficeFrame>
}


export function OfficeListingsPage() {
  const [params, setParams] = useSearchParams()
  const [houses, setHouses] = useState<Page<Property> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<number | null>(null)

  useEffect(() => {
    setLoading(true)
    setError('')

    api.get<Page<Property>>('office/houses/', {
      params: {
        page: params.get('page') ?? '',
      },
    })
      .then(({ data }) => setHouses(data))
      .catch((reason: unknown) => setError(errorMessage(reason)))
      .finally(() => setLoading(false))
  }, [params])

  function goToPage(url: string | null) {
    if (!url) return

    const next = new URL(url, window.location.origin)
    setParams(next.searchParams)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  async function remove(id: number) {
    if (!window.confirm('آیا از حذف این ملک اطمینان دارید؟')) return

    setBusyId(id)
    setError('')

    try {
      await api.delete(`office/houses/${id}/`)

      // Reload the current page after deletion.
      const currentPage = params.get('page') ?? ''

      const { data } = await api.get<Page<Property>>(
        'office/houses/',
        {
          params: {
            page: currentPage,
          },
        },
      )

      // If the current page becomes empty, go to the previous page.
      if (
        data.results.length === 0 &&
        data.previous
      ) {
        const previous = new URL(
          data.previous,
          window.location.origin,
        )

        setParams(previous.searchParams)
      } else {
        setHouses(data)
      }
    } catch (reason: unknown) {
      setError(errorMessage(reason))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <OfficeFrame>
      <div className="office-section">
        <PageHeading
          label="مدیریت دفتر"
          title="املاک ثبت‌شده"
          description="فهرست آگهی‌های دفتر خود را مدیریت کنید."
        />

        <div className="section-toolbar">
          <span>
            {houses?.count.toLocaleString('fa-AF') ?? '۰'} ملک
          </span>

          <Link
            className="primary-button"
            to="/office/listings/new"
          >
            <FilePlus2 size={17} />
            ایجاد پست جدید
          </Link>
        </div>

        <RequestState loading={loading} error={error} />

        {!loading &&
          !error &&
          houses?.results.length === 0 && (
            <div className="empty-results">
              هنوز ملکی ثبت نکرده‌اید.
            </div>
          )}

        {!!houses?.results.length && (
          <div className="property-grid">
            {houses.results.map((property) => (
              <div
                className="managed-property"
                key={property.id}
              >
                <PropertyCard property={property} />

                <div className="managed-actions">
                  <Link
                    className="icon-button"
                    title="مشاهده"
                    aria-label="مشاهده"
                    to={`/properties/${property.id}`}
                  >
                    <Eye size={17} />
                  </Link>

                  <Link
                    className="icon-button"
                    title="ویرایش"
                    aria-label="ویرایش"
                    to={`/office/listings/${property.id}/edit`}
                  >
                    <Pencil size={17} />
                  </Link>

                  <button
                    className="icon-button danger-icon"
                    title="حذف"
                    aria-label="حذف"
                    disabled={busyId === property.id}
                    onClick={() => remove(property.id)}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {(houses?.previous || houses?.next) && (
          <div className="pagination">
            {houses.previous && (
              <button
                className="pagination-link"
                onClick={() => goToPage(houses.previous)}
                disabled={loading}
              >
                <ArrowUp size={16} />
                نمایش قبلی
              </button>
            )}

            {houses.next && (
              <button
                className="pagination-link"
                onClick={() => goToPage(houses.next)}
                disabled={loading}
              >
                <ArrowDown size={16} />
                نمایش بیشتر
              </button>
            )}
          </div>
        )}
      </div>
    </OfficeFrame>
  )
}



const emptyProperty = {
  listing_type: 'RENT',
  property_type: 'KHANA',
  description: '',
  price: '',
  province: 'KABUL',
  district: '13',
  area: '',
  status: 'AVAILABLE',
}

export function PropertyFormPage() {
  const { id } = useParams()
  const editing = Boolean(id)
  const navigate = useNavigate()

  const [initial, setInitial] = useState<Record<string, string>>(emptyProperty)
  const [loading, setLoading] = useState(editing)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const [existingFiles, setExistingFiles] = useState<
    { id: number; file: string }[]
  >([])
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [deletedFileIds, setDeletedFileIds] = useState<number[]>([])

  useEffect(() => {
    if (!id) return

    api.get<Property>(`office/houses/${id}/`)
      .then(({ data }) => {
        setInitial({
          listing_type: data.listing_type,
          property_type: data.property_type,
          description: data.description || '',
          price: String(data.price ?? ''),
          province: data.province || 'KABUL',
          district: data.district,
          area: data.area || '',
          status: data.status,
        })

        setExistingFiles(data.files || [])
      })
      .catch((reason: unknown) => setError(errorMessage(reason)))
      .finally(() => setLoading(false))
  }, [id])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setBusy(true)

    const form = event.currentTarget
    const formData = new FormData(form)

    try {
      if (editing) {
        // Remove file fields before adding the selected files.
        formData.delete('files')
        formData.delete('delete_file_ids')

        // Add newly selected files.
        newFiles.forEach((file) => {
          formData.append('files', file)
        })

        // Add IDs of files selected for deletion.
        deletedFileIds.forEach((fileId) => {
          formData.append('delete_file_ids', String(fileId))
        })

        await api.patch(`office/houses/${id}/`, formData)
      } else {
        // Keep the existing creation behavior.
        await api.post('office/create/', formData)
      }

      navigate('/office/listings')
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setBusy(false)
    }
  }

  return (
    <OfficeFrame>
      <div className="office-section form-page">
        <PageHeading
          label="مدیریت دفتر"
          title={editing ? 'ویرایش ملک' : 'ایجاد پست جدید'}
          description="اطلاعات پست خود را وارد کرده و فایل‌های مربوط را اضافه کنید."
        />

        {error && <Notice>{error}</Notice>}

        <RequestState loading={loading} error="" />

        {!loading && (
          <form
            className="panel form-stack"
            onSubmit={submit}
            encType="multipart/form-data"
          >
            <div className="form-section">
              <div className="section-title">
                <span className="section-number">۱</span>
                <div>
                  <h2>اطلاعات پست</h2>
                  <p>جزئیات اصلی پست را وارد کنید.</p>
                </div>
              </div>

              <div className="form-grid">
                <Field label="نوع معامله">
                  <select name="listing_type" defaultValue={initial.listing_type}>
                    {LISTING_TYPES.map(([key, name]) => (
                      <option key={key} value={key}>{name}</option>
                    ))}
                  </select>
                </Field>

                <Field label="نوعیت ملک">
                  <select name="property_type" defaultValue={initial.property_type}>
                    {PROPERTY_TYPES.map(([key, name]) => (
                      <option key={key} value={key}>{name}</option>
                    ))}
                  </select>
                </Field>

                <Field label="ولایت">
                  <select name="province" defaultValue={initial.province}>
                    {PROVINCES.map(([key, name]) => (
                      <option key={key} value={key}>{name}</option>
                    ))}
                  </select>
                </Field>

                <Field label="ناحیه">
                  <select name="district" defaultValue={initial.district}>
                    {DISTRICTS.map(([key, name]) => (
                      <option key={key} value={key}>{name}</option>
                    ))}
                  </select>
                </Field>

                <Field label="منطقه">
                  <input name="area" defaultValue={initial.area} />
                </Field>

                <Field label="قیمت">
                  <input
                    name="price"
                    type="number"
                    min="0"
                    defaultValue={initial.price}
                  />
                </Field>

                {editing && (
                  <Field label="وضعیت">
                    <select name="status" defaultValue={initial.status}>
                      <option value="AVAILABLE">موجود</option>
                      <option value="SOLD">فروخته شده</option>
                      <option value="RENTED">کرایه داده شده</option>
                    </select>
                  </Field>
                )}

                <Field label="توضیحات">
                  <textarea
                    name="description"
                    rows={4}
                    defaultValue={initial.description}
                  />
                </Field>
              </div>
            </div>

            {/* File management: available during creation and editing */}
            <div className="form-section">
              <div className="section-title">
                <span className="section-number">۲</span>
                <div>
                  <h2>فایل و پیوست</h2>
                  <p>تصاویر و ویدیوهای ملک را مدیریت کنید.</p>
                </div>
              </div>

              {editing && existingFiles.length > 0 && (
                <div>
                  <h3>فایل‌های فعلی</h3>

                  {existingFiles.map((file) => (
                    <div key={file.id}>
                      <a
                        href={file.file}
                        target="_blank"
                        rel="noreferrer"
                      >
                        مشاهده فایل {file.id}
                      </a>

                      <label>
                        <input
                          type="checkbox"
                          checked={deletedFileIds.includes(file.id)}
                          onChange={(event) => {
                            setDeletedFileIds((current) =>
                              event.target.checked
                                ? [...current, file.id]
                                : current.filter((fileId) => fileId !== file.id)
                            )
                          }}
                        />
                        حذف این فایل
                      </label>
                    </div>
                  ))}
                </div>
              )}

              <Field label="انتخاب تصاویر و ویدیوها">
                <input
                  type="file"
                  name={editing ? undefined : 'files'}
                  multiple
                  accept="image/*,video/*"
                  onChange={(event) => {
                    setNewFiles(Array.from(event.target.files || []))
                  }}
                />
              </Field>

              {newFiles.length > 0 && (
                <p>{newFiles.length} فایل جدید انتخاب شده است.</p>
              )}
            </div>

            <div className="form-actions">
              <Link className="secondary-button" to="/office/listings">
                بازگشت
              </Link>

              <button className="primary-button" disabled={busy}>
                {busy
                  ? 'در حال ذخیره...'
                  : editing
                    ? 'ذخیره تغییرات'
                    : 'ایجاد پست'}
              </button>
            </div>
          </form>
        )}
      </div>
    </OfficeFrame>
  )
}


function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="form-group"><span>{label}</span>{children}</label>
}

export function DealsPage() {
  const [deals, setDeals] = useState<Deal[] | null>(null)
  const [error, setError] = useState('')
  useEffect(() => { api.get<Deal[]>('office/deals/').then(({ data }) => setDeals(data)).catch((reason: unknown) => setError(errorMessage(reason))) }, [])
  const countByStatus = (status: Deal['status']) => deals?.filter((deal) => deal.status === status).length ?? 0
  return <OfficeFrame><div className="office-section"><PageHeading label="مدیریت دفتر" title="مدیریت معاملات" description="وضعیت و جزئیات معاملات ثبت‌شده را مدیریت کنید." /><div className="stat-grid"><Stat title="معاملات انجام‌شده" value={countByStatus('DEALED')} /><Stat title="معاملات در حال انجام" value={countByStatus('DEALING')} /><Stat title="معاملات لغو شده" value={countByStatus('CANCELED')} /></div><div className="section-toolbar"><h2>معاملات ثبت‌شده</h2><Link className="primary-button" to="/office/deals/new"><FilePlus2 size={17} /> ایجاد معامله جدید</Link></div>{error && <Notice>{error}</Notice>}<RequestState loading={!deals && !error} error="" />{deals?.length ? <div className="deal-list">{deals.map((deal, index) => <article className="deal-card" key={deal.id}><header className="deal-header"><div><span className="deal-number">معامله شماره {(index + 1).toLocaleString('fa-AF')}</span><h3>{labelFor(deal.status, [['DEALED', 'معامله شده'], ['DEALING', 'در حال معامله'], ['CANCELED', 'لغو شده']])}</h3></div><span className={`status-badge status-${deal.status.toLowerCase()}`}>{labelFor(deal.status, [['DEALED', 'معامله شده'], ['DEALING', 'در حال معامله'], ['CANCELED', 'لغو شده']])}</span></header><div className="deal-info">
    <Info label="مشتری">{deal.customer_name} · {deal.customer_phone}</Info><Info label="مالک">{deal.owner_name} · {deal.owner_phone}</Info><Info label="شماره سریال">{deal.sata_number || 'ثبت نشده'}</Info><Info label="نوع معامله">{labelFor(deal.deal_type, LISTING_TYPES)}</Info><Info label="قیمت کل">{deal.total_price} {deal.currency}</Info><Info label="پیش‌پرداخت">{deal.advance_payment} {deal.currency}</Info><Info label="کمیشن دفتر">{deal.office_commission} {deal.currency}</Info><Info label="تاریخ ایجاد">{formatDate(deal.created_at)}</Info><Info label="توضیحات">{deal.description || 'ندارد'}</Info>
    </div><Link className="text-link" to={`/office/deals/${deal.id}/edit`}>ویرایش معامله</Link></article>)}</div> : deals && <div className="empty-results">هنوز معامله‌ای ثبت نشده است.</div>}</div></OfficeFrame>
}

export function DealFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [initial, setInitial] = useState<Partial<Deal>>({ deal_type: 'RENT', status: 'DEALING', currency: 'AFN' })
  const [loading, setLoading] = useState(Boolean(id))
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => { if (id) api.get<Deal>(`office/deals/${id}/`).then(({ data }) => setInitial(data)).catch((reason: unknown) => setError(errorMessage(reason))).finally(() => setLoading(false)) }, [id])
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setBusy(true)
    const values = new FormData(event.currentTarget)
    try { if (id) await api.patch(`office/deals/${id}/`, values); else await api.post('office/deals/', values); navigate('/office/deals') }
    catch (reason) { setError(errorMessage(reason)) }
    finally { setBusy(false) }
  }
  return <OfficeFrame><div className="office-section form-page"><PageHeading label="مدیریت دفتر" title={id ? 'ویرایش معامله' : 'ایجاد معامله جدید'} />{error && <Notice>{error}</Notice>}<RequestState loading={loading} error="" />{!loading && <form className="panel form-stack" onSubmit={submit} encType="multipart/form-data"><div className="form-grid">
    <Field label="شماره سریال سته"><input name="sata_number" defaultValue={initial.sata_number || ''} /></Field>
    <Field label="نوع معامله"><select name="deal_type" defaultValue={initial.deal_type || 'RENT'}><option value="SALE">خرید و فروش</option><option value="RENT">کرایه / اجاره</option></select></Field>
    <Field label="نام مالک"><input name="owner_name" defaultValue={initial.owner_name || ''} /></Field><Field label="تلفن مالک"><input name="owner_phone" defaultValue={initial.owner_phone || ''} /></Field>
    <Field label="نام مشتری"><input name="customer_name" defaultValue={initial.customer_name || ''} /></Field><Field label="تلفن مشتری"><input name="customer_phone" defaultValue={initial.customer_phone || ''} /></Field>
    <Field label="قیمت کل معامله"><input name="total_price" type="number" step="0.01" defaultValue={initial.total_price || ''} /></Field><Field label="پیش‌پرداخت"><input name="advance_payment" type="number" step="0.01" defaultValue={initial.advance_payment || '0'} /></Field>
    <Field label="ارز"><input name="currency" defaultValue={initial.currency || 'AFN'} /></Field><Field label="کمیشن دفتر"><input name="office_commission" type="number" step="0.01" defaultValue={initial.office_commission || ''} /></Field>
    <Field label="وضعیت"><select name="status" defaultValue={initial.status || 'DEALING'}><option value="DEALING">در حال معامله</option><option value="DEALED">معامله شده</option><option value="CANCELED">لغو شده</option></select></Field>
    <Field label="توضیحات"><textarea name="description" rows={4} defaultValue={initial.description || ''} /></Field>
    <Field label="فایل قرارداد"><input type="file" name="deal_contract" accept="image/*,.pdf,.doc,.docx" />{initial.deal_contract && <a className="text-link" href={mediaUrl(initial.deal_contract)} target="_blank" rel="noreferrer">قرارداد فعلی</a>}</Field>
  </div><div className="form-actions"><Link className="secondary-button" to="/office/deals">بازگشت</Link><button className="primary-button" disabled={busy}>{busy ? 'در حال ذخیره...' : 'ذخیره معامله'}</button></div></form>}</div></OfficeFrame>
}

function Stat({ title, value }: { title: string; value: number }) { return <article className="stat-card"><span>{title}</span><strong>{value.toLocaleString('fa-AF')}</strong></article> }
function Info({ label, children }: { label: string; children: React.ReactNode }) { return <div className="info-item"><span className="info-label">{label}</span><p>{children}</p></div> }

export function NotesPage() {
  const [notes, setNotes] = useState<Page<Note> | null>(null)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<number | null>(null)
  function load() { api.get<Page<Note>>('notes/').then(({ data }) => setNotes(data)).catch((reason: unknown) => setError(errorMessage(reason))) }
  useEffect(() => { load() }, [])
  async function remove(id: number) {
    if (!window.confirm('آیا از حذف این یادداشت اطمینان دارید؟')) return
    setBusyId(id)
    try { await api.delete(`notes/${id}/`); load() } catch (reason) { setError(errorMessage(reason)) } finally { setBusyId(null) }
  }
  return <OfficeFrame><div className="office-section"><PageHeading label="دفتر" title="یادداشت‌ها" description="یادداشت‌های مهم دفتر خود را اینجا مدیریت کنید." /><div className="section-toolbar"><span>یادداشت‌های ثبت‌شده</span><Link className="primary-button" to="/office/notes/new"><NotebookPen size={17} /> یادداشت جدید</Link></div>{error && <Notice>{error}</Notice>}<RequestState loading={!notes && !error} error="" />{notes?.results.length ? <div className="notes-grid">{notes.results.map((note, index) => <article className="note-card" key={note.id}><div className="note-card-top"><span className="note-number">{(index + 1).toLocaleString('fa-AF')}</span><time>{formatDate(note.create_at)}</time></div><h3>{note.title}</h3><p className="note-content">{note.description}</p><div className="note-actions"><Link className="secondary-button" to={`/office/notes/${note.id}/edit`}><Pencil size={15} /> ویرایش</Link><button className="danger-button" disabled={busyId === note.id} onClick={() => remove(note.id)}><Trash2 size={15} /> حذف</button></div></article>)}</div> : notes && <div className="empty-results"><FileText size={26} /><h3>هنوز یادداشتی ایجاد نکرده‌اید</h3><p>یادداشت‌های مهم دفتر خود را برای دسترسی آسان اینجا ثبت کنید.</p><Link className="primary-button" to="/office/notes/new">ایجاد اولین یادداشت</Link></div>}</div></OfficeFrame>
}

export function NoteFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [initial, setInitial] = useState({ title: '', description: '' })
  const [loading, setLoading] = useState(Boolean(id))
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => { if (id) api.get<Note>(`notes/${id}/`).then(({ data }) => setInitial({ title: data.title, description: data.description })).catch((reason: unknown) => setError(errorMessage(reason))).finally(() => setLoading(false)) }, [id])
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('')
    const values = Object.fromEntries(new FormData(event.currentTarget).entries())
    try { if (id) await api.patch(`notes/${id}/`, values); else await api.post('notes/', values); navigate('/office/notes') }
    catch (reason) { setError(errorMessage(reason)) } finally { setBusy(false) }
  }
  return <OfficeFrame><div className="office-section form-page"><PageHeading label="دفتر" title={id ? 'ویرایش یادداشت' : 'یادداشت جدید'} />{error && <Notice>{error}</Notice>}<RequestState loading={loading} error="" />{!loading && <form className="panel form-stack" onSubmit={submit}><Field label="عنوان"><input name="title" defaultValue={initial.title} required /></Field><Field label="توضیحات"><textarea name="description" rows={7} defaultValue={initial.description} required /></Field><div className="form-actions"><Link className="secondary-button" to="/office/notes">بازگشت</Link><button className="primary-button" disabled={busy}>{busy ? 'در حال ذخیره...' : 'ذخیره یادداشت'}</button></div></form>}</div></OfficeFrame>
}

const reportFields = [
  ['renthouse', 'املاک کرایی'], ['salehouse', 'املاک فروشی'], ['gerawihouse', 'املاک گروی'],
  ['available', 'املاک موجود'], ['SOLD', 'املاک فروخته‌شده'], ['RENTED', 'املاک کرایه‌داده‌شده'],
  ['dealed', 'قراردادهای معامله‌شده'], ['dealing', 'قراردادهای در حال معامله'], ['canceled', 'قراردادهای لغوشده'],
] as const

export function ReportsPage() {
  const [report, setReport] = useState<Report | null>(null)
  const [error, setError] = useState('')
  useEffect(() => { api.get<Report>('reports/').then(({ data }) => setReport(data)).catch((reason: unknown) => setError(errorMessage(reason))) }, [])
  return <OfficeFrame><div className="office-section"><PageHeading label="مدیریت دفتر" title="گزارشات" description="خلاصه‌ای از وضعیت دفتر، املاک و قراردادهای شما" />{error && <Notice>{error}</Notice>}<RequestState loading={!report && !error} error="" />{report && <><section className="report-section"><div className="section-heading"><Home size={19} /><div><h2>گزارش املاک و قراردادها</h2><p>آمار بر اساس اطلاعات ثبت‌شده در دفتر</p></div></div><div className="stat-grid report-grid">{reportFields.map(([key, title]) => <Stat key={key} title={title} value={report[key] ?? 0} />)}</div></section><footer className="reports-footer">اطلاعات بر اساس داده‌های ثبت‌شده در سیستم</footer></>}</div></OfficeFrame>
}

export function OfficeProfilePage() {
  const [office, setOffice] = useState<OfficeProfile | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  useEffect(() => { api.get<OfficeProfile>('office/profile/').then(({ data }) => setOffice(data)).catch((reason: unknown) => setError(errorMessage(reason))) }, [])
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setMessage('')
    try { const { data } = await api.patch<OfficeProfile>('office/profile/', new FormData(event.currentTarget)); setOffice(data); setMessage('پروفایل دفتر به‌روز شد.') }
    catch (reason) { setError(errorMessage(reason)) }
  }
  const phoneHref = office?.admin_phone ? `tel:${office.admin_phone}` : undefined
  const whatsappNumber = office?.admin_whatsapp?.replace(/\D/g, '')
  const whatsappHref = whatsappNumber ? `https://wa.me/${whatsappNumber}` : undefined
  return <OfficeFrame><div className="office-section profile-page">
    <PageHeading label="مدیریت دفتر" title="پروفایل دفتر" description="اطلاعات دفتر و راه‌های تماس‌تان را مدیریت کنید." />
    {error && <Notice>{error}</Notice>}{message && <Notice tone="success">{message}</Notice>}
    {!office && !error && <RequestState loading error="" />}
    {office && <>
      <section className="office-profile-summary panel">
        {office.profile ? <img className="profile-preview" src={mediaUrl(office.profile)} alt="تصویر دفتر" /> : <span className="profile-preview profile-preview-placeholder"><Building2 size={25} /></span>}
        <div className="office-profile-identity"><span className="section-label">نمای کلی دفتر</span><h2>{office.name || 'دفتر املاک'}</h2><p>{office.introduction || 'معرفی دفتر را اضافه کنید تا بازدیدکنندگان با خدمات‌تان آشنا شوند.'}</p></div>
        <div className="office-contact-cards">
          <div className="office-contact-card"><span className="contact-icon"><Phone size={17} /></span><div><small>شماره تماس</small>{phoneHref ? <a href={phoneHref} dir="ltr">{office.admin_phone}</a> : <strong>ثبت نشده</strong>}</div></div>
          <div className="office-contact-card whatsapp-contact"><span className="contact-icon"><WhatsAppMark /></span><div><small>واتساپ</small>{whatsappHref ? <a href={whatsappHref} target="_blank" rel="noreferrer" dir="ltr">{office.admin_whatsapp}</a> : <strong>ثبت نشده</strong>}</div></div>
          <div className="office-contact-card"><span className="contact-icon"><MapPin size={17} /></span><div><small>نشانی دفتر</small><strong>{office.address || 'ثبت نشده'}</strong></div></div>
        </div>
      </section>
      <form className="panel profile-form office-profile-form" onSubmit={submit} encType="multipart/form-data">
        <div className="profile-form-heading"><span className="section-label">اطلاعات کسب‌وکار</span><h2>ویرایش پروفایل</h2><p>اطلاعات تماس با حساب راهنمای دفترتان ذخیره می‌شود.</p></div>
        <div className="form-grid">
          <Field label="نام دفتر"><input name="name" defaultValue={office.name || ''} /></Field>
          <Field label="نشانی دفتر"><input name="address" defaultValue={office.address || ''} /></Field>
          <Field label="معرفی"><textarea name="introduction" rows={3} defaultValue={office.introduction || ''} /></Field>
          <Field label="شماره تماس"><input type="tel" name="admin_phone" autoComplete="tel" defaultValue={office.admin_phone || ''} /></Field>
          <Field label="شماره واتساپ"><input type="tel" name="admin_whatsapp" autoComplete="tel" placeholder="+93 7X XXX XXXX" defaultValue={office.admin_whatsapp || ''} /></Field>
          <Field label="تصویر دفتر"><input type="file" name="profile" accept="image/*" /></Field>
        </div>
        <button className="primary-button">ذخیره تغییرات</button>
      </form>
    </>}
  </div></OfficeFrame>
}

function WhatsAppMark() {
  return <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor">
    <path d="M12 2a9.6 9.6 0 0 0-8.22 14.56L2.5 21.5l5.08-1.24A9.6 9.6 0 1 0 12 2Zm0 17.43a7.8 7.8 0 0 1-3.98-1.09l-.29-.17-3.02.74.76-2.94-.19-.3A7.8 7.8 0 1 1 12 19.43Zm4.28-5.84c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.94-1.2-.72-.64-1.2-1.43-1.34-1.67-.14-.24-.02-.37.1-.49.11-.1.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.19-.47-.39-.4-.54-.41h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.69 2.58 4.1 3.62.57.25 1.02.4 1.37.51.58.18 1.1.15 1.51.09.46-.07 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28Z" />
  </svg>
}

export function OfficeChangePasswordPage() {
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setMessage('')
    const values = Object.fromEntries(new FormData(event.currentTarget).entries())
    try { const { data } = await api.post<{ message: string }>('auth/change-password/', values); setMessage(data.message) }
    catch (reason) { setError(errorMessage(reason)) }
  }
  return <OfficeFrame><div className="office-section form-page"><PageHeading label="مدیریت دفتر" title="تغییر رمز عبور" />{error && <Notice>{error}</Notice>}{message && <Notice tone="success">{message}</Notice>}<form className="panel form-stack" onSubmit={submit}><Field label="رمز فعلی"><input type="password" name="old_password" required autoComplete="current-password" /></Field><Field label="رمز جدید"><input type="password" name="new_password" required autoComplete="new-password" /></Field><Field label="تکرار رمز جدید"><input type="password" name="confirm_password" required autoComplete="new-password" /></Field><button className="primary-button">ذخیره رمز جدید</button></form></div></OfficeFrame>
}