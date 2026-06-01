
import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  CheckSquare,
  Clock,
  Construction,
  DollarSign,
  Filter,
  Image,
  LayoutDashboard,
  Lock,
  LogOut,
  Mail,
  Layers,
  PackageCheck,
  QrCode,
  Search,
  Upload,
  User,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import ProjectQrScanner from './components/ProjectQrScanner';
import { hasSupabaseEnv, supabase } from './lib/supabaseClient';
import { loginAdmin, loginStaff, saveSiteContent, uploadSiteImage } from './lib/siteContentApi';
import { defaultSiteContent } from './siteContent';

const LOGO_URL = 'https://cdn.shopify.com/s/files/1/0995/6432/3185/files/FILO.png?v=1775935955';
const SESSION_KEY = 'construtrack_session_v1';
const EMPLOYEE_ROLES = [
  { value: 'supervisor', label: 'Supervisor de cuadrilla' },
  { value: 'tecnico_vertical', label: 'Técnico vertical' },
  { value: 'operario', label: 'Operario / ayudante' },
  { value: 'administrativo', label: 'Administrativo' },
];
const ROLE_LABELS = {
  admin: 'Administrador',
  supervisor: 'Supervisor de cuadrilla',
  tecnico_vertical: 'Técnico vertical',
  operario: 'Operario / ayudante',
  administrativo: 'Administrativo',
  arquitecto: 'Arquitecto',
  capataz: 'Capataz',
  obrero: 'Obrero',
};
const EMPLOYEE_FORM_DEFAULTS = {
  employee_id: '',
  full_name: '',
  role: 'tecnico_vertical',
  shift: '',
  email: '',
  avatar_url: '',
  password: '',
  admin_code: '',
};

const PROJECTS = [
  { id: 'ALT-001', name: 'Fachada vertical Norte', location: 'CABA, Buenos Aires', progress: 68, budget: '$4.8M', accessCode: 'FILO-ALT-001', status: 'Pintura y sellado' },
  { id: 'VID-002', name: 'Limpieza de vidrios en altura', location: 'Vicente Lopez, Buenos Aires', progress: 35, budget: '$1.6M', accessCode: 'FILO-VID-002', status: 'En preparacion' },
  { id: 'IMP-003', name: 'Terraza con filtraciones', location: 'San Isidro, Buenos Aires', progress: 20, budget: '$2.9M', accessCode: 'FILO-IMP-003', status: 'Armado de insumos' },
  { id: 'CAR-004', name: 'Carteleria exterior', location: 'Palermo, Buenos Aires', progress: 12, budget: '$1.2M', accessCode: 'FILO-CAR-004', status: 'Relevamiento' },
];

const FALLBACK_USERS = [
  { id: 'ADM-001', name: 'Administrador Filo', role: 'admin', shift: '07:00-17:00', email: 'admin@filo.local', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin', qrCode: null },
];

const TASKS = [
  { id: 1, title: 'Relevar puntos de anclaje y linea de vida', status: 'en proceso', assignedTo: 'Capataz', priority: 'alta' },
  { id: 2, title: 'Preparar pintura elastomerica y selladores', status: 'sin iniciar', assignedTo: 'Equipo vertical', priority: 'alta' },
  { id: 3, title: 'Coordinar corte de vereda y perimetro seguro', status: 'terminada', assignedTo: 'Administrador', priority: 'media' },
  { id: 4, title: 'Registrar fotos antes/despues para landing', status: 'sin iniciar', assignedTo: 'Operario', priority: 'media' },
];

const SUPPLIES = [
  { name: 'Arnes integral', stock: 6, unit: 'u', status: 'OK' },
  { name: 'Silletas certificadas', stock: 4, unit: 'u', status: 'Revisar' },
  { name: 'Cuerdas y lineas de vida', stock: 180, unit: 'm', status: 'OK' },
  { name: 'Sellador poliuretanico', stock: 18, unit: 'cartuchos', status: 'Comprar' },
  { name: 'Pintura elastomerica', stock: 7, unit: 'baldes', status: 'OK' },
  { name: 'Limpiavidrios y escurridores', stock: 5, unit: 'kits', status: 'OK' },
  { name: 'Membrana liquida', stock: 9, unit: 'baldes', status: 'Comprar' },
  { name: 'Elementos de demarcacion', stock: 12, unit: 'u', status: 'OK' },
];

const ROLE_DASHBOARDS = {
  admin: {
    badge: 'Panel administrador',
    title: 'Control general de trabajos y equipo',
    detail: 'Alta de personal, contenido publico, costos, asistencia e insumos.',
    focus: ['Crear y revisar accesos del equipo', 'Validar asistencia por obra', 'Actualizar contenido del landing'],
    tasks: [1, 2, 3, 4],
    checklist: ['Variables y Supabase operativos', 'Equipo con QR activo', 'Contenido público actualizado'],
  },
  supervisor: {
    badge: 'Panel supervisor',
    title: 'Seguimiento de obra y cuadrilla',
    detail: 'Avance, asistencia del equipo, insumos críticos y tareas de coordinación.',
    focus: ['Revisar puntos de anclaje', 'Controlar avance y asistencia', 'Confirmar materiales antes de salir'],
    tasks: [1, 2, 4],
    checklist: ['Perímetro seguro', 'EPP revisado por cuadrilla', 'Fotos de avance registradas'],
  },
  tecnico_vertical: {
    badge: 'Panel técnico vertical',
    title: 'Tareas técnicas asignadas',
    detail: 'Trabajo en altura, seguridad, materiales y registro de entrada/salida.',
    focus: ['Revisar arnés y cuerda', 'Preparar selladores y herramientas', 'Registrar asistencia con QR de obra'],
    tasks: [1, 2],
    checklist: ['Arnés integral colocado', 'Línea de vida verificada', 'Herramientas aseguradas'],
  },
  operario: {
    badge: 'Panel operario',
    title: 'Tareas del turno',
    detail: 'Indicaciones simples para asistencia, apoyo operativo y registro de fotos.',
    focus: ['Marcar entrada y salida', 'Asistir al equipo vertical', 'Cargar fotos de avance si corresponde'],
    tasks: [4],
    checklist: ['EPP completo', 'Zona de trabajo despejada', 'Material preparado'],
  },
  administrativo: {
    badge: 'Panel administrativo',
    title: 'Administración y contenido',
    detail: 'Costos, personal, documentación operativa y edición del sitio público.',
    focus: ['Revisar costos del servicio', 'Mantener datos del equipo', 'Actualizar contenido comercial'],
    tasks: [3, 4],
    checklist: ['Presupuesto revisado', 'Datos del personal al día', 'Contenido público validado'],
  },
};

function normalizeOptionalMediaUrl(value) {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (!trimmed) return '';

  try {
    const url = new URL(trimmed);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : '';
  } catch {
    return '';
  }
}

function isPlayableVideoUrl(value) {
  if (!value) return false;
  if (/^data:video\//i.test(value)) return true;
  const cleanUrl = value.split('?')[0].split('#')[0].toLowerCase();
  return ['.mp4', '.webm', '.ogg', '.mov', '.m4v'].some((extension) => cleanUrl.endsWith(extension));
}

function makeQrPayload(user) {
  return `CTLOGIN|${user.id}|${user.email.toLowerCase()}|${user.role}`;
}

function userQrValue(user) {
  return user.qrCode || makeQrPayload(user);
}

function projectQrValue(project) {
  return `CTSITE|${project.id}|${project.accessCode}`;
}

function parseProjectQr(value) {
  const parts = value.trim().split('|');
  if (parts.length !== 3 || parts[0] !== 'CTSITE') return null;
  return { projectId: parts[1], accessCode: parts[2] };
}

function parseTimeToMinutes(value) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(value || '').trim());
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function isNowInsideShift(shift, date = new Date()) {
  const [startText, endText] = String(shift || '').split('-').map((part) => part.trim());
  const start = parseTimeToMinutes(startText);
  const end = parseTimeToMinutes(endText);
  if (start === null || end === null) return true;

  const now = date.getHours() * 60 + date.getMinutes();
  if (start === end) return true;
  if (start < end) return now >= start && now <= end;
  return now >= start || now <= end;
}

function mapDbUser(row) {
  return {
    id: row.employee_id,
    name: row.full_name,
    role: row.role,
    shift: row.shift,
    email: row.email,
    avatar: row.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${row.employee_id}`,
    qrCode: row.qr_code || null,
  };
}

function mapAttendanceRow(row) {
  return {
    id: row.id,
    employeeId: row.employee_id,
    projectId: row.project_id,
    checkInAt: row.check_in_at,
    checkOutAt: row.check_out_at,
    status: row.status,
    qrPayload: row.qr_payload,
  };
}

function calculateWorkedHours(record, now = new Date()) {
  if (!record?.checkInAt) return 0;
  const start = new Date(record.checkInAt);
  const end = record.checkOutAt ? new Date(record.checkOutAt) : now;
  const milliseconds = end.getTime() - start.getTime();
  if (!Number.isFinite(milliseconds) || milliseconds <= 0) return 0;
  return Math.round((milliseconds / 36e5) * 100) / 100;
}

function isStaleOpenSession(record, now = new Date()) {
  return !record?.checkOutAt && calculateWorkedHours(record, now) > 16;
}

function formatWorkedHours(hours) {
  if (!Number.isFinite(hours)) return '0 h';
  return `${hours.toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} h`;
}

function Badge({ children, tone = 'neutral' }) {
  const tones = {
    neutral: 'bg-slate-100 text-slate-700',
    green: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
    red: 'bg-red-100 text-red-700',
  };
  return <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${tones[tone]}`}>{children}</span>;
}

function Panel({ children, className = '', onClick }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm ${onClick ? 'cursor-pointer transition hover:-translate-y-0.5 hover:shadow-lg' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

function MenuButton({ active, icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${active ? 'bg-[#1F6B3F] text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
    >
      <Icon size={18} />
      <span>{label}</span>
    </button>
  );
}

function StatCard({ label, value, detail }) {
  return (
    <Panel className="bg-white">
      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">{label}</p>
      <div className="mt-3 flex items-end justify-between gap-4">
        <p className="text-3xl font-bold tracking-tight text-slate-900">{value}</p>
        {detail && <p className="text-xs font-semibold text-emerald-700">{detail}</p>}
      </div>
    </Panel>
  );
}

function ImageFieldEditor({
  label,
  value,
  onChange,
  onUpload,
  onClear,
  uploading = false,
  helpText = 'Pega una URL o sube una imagen.',
  accept = 'image/*',
  mediaType = 'image',
  optional = false,
  showUrlInput = true,
  uploadLabel,
}) {
  const fileInputRef = React.useRef(null);
  const previewUrl = normalizeOptionalMediaUrl(value);
  const isVideoPreview = mediaType === 'video' || isPlayableVideoUrl(previewUrl);
  const mediaLabel = isVideoPreview ? 'video' : 'imagen';

  return (
    <div>
      <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">{label}</label>
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-3">
        {showUrlInput && (
          <input
            value={value}
            onChange={onChange}
            placeholder={optional ? 'Opcional: pegá una URL de imagen o subí una foto' : undefined}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1F6B3F]"
          />
        )}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white transition hover:bg-[#1F6B3F] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Upload size={14} />
            {uploading ? 'Subiendo...' : uploadLabel || (mediaType === 'video' ? 'Subir video' : 'Subir foto')}
          </button>
          {!showUrlInput && previewUrl && (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 transition hover:border-red-200 hover:text-red-600"
            >
              Quitar archivo
            </button>
          )}
          <span className="text-[11px] text-slate-500">{helpText}</span>
        </div>
        <p className="text-[11px] leading-5 text-slate-400">
          Al subir un archivo, se guarda en Supabase Storage y queda conectado al sitio.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (!file) return;
            await onUpload(file);
          }}
        />
        {previewUrl && isVideoPreview ? (
          <div className="overflow-hidden rounded-xl border border-slate-100 bg-slate-950">
            <video src={previewUrl} className="h-36 w-full object-cover" controls muted playsInline />
            {!showUrlInput && (
              <div className="border-t border-white/10 bg-slate-900 px-3 py-2 text-[11px] font-semibold text-slate-300">
                Video guardado en Supabase Storage.
              </div>
            )}
          </div>
        ) : previewUrl ? (
          <div className="overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
            <img src={previewUrl} alt={label} className="h-36 w-full object-cover" />
          </div>
        ) : (
          <div className="flex h-36 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-slate-400">
            <div className="text-center">
              <Image className="mx-auto mb-2" size={24} />
              <p className="text-xs font-semibold">Sin {mediaLabel}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
function LoginScreen({ onLogin, users, usersSource, usersError }) {
  const [mode, setMode] = useState('credentials');
  const [email, setEmail] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffEmployeeId, setStaffEmployeeId] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submitCredentials = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = await loginAdmin({ email, employeeId, password });
      onLogin(payload.user, password);
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  const submitStaffAccess = (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    loginStaff({ email: staffEmail, employeeId: staffEmployeeId, password: staffPassword })
      .then((payload) => onLogin(payload.user))
      .catch((err) => setError(err.message || 'No se pudo iniciar sesión.'))
      .finally(() => setLoading(false));
  };

  return (
    <div className="min-h-screen bg-[#f6f8f6] p-6">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-6xl grid-cols-1 gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Panel className="flex flex-col justify-between border-[#dfe8df] bg-white p-8 lg:p-10">
          <div>
            <div className="flex items-center gap-4">
              <img src={LOGO_URL} alt="Filo Constructora" className="h-10 w-auto object-contain" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#1F6B3F]">Filo Constructora</p>
                <p className="text-xs text-slate-500">Gestión de obra, accesos y asistencia</p>
              </div>
            </div>

            <div className="mt-10 max-w-xl">
              <Badge tone="green">Acceso al sistema</Badge>
              <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 lg:text-6xl">
                Una plataforma clara para administrar la obra.
              </h1>
              <p className="mt-4 max-w-lg text-sm leading-6 text-slate-500">
                Ingreso de administrador con correo, ID y contraseña. El QR queda para usuarios operativos y asistencia.
              </p>
            </div>
          </div>

          <div className="mt-10 rounded-[28px] border border-[#dfe8df] bg-[#fbfcfb] p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#1F6B3F]">Contenido del landing</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              El administrador puede cambiar fotos, textos, servicios y enlaces de videos desde el panel interno.
            </p>
          </div>
        </Panel>

        <Panel className="bg-white p-8 lg:p-10">
          <div className="flex gap-2 rounded-full bg-slate-100 p-1">
            <button
              onClick={() => {
                setError('');
                setMode('credentials');
              }}
              className={`w-full rounded-full px-4 py-3 text-xs font-bold uppercase tracking-widest ${mode === 'credentials' ? 'bg-[#1F6B3F] text-white' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Admin
            </button>
            <button
              onClick={() => {
                setError('');
                setMode('staff');
              }}
              className={`w-full rounded-full px-4 py-3 text-xs font-bold uppercase tracking-widest ${mode === 'staff' ? 'bg-[#1F6B3F] text-white' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Personal
            </button>
          </div>

          <div className="mt-8">
            <Badge tone="neutral">{usersSource === 'supabase' ? 'Supabase conectado' : 'Modo local'}</Badge>
            {usersError && <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">{usersError}</p>}
          </div>

          {mode === 'credentials' ? (
            <form onSubmit={submitCredentials} className="mt-8 space-y-4">
              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">
                  Correo corporativo
                </label>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                  <Mail size={16} className="text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="nombre@construtrack.com"
                    className="w-full bg-transparent text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">
                  ID de personal
                </label>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                  <BadgeCheck size={16} className="text-slate-400" />
                  <input
                    required
                    value={employeeId}
                    onChange={(event) => setEmployeeId(event.target.value)}
                    placeholder="ARQ-001"
                    className="w-full bg-transparent text-sm uppercase outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">
                  Contraseña admin
                </label>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                  <Lock size={16} className="text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Contraseña privada"
                    className="w-full bg-transparent text-sm outline-none"
                  />
                </div>
              </div>

              <button disabled={loading} type="submit" className="w-full rounded-full bg-[#1F6B3F] px-6 py-4 text-xs font-bold uppercase tracking-widest text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? 'Validando...' : 'Iniciar sesión'}
              </button>
            </form>
          ) : (
            <form onSubmit={submitStaffAccess} className="mt-8 space-y-4">
              <p className="text-sm text-slate-500">El personal entra a su panel con el correo y el ID que le creo el administrador.</p>
              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">Correo</label>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                  <Mail size={16} className="text-slate-400" />
                  <input
                    type="email"
                    required
                    value={staffEmail}
                    onChange={(event) => setStaffEmail(event.target.value)}
                    placeholder="persona@filo.com"
                    className="w-full bg-transparent text-sm outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">ID de personal</label>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                  <BadgeCheck size={16} className="text-slate-400" />
                  <input
                    required
                    value={staffEmployeeId}
                    onChange={(event) => setStaffEmployeeId(event.target.value)}
                    placeholder="TEC-002"
                    className="w-full bg-transparent text-sm uppercase outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">Clave de acceso</label>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                  <Lock size={16} className="text-slate-400" />
                  <input
                    type="password"
                    required
                    value={staffPassword}
                    onChange={(event) => setStaffPassword(event.target.value)}
                    placeholder="Clave creada por el admin"
                    className="w-full bg-transparent text-sm outline-none"
                  />
                </div>
              </div>
              <button type="submit" className="w-full rounded-full bg-[#1F6B3F] px-6 py-4 text-xs font-bold uppercase tracking-widest text-white transition hover:opacity-95">
                {loading ? 'Validando...' : 'Entrar al panel'}
              </button>
            </form>
          )}

          {error && <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">{error}</p>}

          <p className="mt-8 text-center text-[11px] leading-5 text-slate-400">
            Si necesitás recuperar el acceso, pedí al administrador del proyecto que actualice la variable privada de Vercel.
          </p>
        </Panel>
      </div>
    </div>
  );
}
export default function ConstructoraApp({ onExitToPublic, siteContent, onSiteContentChange, siteContentSource }) {
  const [users, setUsers] = useState(FALLBACK_USERS);
  const [usersSource, setUsersSource] = useState('local');
  const [usersError, setUsersError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [currentAdminPassword, setCurrentAdminPassword] = useState('');
  const [employeeForm, setEmployeeForm] = useState(EMPLOYEE_FORM_DEFAULTS);
  const [employeeFormMessage, setEmployeeFormMessage] = useState('');
  const [employeeFormError, setEmployeeFormError] = useState('');
  const [employeeFormLoading, setEmployeeFormLoading] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editEmployeeForm, setEditEmployeeForm] = useState(EMPLOYEE_FORM_DEFAULTS);
  const [editEmployeeLoading, setEditEmployeeLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState(PROJECTS[0]);
  const [activeTab, setActiveTab] = useState('inicio');
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceMessage, setAttendanceMessage] = useState('');
  const [attendanceError, setAttendanceError] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [contentSyncState, setContentSyncState] = useState('idle');
  const [contentSyncError, setContentSyncError] = useState('');
  const [imageUploadingKey, setImageUploadingKey] = useState('');
  const content = siteContent || defaultSiteContent;

  const updateContent = (updater) => {
    if (!onSiteContentChange) return;
    onSiteContentChange((prev) => updater(prev || defaultSiteContent));
  };

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      setContentSyncState('saving');
      try {
        await saveSiteContent(content, currentUser.id, currentAdminPassword);
        if (!cancelled) {
          setContentSyncState('saved');
          setContentSyncError('');
        }
      } catch (error) {
        if (!cancelled) {
          setContentSyncState('error');
          setContentSyncError(error.message || 'No se pudo sincronizar el contenido.');
        }
      }
    }, 700);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [content, currentUser?.id, currentUser?.role, currentAdminPassword]);

  async function loadUsers() {
    if (!hasSupabaseEnv || !supabase) {
      setUsers(FALLBACK_USERS);
      setUsersSource('local');
      setUsersError('Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. Se usa modo local.');
      return FALLBACK_USERS;
    }

    const { data, error } = await supabase
      .from('employees')
      .select('employee_id, full_name, role, shift, email, avatar_url, qr_code')
      .order('employee_id', { ascending: true });

    if (error) {
      setUsers(FALLBACK_USERS);
      setUsersSource('local');
      setUsersError(`Supabase no respondio: ${error.message}. Se usa modo local.`);
      return FALLBACK_USERS;
    }

    const mapped = (data || []).map(mapDbUser).filter((user) => user.id && user.email);
    if (mapped.length === 0) {
      setUsers(FALLBACK_USERS);
      setUsersSource('local');
      setUsersError('La tabla employees esta vacia. Se usa modo local.');
      return FALLBACK_USERS;
    }

    setUsers(mapped);
    setUsersSource('supabase');
    setUsersError('');
    return mapped;
  }

  useEffect(() => {
    let cancelled = false;

    loadUsers().then((result) => {
      if (cancelled || !result) return;
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw || currentUser) return;
    try {
      const parsed = JSON.parse(raw);
      const user = users.find((item) => item.id === parsed.userId);
      if (user && user.role !== 'admin') setCurrentUser(user);
    } catch {
      localStorage.removeItem(SESSION_KEY);
    }
  }, [users, currentUser]);

  useEffect(() => {
    let cancelled = false;

    async function loadAttendance() {
      if (!['asistencia', 'personal'].includes(activeTab) || !selectedProject) return;
      setAttendanceLoading(true);
      setAttendanceError('');

      if (!hasSupabaseEnv || !supabase) {
        if (!cancelled) {
          setAttendanceRecords([
            {
              id: 'demo-session',
              employeeId: currentUser?.id || 'DEMO',
              projectId: selectedProject.id,
              checkInAt: new Date().toISOString(),
              checkOutAt: null,
              status: 'in',
              qrPayload: projectQrValue(selectedProject),
            },
          ]);
          setAttendanceMessage('Modo local activo. Con Supabase se guardan entradas y salidas reales.');
          setAttendanceLoading(false);
        }
        return;
      }

      let query = supabase
        .from('attendance_sessions')
        .select('id, employee_id, project_id, check_in_at, check_out_at, status, qr_payload')
        .order('check_in_at', { ascending: false })
        .limit(activeTab === 'personal' ? 250 : 10);

      if (activeTab === 'asistencia') {
        query = query.eq('project_id', selectedProject.id);
      }

      const { data, error } = await query;

      if (cancelled) return;

      if (error) {
        setAttendanceError(error.message);
        setAttendanceRecords([]);
        setAttendanceMessage('');
        setAttendanceLoading(false);
        return;
      }

      setAttendanceRecords((data || []).map(mapAttendanceRow));
      setAttendanceMessage('');
      setAttendanceLoading(false);
    }

    loadAttendance();
    return () => {
      cancelled = true;
    };
  }, [activeTab, selectedProject, currentUser?.id]);

  const handleLogin = (user, adminPassword = '') => {
    setCurrentUser(user);
    setCurrentAdminPassword(adminPassword);
    localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.id, loggedAt: new Date().toISOString() }));
  };

  const handleCreateEmployee = async (event) => {
    event.preventDefault();
    setEmployeeFormMessage('');
    setEmployeeFormError('');

    if (!currentUser || currentUser.role !== 'admin') {
      setEmployeeFormError('Solo un administrador puede crear usuarios.');
      return;
    }

    if (!hasSupabaseEnv) {
      setEmployeeFormError('Falta configurar Supabase en Vercel.');
      return;
    }

    setEmployeeFormLoading(true);
    try {
      const cleanedAvatarUrl = normalizeOptionalMediaUrl(employeeForm.avatar_url);
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...employeeForm,
          avatar_url: cleanedAvatarUrl,
          admin_code: currentAdminPassword || employeeForm.admin_code,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'No se pudo crear el usuario.');
      }

      await loadUsers();
      setEmployeeForm(EMPLOYEE_FORM_DEFAULTS);
      setEmployeeFormMessage(`Usuario ${payload.employee?.employee_id || 'creado'} registrado correctamente.`);
    } catch (error) {
      setEmployeeFormError(error.message || 'No se pudo crear el usuario.');
    } finally {
      setEmployeeFormLoading(false);
    }
  };

  const handleUploadMedia = async (fieldKey, applyUpdate, file, { setGlobalError = true } = {}) => {
    if (!currentUser || currentUser.role !== 'admin') {
      if (setGlobalError) setContentSyncError('Solo un administrador puede subir archivos.');
      else setEmployeeFormError('Solo un administrador puede subir archivos.');
      return;
    }

    setImageUploadingKey(fieldKey);
    if (setGlobalError) setContentSyncError('');
    else setEmployeeFormError('');
    try {
      const url = await uploadSiteImage(file, currentUser.id, currentAdminPassword);
      updateContent((prev) => applyUpdate(prev, url));
      if (setGlobalError) setContentSyncState('saved');
    } catch (error) {
      if (setGlobalError) {
        setContentSyncState('error');
        setContentSyncError(error.message || 'No se pudo subir el archivo.');
      } else {
        setEmployeeFormError(error.message || 'No se pudo subir el archivo.');
      }
    } finally {
      setImageUploadingKey('');
    }
  };

  const startEditingEmployee = (user) => {
    if (currentUser.role !== 'admin' || user.role === 'admin') return;
    setEmployeeFormMessage('');
    setEmployeeFormError('');
    setEditingEmployee(user);
    setEditEmployeeForm({
      employee_id: user.id,
      full_name: user.name,
      role: user.role,
      shift: user.shift,
      email: user.email,
      avatar_url: user.avatar?.includes('dicebear.com') ? '' : user.avatar,
      password: '',
      admin_code: '',
    });
  };

  const handleUpdateEmployee = async (event) => {
    event.preventDefault();
    if (!editingEmployee) return;

    setEmployeeFormMessage('');
    setEmployeeFormError('');
    setEditEmployeeLoading(true);
    try {
      const cleanedAvatarUrl = normalizeOptionalMediaUrl(editEmployeeForm.avatar_url);
      const response = await fetch('/api/employees', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editEmployeeForm,
          avatar_url: cleanedAvatarUrl,
          admin_code: currentAdminPassword || editEmployeeForm.admin_code,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'No se pudo actualizar el usuario.');
      }

      await loadUsers();
      setEditingEmployee(null);
      setEditEmployeeForm(EMPLOYEE_FORM_DEFAULTS);
      setEmployeeFormMessage(`Usuario ${payload.employee?.employee_id || editingEmployee.id} actualizado correctamente.`);
    } catch (error) {
      setEmployeeFormError(error.message || 'No se pudo actualizar el usuario.');
    } finally {
      setEditEmployeeLoading(false);
    }
  };

  const refreshAttendance = async () => {
    if (activeTab !== 'asistencia' || !selectedProject || !hasSupabaseEnv || !supabase) return;
    const { data } = await supabase
      .from('attendance_sessions')
      .select('id, employee_id, project_id, check_in_at, check_out_at, status, qr_payload')
      .eq('project_id', selectedProject.id)
      .order('check_in_at', { ascending: false })
      .limit(10);
    setAttendanceRecords((data || []).map(mapAttendanceRow));
  };

  const handleAttendanceScan = async (decodedText) => {
    if (currentUser.role === 'admin') {
      throw new Error('El administrador no registra asistencia propia. Ingresá como personal para marcar entrada o salida.');
    }

    if (!isNowInsideShift(currentUser.shift)) {
      throw new Error(`Tu turno habilitado es ${currentUser.shift}. No se puede registrar asistencia fuera de horario.`);
    }

    const parsed = parseProjectQr(decodedText);
    if (!parsed) throw new Error('El QR no corresponde a una obra valida.');
    if (parsed.projectId !== selectedProject.id || parsed.accessCode !== selectedProject.accessCode) {
      throw new Error('El QR no coincide con esta obra.');
    }

    if (!hasSupabaseEnv || !supabase) {
      setAttendanceMessage('QR validado en modo local. Configura Supabase para guardar entradas y salidas reales.');
      setScannerOpen(false);
      return;
    }

    setAttendanceLoading(true);
    setAttendanceError('');

    try {
      const now = new Date().toISOString();
      const { data: openSessions, error: openError } = await supabase
        .from('attendance_sessions')
        .select('id')
        .eq('employee_id', currentUser.id)
        .eq('project_id', selectedProject.id)
        .is('check_out_at', null)
        .order('check_in_at', { ascending: false })
        .limit(1);

      if (openError) throw new Error(openError.message);

      const activeSession = openSessions?.[0];
      if (activeSession) {
        const { error: checkoutError } = await supabase
          .from('attendance_sessions')
          .update({ check_out_at: now, status: 'out', qr_payload: decodedText })
          .eq('id', activeSession.id);
        if (checkoutError) throw new Error(checkoutError.message);
        setAttendanceMessage('Salida registrada correctamente.');
      } else {
        const { error: checkinError } = await supabase.from('attendance_sessions').insert({
          employee_id: currentUser.id,
          project_id: selectedProject.id,
          check_in_at: now,
          check_out_at: null,
          status: 'in',
          qr_payload: decodedText,
        });
        if (checkinError) throw new Error(checkinError.message);
        setAttendanceMessage('Entrada registrada correctamente.');
      }

      setScannerOpen(false);
      await refreshAttendance();
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    setCurrentUser(null);
    setCurrentAdminPassword('');
    setSelectedProject(PROJECTS[0]);
    setActiveTab('inicio');
    setScannerOpen(false);
    setAttendanceRecords([]);
    setAttendanceMessage('');
    setAttendanceError('');
  };

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} users={users} usersSource={usersSource} usersError={usersError} />;
  }

  const menuItems = [
    { id: 'inicio', icon: LayoutDashboard, label: 'Inicio' },
    { id: 'obras', icon: Construction, label: 'Obras' },
    { id: 'asistencia', icon: QrCode, label: 'Asistencia' },
    { id: 'personal', icon: User, label: 'Personal', roles: ['supervisor', 'administrativo'] },
    { id: 'finanzas', icon: DollarSign, label: 'Costos', roles: ['supervisor', 'administrativo'] },
    { id: 'insumos', icon: PackageCheck, label: 'Insumos', roles: ['supervisor', 'tecnico_vertical', 'administrativo'] },
    { id: 'contenido', icon: Layers, label: 'Contenido', roles: ['supervisor', 'administrativo'] },
  ].filter(
    (item) =>
      currentUser.role === 'admin' ||
      !item.roles ||
      item.roles.includes(currentUser.role)
  );

  const rolesSummary = users.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {});
  const roleDashboard = ROLE_DASHBOARDS[currentUser.role] || ROLE_DASHBOARDS.operario;
  const roleTasks = TASKS.filter((task) => roleDashboard.tasks.includes(task.id));
  const roleSupplies = currentUser.role === 'operario' ? SUPPLIES.slice(0, 4) : SUPPLIES;
  const canRegisterAttendance = currentUser.role !== 'admin';
  const userNameById = users.reduce((acc, user) => {
    acc[user.id] = user.name;
    return acc;
  }, {});
  const projectNameById = PROJECTS.reduce((acc, project) => {
    acc[project.id] = project.name;
    return acc;
  }, {});
  const attendanceNow = new Date();
  const attendanceTotals = attendanceRecords.reduce(
    (acc, record) => {
      const hours = calculateWorkedHours(record, attendanceNow);
      const isOpen = !record.checkOutAt;
      const isStale = isStaleOpenSession(record, attendanceNow);
      acc.totalHours += isOpen ? 0 : hours;
      acc.openHours += isOpen || isStale ? (isStale ? 0 : hours) : 0;
      acc.openSessions += isOpen && !isStale ? 1 : 0;
      acc.staleSessions += isStale ? 1 : 0;
      acc.byEmployee[record.employeeId] = acc.byEmployee[record.employeeId] || {
        employeeId: record.employeeId,
        name: userNameById[record.employeeId] || record.employeeId,
        totalHours: 0,
        openHours: 0,
        openSessions: 0,
        staleSessions: 0,
        sessions: 0,
      };
      acc.byEmployee[record.employeeId].sessions += 1;
      acc.byEmployee[record.employeeId].totalHours += isOpen ? 0 : hours;
      acc.byEmployee[record.employeeId].openHours += isOpen && !isStale ? hours : 0;
      acc.byEmployee[record.employeeId].openSessions += isOpen && !isStale ? 1 : 0;
      acc.byEmployee[record.employeeId].staleSessions += isStale ? 1 : 0;
      acc.byProject[record.projectId] = acc.byProject[record.projectId] || {
        projectId: record.projectId,
        name: projectNameById[record.projectId] || record.projectId,
        totalHours: 0,
        openHours: 0,
        staleSessions: 0,
        sessions: 0,
      };
      acc.byProject[record.projectId].sessions += 1;
      acc.byProject[record.projectId].totalHours += isOpen ? 0 : hours;
      acc.byProject[record.projectId].openHours += isOpen && !isStale ? hours : 0;
      acc.byProject[record.projectId].staleSessions += isStale ? 1 : 0;
      return acc;
    },
    { totalHours: 0, openHours: 0, openSessions: 0, staleSessions: 0, byEmployee: {}, byProject: {} }
  );
  const employeeWorkSummary = Object.values(attendanceTotals.byEmployee).sort((a, b) => b.totalHours + b.openHours - (a.totalHours + a.openHours));
  const projectWorkSummary = Object.values(attendanceTotals.byProject).sort((a, b) => b.totalHours + b.openHours - (a.totalHours + a.openHours));
  return (
    <div className="min-h-screen bg-[#f6f8f6] text-slate-900">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <img src={LOGO_URL} alt="Filo Constructora" className="h-10 w-auto object-contain" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#1F6B3F]">Filo Constructora</p>
              <p className="text-xs text-slate-500">Gestión de trabajos verticales, insumos y equipo</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-500 transition hover:border-slate-900 hover:text-slate-900"
          >
            <LogOut size={14} /> Salir
          </button>
          {onExitToPublic && (
            <button
              onClick={onExitToPublic}
              className="rounded-full border border-[#1F6B3F] px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#1F6B3F] transition hover:bg-[#1F6B3F] hover:text-white"
            >
              Sitio público
            </button>
          )}
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[280px_1fr] lg:px-8">
        <aside className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-5">
            <div className="h-12 w-12 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-0.5">
              <img src={currentUser.avatar} alt={currentUser.name} className="h-full w-full object-cover" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{currentUser.name}</p>
              <p className="text-[10px] uppercase tracking-widest text-slate-400">{ROLE_LABELS[currentUser.role] || currentUser.role}</p>
            </div>
          </div>

          <nav className="mt-5 space-y-2">
            {menuItems.map((item) => (
              <MenuButton key={item.id} active={activeTab === item.id} icon={item.icon} label={item.label} onClick={() => setActiveTab(item.id)} />
            ))}
          </nav>

          <div className="mt-6 rounded-2xl bg-[#f7fbf7] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Turno</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{currentUser.shift}</p>
            <p className="mt-3 text-[11px] text-slate-500">{currentUser.email}</p>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Resumen equipo</p>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              <p>Supervisores: {rolesSummary.supervisor || 0}</p>
              <p>Técnicos verticales: {rolesSummary.tecnico_vertical || 0}</p>
              <p>Operarios: {rolesSummary.operario || 0}</p>
            </div>
          </div>
        </aside>

        <main className="space-y-6">
          {activeTab === 'inicio' && (
            <section className="grid gap-6 lg:grid-cols-12">
              <Panel className="lg:col-span-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Badge tone="green">{roleDashboard.badge}</Badge>
                    <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{roleDashboard.title}</h2>
                    <p className="mt-2 text-sm text-slate-500">{roleDashboard.detail}</p>
                  </div>
                  <ArrowRight className="text-slate-300" />
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard label="Obra asignada" value={selectedProject.id} detail={selectedProject.status} />
                  <StatCard label="Turno" value={currentUser.shift.split('-')[0] || currentUser.shift} detail={currentUser.shift} />
                  <StatCard label="Tareas" value={roleTasks.length} detail="Asignadas" />
                  <StatCard label="Asistencia" value={attendanceRecords.length} detail="Registros" />
                </div>
              </Panel>

              <Panel className="lg:col-span-4 bg-[#fbfcfb]">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Foco del rol</p>
                <div className="mt-4 space-y-3">
                  {roleDashboard.focus.map((item) => (
                    <div key={item} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                      <CheckSquare className="mt-0.5 text-[#1F6B3F]" size={18} />
                      <p className="text-sm font-semibold text-slate-700">{item}</p>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel className="lg:col-span-5 bg-[#fbfcfb]">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Acceso del trabajo</p>
                <div className="mt-4 rounded-[28px] border border-slate-200 bg-white p-4 text-center">
                  <QRCodeSVG value={projectQrValue(selectedProject)} size={180} level="M" className="mx-auto" />
                  <p className="mt-4 text-sm font-semibold text-slate-900">{selectedProject.accessCode}</p>
                  <p className="mt-2 text-xs text-slate-500">QR exclusivo para registrar entrada y salida del equipo.</p>
                </div>
              </Panel>

              <Panel className="lg:col-span-7">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Tareas visibles</p>
                    <h3 className="text-2xl font-bold tracking-tight text-slate-900">Lo que te compete</h3>
                  </div>
                  <Badge tone="neutral">{roleTasks.length} tareas</Badge>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {roleTasks.map((task) => (
                    <div key={task.id} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <Badge tone={task.status === 'terminada' ? 'green' : task.status === 'en proceso' ? 'amber' : 'neutral'}>{task.status}</Badge>
                        {task.status === 'en proceso' && <Clock size={16} className="text-amber-600" />}
                      </div>
                      <p className="mt-3 text-lg font-semibold text-slate-900">{task.title}</p>
                      <p className="mt-2 text-xs uppercase tracking-widest text-slate-400">Asignado: {task.assignedTo}</p>
                    </div>
                  ))}
                </div>
              </Panel>
            </section>
          )}

          {activeTab === 'obras' && (
            <section className="space-y-6">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Trabajos activos</p>
                  <h2 className="text-3xl font-bold tracking-tight text-slate-900">Seleccionar servicio en curso</h2>
                </div>
                <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-400">
                  <Search size={16} />
                  <span>Buscar trabajo...</span>
                  <Filter size={16} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {PROJECTS.map((project) => (
                  <Panel key={project.id} onClick={() => setSelectedProject(project)} className={project.id === selectedProject.id ? 'border-[#1F6B3F] ring-1 ring-[#1F6B3F]' : ''}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <Badge tone={project.id === selectedProject.id ? 'green' : 'neutral'}>{project.id}</Badge>
                        <h3 className="mt-4 text-2xl font-bold text-slate-900">{project.name}</h3>
                        <p className="mt-1 text-sm text-slate-500">{project.location}</p>
                      </div>
                      <div className="rounded-full bg-[#eaf5ee] p-3 text-[#1F6B3F]">
                        <ArrowRight size={18} />
                      </div>
                    </div>

                    <div className="mt-6 space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Avance</span>
                        <span className="font-semibold text-slate-900">{project.progress}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-[#1F6B3F]" style={{ width: `${project.progress}%` }} />
                      </div>
                    </div>
                  </Panel>
                ))}
              </div>
            </section>
          )}
          {activeTab === 'asistencia' && (
            <section className="grid gap-6 xl:grid-cols-12">
              <Panel className="xl:col-span-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Control de acceso</p>
                    <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">QR exclusivo de obra</h2>
                    <p className="mt-2 text-sm text-slate-500">Escanealo desde el celular para registrar entrada o salida.</p>
                  </div>
                  <Badge tone="green">Activo</Badge>
                </div>

                <div className="mt-6 rounded-[28px] border border-slate-200 bg-[#fbfcfb] p-5 text-center">
                  <QRCodeSVG value={projectQrValue(selectedProject)} size={200} level="M" className="mx-auto" />
                  <p className="mt-4 text-sm font-semibold text-slate-900">{selectedProject.accessCode}</p>
                  <p className="mt-2 text-xs text-slate-500">Este QR se deja en la obra para que el personal registre asistencia.</p>
                </div>

                {canRegisterAttendance ? (
                  <button
                    onClick={() => setScannerOpen((value) => !value)}
                    className="mt-5 w-full rounded-full bg-[#1F6B3F] px-6 py-4 text-xs font-bold uppercase tracking-widest text-white transition hover:opacity-95"
                  >
                    {scannerOpen ? 'Cerrar camara' : 'Abrir camara y escanear'}
                  </button>
                ) : (
                  <p className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-700">
                    El admin solo consulta registros. Para marcar asistencia, ingresá con una cuenta de personal.
                  </p>
                )}
              </Panel>

              <Panel className="xl:col-span-7">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Registros</p>
                    <h3 className="text-2xl font-bold tracking-tight text-slate-900">Entrada y salida</h3>
                  </div>
                  <Badge tone={usersSource === 'supabase' ? 'green' : 'neutral'}>{usersSource === 'supabase' ? 'Supabase' : 'Local'}</Badge>
                </div>

                <div className="mt-5">
                  {scannerOpen && canRegisterAttendance ? (
                    <ProjectQrScanner onScan={handleAttendanceScan} onClose={() => setScannerOpen(false)} />
                  ) : (
                    <div className="rounded-[28px] border border-dashed border-slate-200 bg-[#fbfcfb] p-8 text-sm text-slate-500">
                      {canRegisterAttendance ? 'Abrí la cámara para escanear el QR de obra desde el celular.' : 'Ingresá como personal para usar el scanner de asistencia.'}
                    </div>
                  )}
                </div>

                {attendanceMessage && <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{attendanceMessage}</p>}
                {attendanceError && <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{attendanceError}</p>}
                {attendanceLoading && <p className="mt-4 text-xs uppercase tracking-widest text-slate-400">Procesando asistencia...</p>}

                <div className="mt-5 space-y-3">
                  {attendanceRecords.map((record) => (
                    <div key={record.id} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{record.employeeId}</p>
                        <p className="text-[10px] uppercase tracking-widest text-slate-400">{record.status === 'in' ? 'Entrada' : 'Salida'}</p>
                      </div>
                      <p className="text-[10px] uppercase tracking-widest text-slate-500">{new Date(record.checkInAt).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </Panel>
            </section>
          )}

          {activeTab === 'personal' && (
            <section className="space-y-6">
              <Panel>
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Horas del equipo</p>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Control de trabajo real</h2>
                    <p className="mt-2 text-sm text-slate-500">Resumen calculado desde las entradas y salidas registradas con QR.</p>
                  </div>
                  <Badge tone={attendanceTotals.staleSessions ? 'red' : attendanceTotals.openSessions ? 'amber' : 'green'}>
                    {attendanceTotals.staleSessions ? `${attendanceTotals.staleSessions} sin salida` : attendanceTotals.openSessions ? `${attendanceTotals.openSessions} en obra` : 'Sin turnos abiertos'}
                  </Badge>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <StatCard label="Horas cerradas" value={formatWorkedHours(attendanceTotals.totalHours)} detail="Con entrada y salida" />
                  <StatCard label="Horas en curso" value={formatWorkedHours(attendanceTotals.openHours)} detail="Turnos abiertos" />
                  <StatCard label="Sin salida" value={attendanceTotals.staleSessions} detail="Revisar fichadas" />
                </div>

                {attendanceTotals.staleSessions > 0 && (
                  <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
                    Hay fichadas abiertas de más de 16 horas. No se cuentan como horas en curso para no inflar el total; revisá la salida del personal en Asistencia.
                  </p>
                )}

                <div className="mt-6 grid gap-6 xl:grid-cols-2">
                  <div className="rounded-[24px] border border-slate-200 bg-[#fbfcfb] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Por empleado</p>
                    <div className="mt-4 space-y-3">
                      {employeeWorkSummary.length ? (
                        employeeWorkSummary.map((item) => (
                          <div key={item.employeeId} className="rounded-2xl border border-slate-200 bg-white p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="font-semibold text-slate-900">{item.name}</p>
                                <p className="mt-1 text-[10px] uppercase tracking-widest text-slate-400">{item.employeeId} · {item.sessions} registros</p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-slate-900">{formatWorkedHours(item.totalHours)}</p>
                                {item.openSessions > 0 && <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-amber-600">En curso {formatWorkedHours(item.openHours)}</p>}
                                {item.staleSessions > 0 && <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-red-600">{item.staleSessions} sin salida</p>}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">Todavía no hay fichadas cargadas.</p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-slate-200 bg-[#fbfcfb] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Por obra</p>
                    <div className="mt-4 space-y-3">
                      {projectWorkSummary.length ? (
                        projectWorkSummary.map((item) => (
                          <div key={item.projectId} className="rounded-2xl border border-slate-200 bg-white p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="font-semibold text-slate-900">{item.name}</p>
                                <p className="mt-1 text-[10px] uppercase tracking-widest text-slate-400">{item.projectId} · {item.sessions} registros</p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-slate-900">{formatWorkedHours(item.totalHours)}</p>
                                {item.openHours > 0 && <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-amber-600">En curso {formatWorkedHours(item.openHours)}</p>}
                                {item.staleSessions > 0 && <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-red-600">{item.staleSessions} sin salida</p>}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">Todavía no hay fichadas por obra.</p>
                      )}
                    </div>
                  </div>
                </div>
              </Panel>

              <Panel>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Personal</p>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Equipo de obra</h2>
                  </div>
                  <Badge tone="neutral">{users.length} usuarios</Badge>
                </div>

                {currentUser.role === 'admin' && (
                  <div className="mt-6 rounded-[28px] border border-[#dfe8df] bg-[#f7fbf7] p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#1F6B3F]">Alta de personal</p>
                        <h3 className="mt-1 text-xl font-bold text-slate-900">Crear acceso para el equipo</h3>
                        <p className="mt-2 text-sm text-slate-500">Solo el administrador puede dar de alta supervisores, técnicos verticales, operarios y administrativos.</p>
                      </div>
                      <Badge tone="green">Admin</Badge>
                    </div>

                    <form onSubmit={handleCreateEmployee} className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      <div>
                        <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">ID de personal</label>
                        <input
                          required
                          value={employeeForm.employee_id}
                          onChange={(event) => setEmployeeForm((prev) => ({ ...prev, employee_id: event.target.value }))}
                          placeholder="CAP-200"
                          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1F6B3F]"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">Nombre completo</label>
                        <input
                          required
                          value={employeeForm.full_name}
                          onChange={(event) => setEmployeeForm((prev) => ({ ...prev, full_name: event.target.value }))}
                          placeholder="Nombre Apellido"
                          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1F6B3F]"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">Correo</label>
                        <input
                          type="email"
                          required
                          value={employeeForm.email}
                          onChange={(event) => setEmployeeForm((prev) => ({ ...prev, email: event.target.value }))}
                          placeholder="persona@filo.com"
                          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1F6B3F]"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">Rol</label>
                        <select
                          value={employeeForm.role}
                          onChange={(event) => setEmployeeForm((prev) => ({ ...prev, role: event.target.value }))}
                          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1F6B3F]"
                        >
                          {EMPLOYEE_ROLES.map((role) => (
                            <option key={role.value} value={role.value}>
                              {role.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">Turno</label>
                        <input
                          required
                          value={employeeForm.shift}
                          onChange={(event) => setEmployeeForm((prev) => ({ ...prev, shift: event.target.value }))}
                          placeholder="07:00-15:00"
                          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1F6B3F]"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">Clave de acceso</label>
                        <input
                          required
                          type="password"
                          minLength={4}
                          value={employeeForm.password}
                          onChange={(event) => setEmployeeForm((prev) => ({ ...prev, password: event.target.value }))}
                          placeholder="Clave inicial del empleado"
                          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1F6B3F]"
                        />
                      </div>

                      <div className="xl:col-span-2">
                        <ImageFieldEditor
                          label="Foto / avatar del usuario"
                          value={employeeForm.avatar_url}
                          onChange={(event) => setEmployeeForm((prev) => ({ ...prev, avatar_url: event.target.value }))}
                          uploading={imageUploadingKey === 'employee-avatar'}
                          helpText="Subí una foto desde el celular del admin o pegá una URL."
                          optional
                          onUpload={(file) =>
                            handleUploadMedia(
                              'employee-avatar',
                              (prev, url) => {
                                setEmployeeForm((current) => ({ ...current, avatar_url: url }));
                                return prev;
                              },
                              file,
                              { setGlobalError: false }
                            )
                          }
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">Codigo admin</label>
                        <input
                          type="password"
                          value={employeeForm.admin_code}
                          onChange={(event) => setEmployeeForm((prev) => ({ ...prev, admin_code: event.target.value }))}
                          placeholder="Usa la clave de tu sesión"
                          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1F6B3F]"
                        />
                      </div>

                      <div className="md:col-span-2 xl:col-span-3">
                        <button
                          type="submit"
                          disabled={employeeFormLoading}
                          className="w-full rounded-full bg-[#1F6B3F] px-6 py-4 text-xs font-bold uppercase tracking-widest text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {employeeFormLoading ? 'Creando usuario...' : 'Crear acceso de equipo'}
                        </button>
                      </div>
                    </form>

                    {employeeFormMessage && <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{employeeFormMessage}</p>}
                    {employeeFormError && <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{employeeFormError}</p>}

                    {editingEmployee && (
                      <form onSubmit={handleUpdateEmployee} className="mt-5 rounded-[24px] border border-slate-200 bg-white p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#1F6B3F]">Editar personal</p>
                            <h3 className="mt-1 text-xl font-bold text-slate-900">{editingEmployee.name}</h3>
                          </div>
                          <button
                            type="button"
                            onClick={() => setEditingEmployee(null)}
                            className="rounded-full border border-slate-200 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500"
                          >
                            Cerrar
                          </button>
                        </div>

                        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                          <div>
                            <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">ID de personal</label>
                            <input disabled value={editEmployeeForm.employee_id} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500" />
                          </div>
                          <div>
                            <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">Nombre completo</label>
                            <input required value={editEmployeeForm.full_name} onChange={(event) => setEditEmployeeForm((prev) => ({ ...prev, full_name: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1F6B3F]" />
                          </div>
                          <div>
                            <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">Correo</label>
                            <input type="email" required value={editEmployeeForm.email} onChange={(event) => setEditEmployeeForm((prev) => ({ ...prev, email: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1F6B3F]" />
                          </div>
                          <div>
                            <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">Rol</label>
                            <select value={editEmployeeForm.role} onChange={(event) => setEditEmployeeForm((prev) => ({ ...prev, role: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1F6B3F]">
                              {EMPLOYEE_ROLES.map((role) => (
                                <option key={role.value} value={role.value}>{role.label}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">Turno</label>
                            <input required value={editEmployeeForm.shift} onChange={(event) => setEditEmployeeForm((prev) => ({ ...prev, shift: event.target.value }))} placeholder="07:00-15:00" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1F6B3F]" />
                          </div>
                          <div>
                            <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">Nueva clave</label>
                            <input type="password" minLength={4} value={editEmployeeForm.password} onChange={(event) => setEditEmployeeForm((prev) => ({ ...prev, password: event.target.value }))} placeholder="Opcional" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1F6B3F]" />
                          </div>
                        </div>

                        <button disabled={editEmployeeLoading} type="submit" className="mt-5 w-full rounded-full bg-[#1F6B3F] px-6 py-4 text-xs font-bold uppercase tracking-widest text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60">
                          {editEmployeeLoading ? 'Guardando...' : 'Guardar cambios'}
                        </button>
                      </form>
                    )}
                  </div>
                )}

                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {users.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => startEditingEmployee(user)}
                      className={`rounded-2xl border border-slate-200 p-4 text-left ${currentUser.role === 'admin' && user.role !== 'admin' ? 'transition hover:border-[#1F6B3F] hover:shadow-md' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-0.5">
                          <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{user.name}</p>
                          <p className="text-[10px] uppercase tracking-widest text-slate-400">{ROLE_LABELS[user.role] || user.role}</p>
                        </div>
                      </div>
                      <p className="mt-4 text-xs text-slate-500">{user.email}</p>
                      <p className="mt-1 text-xs text-slate-500">Turno {user.shift}</p>
                      {currentUser.role === 'admin' && user.role !== 'admin' && (
                        <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-[#1F6B3F]">Tocar para editar</p>
                      )}
                    </button>
                  ))}
                </div>
              </Panel>
            </section>
          )}

          {activeTab === 'finanzas' && (
            <section className="grid gap-6 lg:grid-cols-12">
              <Panel className="lg:col-span-8">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Costos</p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Costeo de {selectedProject.name}</h2>
                <div className="mt-6 flex items-end gap-3">
                  <p className="text-5xl font-bold tracking-tight text-slate-900">{selectedProject.budget}</p>
                  <Badge tone="green">+4%</Badge>
                </div>
                <p className="mt-4 max-w-xl text-sm text-slate-500">Seguimiento simple para insumos, mano de obra, seguridad y traslados en trabajos verticales.</p>
              </Panel>

              <Panel className="lg:col-span-4 bg-[#fbfcfb]">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Distribución</p>
                <div className="mt-4 space-y-4">
                  {['Insumos', 'Mano de obra', 'Seguridad', 'Traslados'].map((item, index) => (
                    <div key={item}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">{item}</span>
                        <span className="font-semibold text-slate-900">{45 - index * 10}%</span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-[#1F6B3F]" style={{ width: `${45 - index * 10}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            </section>
          )}

          {activeTab === 'insumos' && (
            <section className="space-y-6">
              <Panel>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Insumos operativos</p>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Lo que el admin tiene que tener a mano</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                      Control rápido de seguridad, materiales y herramientas para pintura vertical, limpieza de vidrios, impermeabilización y cartelería.
                    </p>
                  </div>
                  <Badge tone="green">{roleSupplies.length} items</Badge>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {roleSupplies.map((item) => (
                    <div key={item.name} className="rounded-2xl border border-slate-200 bg-[#fbfcfb] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="rounded-full bg-white p-2 text-[#1F6B3F] shadow-sm">
                          <PackageCheck size={18} />
                        </div>
                        <Badge tone={item.status === 'OK' ? 'green' : item.status === 'Comprar' ? 'red' : 'amber'}>{item.status}</Badge>
                      </div>
                      <p className="mt-4 text-lg font-semibold text-slate-900">{item.name}</p>
                      <p className="mt-2 text-sm text-slate-500">
                        Stock: <span className="font-semibold text-slate-900">{item.stock}</span> {item.unit}
                      </p>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel className="bg-[#fbfcfb]">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Checklist antes de salir</p>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {['EPP completo y revisado', 'Fotos de avance asignadas', 'Material cargado por servicio'].map((item) => (
                    <div key={item} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                      <CheckSquare className="text-[#1F6B3F]" size={18} />
                      <p className="text-sm font-semibold text-slate-700">{item}</p>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel className="lg:col-span-12 bg-[#fbfcfb]">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Checklist del turno</p>
                    <h3 className="text-2xl font-bold tracking-tight text-slate-900">Antes de operar</h3>
                  </div>
                  <Badge tone="green">{ROLE_LABELS[currentUser.role] || currentUser.role}</Badge>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {roleDashboard.checklist.map((item) => (
                    <div key={item} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                      <CheckSquare className="text-[#1F6B3F]" size={18} />
                      <p className="text-sm font-semibold text-slate-700">{item}</p>
                    </div>
                  ))}
                </div>
              </Panel>
            </section>
          )}

          {activeTab === 'contenido' && (
            <section className="space-y-6">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Panel tipo Shopify</p>
                  <h2 className="text-3xl font-bold tracking-tight text-slate-900">Contenido del sitio público</h2>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Badge tone={siteContentSource === 'supabase' ? 'green' : 'amber'}>
                    {siteContentSource === 'supabase' ? 'Supabase' : 'Local'}
                  </Badge>
                  <Badge tone={contentSyncState === 'error' ? 'red' : contentSyncState === 'saving' ? 'amber' : 'green'}>
                    {contentSyncState === 'saving' ? 'Guardando' : contentSyncState === 'error' ? 'Error de sync' : 'En vivo'}
                  </Badge>
                </div>
              </div>
              {contentSyncError && <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{contentSyncError}</p>}

              <div className="grid gap-6 xl:grid-cols-12">
                <Panel className="xl:col-span-5 space-y-5">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Marca</p>
                    <ImageFieldEditor
                      label="Logo"
                      value={content.logoUrl}
                      onChange={(event) => updateContent((prev) => ({ ...prev, logoUrl: event.target.value }))}
                      uploading={imageUploadingKey === 'logoUrl'}
                      helpText="Ideal para el logo principal del sitio."
                      onUpload={(file) => handleUploadMedia('logoUrl', (prev, url) => ({ ...prev, logoUrl: url }), file)}
                    />
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">Hero título</label>
                      <input
                        value={content.hero.title}
                        onChange={(event) => updateContent((prev) => ({ ...prev, hero: { ...prev.hero, title: event.target.value } }))}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1F6B3F]"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">Hero acento</label>
                      <input
                        value={content.hero.accent}
                        onChange={(event) => updateContent((prev) => ({ ...prev, hero: { ...prev.hero, accent: event.target.value } }))}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1F6B3F]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">Hero subtítulo</label>
                    <textarea
                      rows="4"
                      value={content.hero.subtitle}
                      onChange={(event) => updateContent((prev) => ({ ...prev, hero: { ...prev.hero, subtitle: event.target.value } }))}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1F6B3F]"
                    />
                  </div>

                  <div>
                    <ImageFieldEditor
                      label="Imagen o video principal"
                      value={content.hero.image}
                      onChange={(event) => updateContent((prev) => ({ ...prev, hero: { ...prev.hero, image: event.target.value } }))}
                      uploading={imageUploadingKey === 'hero.image'}
                      helpText="Subí una foto o video para el fondo del banner."
                      accept="image/*,video/*"
                      mediaType={isPlayableVideoUrl(content.hero.image) ? 'video' : 'image'}
                      uploadLabel="Subir imagen/video"
                      onUpload={(file) => handleUploadMedia('hero.image', (prev, url) => ({ ...prev, hero: { ...prev.hero, image: url } }), file)}
                    />
                  </div>

                  <div className="rounded-[24px] border border-dashed border-slate-200 bg-[#fbfcfb] p-4 space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Contacto</p>
                    <input
                      value={content.contact.phone}
                      onChange={(event) => updateContent((prev) => ({ ...prev, contact: { ...prev.contact, phone: event.target.value } }))}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1F6B3F]"
                      placeholder="Teléfono"
                    />
                    <input
                      value={content.contact.location}
                      onChange={(event) => updateContent((prev) => ({ ...prev, contact: { ...prev.contact, location: event.target.value } }))}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1F6B3F]"
                      placeholder="Ubicación"
                    />
                    <input
                      value={content.contact.hours}
                      onChange={(event) => updateContent((prev) => ({ ...prev, contact: { ...prev.contact, hours: event.target.value } }))}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1F6B3F]"
                      placeholder="Horario"
                    />
                  </div>
                </Panel>

                <Panel className="xl:col-span-7 space-y-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Tarjetas de servicios</p>
                      <h3 className="text-2xl font-bold tracking-tight text-slate-900">Editar contenido visual</h3>
                    </div>
                    <Badge tone="neutral">{content.highlights.length} bloques</Badge>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    {content.highlights.map((item, index) => (
                      <div key={item.title} className="rounded-[24px] border border-slate-200 p-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Bloque {index + 1}</p>
                        <div className="mt-3 space-y-3">
                          <input
                            value={item.title}
                            onChange={(event) =>
                              updateContent((prev) => ({
                                ...prev,
                                highlights: prev.highlights.map((entry, i) => (i === index ? { ...entry, title: event.target.value } : entry)),
                              }))
                            }
                            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1F6B3F]"
                          />
                          <textarea
                            rows="3"
                            value={item.desc}
                            onChange={(event) =>
                              updateContent((prev) => ({
                                ...prev,
                                highlights: prev.highlights.map((entry, i) => (i === index ? { ...entry, desc: event.target.value } : entry)),
                              }))
                            }
                            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1F6B3F]"
                          />
                          <ImageFieldEditor
                            label={`Imagen del bloque ${index + 1}`}
                            value={item.image}
                            onChange={(event) =>
                              updateContent((prev) => ({
                                ...prev,
                                highlights: prev.highlights.map((entry, i) => (i === index ? { ...entry, image: event.target.value } : entry)),
                              }))
                            }
                            uploading={imageUploadingKey === `highlight-${index}`}
                            helpText="Recomendado para mostrar una foto de obra."
                            onUpload={(file) =>
                              handleUploadMedia(
                                `highlight-${index}`,
                                (prev, url) => ({
                                  ...prev,
                                  highlights: prev.highlights.map((entry, i) => (i === index ? { ...entry, image: url } : entry)),
                                }),
                                file
                              )
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {content.projects.map((project, index) => (
                      <div key={project.title} className="rounded-[24px] border border-slate-200 p-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Proyecto {index + 1}</p>
                        <input
                          value={project.title}
                          onChange={(event) =>
                            updateContent((prev) => ({
                              ...prev,
                              projects: prev.projects.map((entry, i) => (i === index ? { ...entry, title: event.target.value } : entry)),
                            }))
                          }
                          className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1F6B3F]"
                        />
                        <input
                          value={project.tag || ''}
                          onChange={(event) =>
                            updateContent((prev) => ({
                              ...prev,
                              projects: prev.projects.map((entry, i) => (i === index ? { ...entry, tag: event.target.value } : entry)),
                            }))
                          }
                          placeholder="Etiqueta del trabajo"
                          className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1F6B3F]"
                        />
                        <div className="mt-3">
                          <ImageFieldEditor
                            label={`Imagen del proyecto ${index + 1}`}
                            value={project.image}
                            onChange={(event) =>
                              updateContent((prev) => ({
                                ...prev,
                                projects: prev.projects.map((entry, i) => (i === index ? { ...entry, image: event.target.value } : entry)),
                              }))
                            }
                            uploading={imageUploadingKey === `project-${index}`}
                            helpText="Sirve como imagen principal en el carrusel."
                            onUpload={(file) =>
                              handleUploadMedia(
                                `project-${index}`,
                                (prev, url) => ({
                                  ...prev,
                                  projects: prev.projects.map((entry, i) => (i === index ? { ...entry, image: url } : entry)),
                                }),
                                file
                              )
                            }
                          />
                        </div>
                        <div className="mt-3">
                          <ImageFieldEditor
                            label={`Video del proyecto ${index + 1}`}
                            value={project.videoUrl || ''}
                            onChange={() => {}}
                            onClear={() =>
                              updateContent((prev) => ({
                                ...prev,
                                projects: prev.projects.map((entry, i) => (i === index ? { ...entry, videoUrl: '' } : entry)),
                              }))
                            }
                            uploading={imageUploadingKey === `project-video-${index}`}
                            helpText="Subí un video corto. Se guarda en Supabase y aparece en la web."
                            accept="video/*"
                            mediaType="video"
                            showUrlInput={false}
                            onUpload={(file) =>
                              handleUploadMedia(
                                `project-video-${index}`,
                                (prev, url) => ({
                                  ...prev,
                                  projects: prev.projects.map((entry, i) => (i === index ? { ...entry, videoUrl: url } : entry)),
                                }),
                                file
                              )
                            }
                          />
                        </div>
                        <input
                          value={project.youtubeUrl || ''}
                          onChange={(event) =>
                            updateContent((prev) => ({
                              ...prev,
                              projects: prev.projects.map((entry, i) => (i === index ? { ...entry, youtubeUrl: event.target.value } : entry)),
                            }))
                          }
                          placeholder="Link de YouTube del video completo"
                          className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1F6B3F]"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    {content.services.map((service, index) => (
                      <div key={service.title} className="rounded-[24px] border border-slate-200 p-4">
                        <input
                          value={service.title}
                          onChange={(event) =>
                            updateContent((prev) => ({
                              ...prev,
                              services: prev.services.map((entry, i) => (i === index ? { ...entry, title: event.target.value } : entry)),
                            }))
                          }
                          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1F6B3F]"
                        />
                        <textarea
                          rows="3"
                          value={service.desc}
                          onChange={(event) =>
                            updateContent((prev) => ({
                              ...prev,
                              services: prev.services.map((entry, i) => (i === index ? { ...entry, desc: event.target.value } : entry)),
                            }))
                          }
                          className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1F6B3F]"
                        />
                      </div>
                    ))}
                  </div>
                </Panel>
              </div>
            </section>
          )}

        </main>
      </div>
    </div>
  );
}

