import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  Droplets,
  HardHat,
  Instagram,
  Layers,
  MapPin,
  Menu,
  MessageCircle,
  Paintbrush,
  Phone,
  Play,
  Ruler,
  Send,
  ShieldCheck,
  Sparkles,
  Wrench,
  X,
} from 'lucide-react';
import { defaultSiteContent } from './siteContent';

function goTo(id, closeMenu) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
  if (closeMenu) closeMenu();
}

const WHATSAPP_NUMBER = '5491123010751';
const WHATSAPP_TEXT = encodeURIComponent(
  'Hola FILO, vi la web y quiero pedir presupuesto por trabajos en altura o fachada.'
);
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_TEXT}`;
const WHITE_LOGO_URL = '/filo-logo-white.png';

const LEAD_DEFAULTS = {
  name: '',
  company: '',
  phone: '',
  email: '',
  projectType: '',
  budget: '',
  timeline: '',
  location: '',
  surface: '',
  message: '',
};

const CONTACT_ROLES = ['Administrador', 'Propietario'];
const PROJECT_TYPES = ['Impermeabilización de terraza', 'Fachada vertical / altura', 'Pintura', 'Refacción', 'Construcción'];
const BUDGET_RANGES = ['A definir tras visita', 'Menos de ARS 1M', 'ARS 1M a 3M', 'ARS 3M a 8M', 'Más de ARS 8M'];
const TIMELINES = ['Urgente por filtración', 'Inmediato', 'Dentro de 30 días', 'Más adelante'];
const SERVICE_ICONS = [Droplets, Building2, HardHat, Paintbrush, Wrench, Layers];
const FEATURE_CARDS = [
  { icon: HardHat, title: 'Técnica moderna', text: 'Trabajo vertical, sellados y pintura con planificación previa.' },
  { icon: ShieldCheck, title: 'Materiales confiables', text: 'Soluciones pensadas para intemperie, humedad y exposición.' },
  { icon: Building2, title: 'Equipo profesional', text: 'Intervención ordenada para edificios, casas y locales.' },
  { icon: CalendarDays, title: 'Respuesta rápida', text: 'Coordinación por WhatsApp y seguimiento claro de cada consulta.' },
];

function isPlayableVideoUrl(value) {
  if (!value) return false;
  if (/^data:video\//i.test(value)) return true;
  const cleanUrl = value.split('?')[0].split('#')[0].toLowerCase();
  return ['.mp4', '.webm', '.ogg', '.mov', '.m4v'].some((extension) => cleanUrl.endsWith(extension));
}

function hasGardenContent(item) {
  return /jardin|jardín|jardines|jardiner/i.test([item.title, item.tag, item.desc].filter(Boolean).join(' '));
}

function buildLeadResult() {
  return {
    status: 'Solicitud enviada',
    nextStep: 'Se abrió WhatsApp con los datos cargados. Revisamos tu consulta y coordinamos el próximo paso.',
  };
}

function buildLeadWhatsappLink(form) {
  const message = [
    'Hola FILO, quiero pedir presupuesto.',
    '',
    `Nombre: ${form.name || '-'}`,
    `Administrador o propietario: ${form.company || '-'}`,
    `Teléfono: ${form.phone || '-'}`,
    `Email: ${form.email || '-'}`,
    `Servicio: ${form.projectType || '-'}`,
    `Presupuesto estimado: ${form.budget || '-'}`,
    `Plazo de inicio: ${form.timeline || '-'}`,
    `Ubicación: ${form.location || '-'}`,
    `Superficie aprox.: ${form.surface ? `${form.surface} m2` : 'No informada'}`,
    '',
    `Descripción: ${form.message || '-'}`,
  ].join('\n');

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function trackMetaEvent(eventName, params = {}) {
  if (typeof window === 'undefined' || !window.fbq) return;
  window.fbq('track', eventName, params);
}

function SectionLabel({ children, dark = false }) {
  return (
    <span className={`text-[11px] font-black uppercase tracking-[0.32em] ${dark ? 'text-orange-300' : 'text-orange-600'}`}>
      {children}
    </span>
  );
}

function ServiceCard({ icon: Icon, title, desc, featured = false }) {
  return (
    <article className={`min-h-[250px] border p-7 ${featured ? 'border-orange-500 bg-[#071226] text-white' : 'border-zinc-200 bg-white text-[#071226]'}`}>
      <div className={`mb-7 flex h-14 w-14 items-center justify-center ${featured ? 'bg-orange-600 text-white' : 'bg-orange-50 text-orange-600'}`}>
        <Icon size={26} />
      </div>
      <h4 className="text-2xl font-black uppercase leading-tight">{title}</h4>
      <p className={`mt-4 text-sm font-medium leading-7 ${featured ? 'text-white/72' : 'text-zinc-600'}`}>{desc}</p>
    </article>
  );
}

export default function PublicSite({ onEnterInternal, content = defaultSiteContent }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState('inicio');
  const [leadForm, setLeadForm] = useState(LEAD_DEFAULTS);
  const [leadResult, setLeadResult] = useState(null);
  const visibleProjects = content.projects.filter((project) => !hasGardenContent(project));
  const visibleServices = content.services.filter((service) => !hasGardenContent(service));

  useEffect(() => {
    const onScroll = () => {
      const current = content.sections.find(({ id }) => {
        const el = document.getElementById(id);
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        return rect.top >= -140 && rect.top <= 280;
      });
      if (current) setActive(current.id);
    };

    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [content.sections]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('filo_lead_intake_v1');
      if (raw) setLeadForm({ ...LEAD_DEFAULTS, ...JSON.parse(raw) });
    } catch {
      setLeadForm(LEAD_DEFAULTS);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('filo_lead_intake_v1', JSON.stringify(leadForm));
  }, [leadForm]);

  const handleLeadSubmit = (event) => {
    event.preventDefault();
    trackMetaEvent('Lead', {
      content_name: 'Formulario de presupuesto',
      content_category: leadForm.projectType || 'Consulta',
    });
    setLeadResult(buildLeadResult());
    window.open(buildLeadWhatsappLink(leadForm), '_blank', 'noopener,noreferrer');
  };

  const handleWhatsappClick = (source) => {
    trackMetaEvent('Contact', { content_name: source, content_category: 'WhatsApp' });
  };

  return (
    <div className="min-h-screen bg-white text-[#071226] selection:bg-orange-600 selection:text-white">
      <header className="fixed left-0 right-0 top-0 z-50">
        <div className="hidden bg-[#071226] text-white lg:block">
          <div className="container mx-auto flex items-center justify-between px-6 py-4">
            <button onClick={() => goTo('inicio')} className="flex items-center">
            <img src={WHITE_LOGO_URL} alt="FILO Constructora" className="h-20 object-contain" />
            </button>
            <div className="flex items-center gap-8 text-[11px] font-bold uppercase tracking-[0.12em] text-white/78">
              <span className="inline-flex items-center gap-3">
                <Phone className="h-4 w-4 text-orange-500" />
                {content.contact.phone}
              </span>
              <span className="inline-flex items-center gap-3">
                <MapPin className="h-4 w-4 text-orange-500" />
                Buenos Aires
              </span>
            </div>
          </div>
        </div>

        <nav className="bg-orange-600 text-white shadow-xl shadow-black/15">
          <div className="container mx-auto flex h-[58px] items-center justify-between px-6">
            <img src={WHITE_LOGO_URL} alt="FILO Constructora" className="h-14 object-contain lg:hidden" />
            <div className="hidden items-center gap-9 lg:flex">
              {content.sections.map((item) => (
                <button
                  key={item.id}
                  onClick={() => goTo(item.id)}
                  className={`text-[11px] font-black uppercase tracking-[0.18em] transition ${active === item.id ? 'text-[#071226]' : 'text-white'} hover:text-[#071226]`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="hidden items-center gap-3 lg:flex">
              <button onClick={onEnterInternal} className="bg-[#071226] px-5 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-white transition hover:bg-white hover:text-[#071226]">
                Acceso interno
              </button>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="bg-[#071226] p-3 text-white transition hover:bg-white hover:text-[#071226]">
                <Instagram size={18} />
              </a>
            </div>
            <button className="p-2 lg:hidden" onClick={() => setMenuOpen((value) => !value)}>
              {menuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </nav>
        <div className="hidden overflow-hidden bg-[#050b16] py-2 text-white lg:block">
          <div className="animate-[filo-marquee_24s_linear_infinite] whitespace-nowrap text-[10px] font-black uppercase tracking-[0.28em] text-white/72">
            <span className="mx-8 text-orange-500">Soluciones en altura</span>
            <span className="mx-8">Fachadas verticales</span>
            <span className="mx-8">Pintura exterior</span>
            <span className="mx-8">Impermeabilización</span>
            <span className="mx-8">Trabajos con silleta</span>
            <span className="mx-8 text-orange-500">Soluciones en altura</span>
            <span className="mx-8">Fachadas verticales</span>
            <span className="mx-8">Pintura exterior</span>
            <span className="mx-8">Impermeabilización</span>
            <span className="mx-8">Trabajos con silleta</span>
          </div>
        </div>
      </header>

      <div className={`fixed inset-0 z-[60] flex flex-col items-center justify-center gap-8 bg-[#071226] text-white transition-transform duration-500 lg:hidden ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <button className="absolute right-6 top-6" onClick={() => setMenuOpen(false)}>
          <X size={32} />
        </button>
        <img src={WHITE_LOGO_URL} alt="FILO Constructora" className="h-24" />
        {content.sections.map((item) => (
          <button key={item.id} className="text-3xl font-black uppercase hover:text-orange-500" onClick={() => goTo(item.id, () => setMenuOpen(false))}>
            {item.label}
          </button>
        ))}
        <button onClick={onEnterInternal} className="bg-orange-600 px-6 py-4 text-sm font-black uppercase tracking-widest text-white">
          Acceso interno
        </button>
      </div>

      <main>
        <section id="inicio" className="relative flex min-h-[860px] items-center overflow-hidden bg-[#071226] pt-[58px] lg:pt-[164px]">
          {isPlayableVideoUrl(content.hero.image) ? (
            <video src={content.hero.image} className="absolute inset-0 h-full w-full object-cover opacity-45" muted loop playsInline autoPlay preload="metadata" aria-label="Obra FILO" />
          ) : (
            <img src={content.hero.image} className="absolute inset-0 h-full w-full object-cover opacity-45" alt="Obra FILO" />
          )}
          <div className="absolute inset-0 bg-black/45" />
          <div className="container relative z-10 mx-auto px-6 pb-24 text-center text-white lg:pb-32">
            <div className="mx-auto max-w-5xl">
              <h1 className="text-5xl font-black uppercase leading-[1.02] tracking-[0.01em] md:text-7xl lg:text-[5.8rem]">
                Soluciones en altura
              </h1>
              <p className="mx-auto mt-6 max-w-3xl text-sm font-semibold leading-7 text-white/78 md:text-base">
                Fachadas, pintura exterior, impermeabilización y trabajos verticales para edificios, consorcios, locales y viviendas.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <button onClick={() => goTo('presupuesto')} className="bg-orange-600 px-10 py-4 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:bg-white hover:text-[#071226]">
                  Cotizar trabajo
                </button>
                <button onClick={() => goTo('proyectos')} className="border border-white/45 px-10 py-4 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:bg-white hover:text-[#071226]">
                  Ver trabajos
                </button>
              </div>
            </div>
          </div>
          <div className="absolute bottom-[-1px] left-0 right-0 z-20 h-20 bg-orange-600" style={{ clipPath: 'polygon(0 58%, 10% 45%, 22% 62%, 36% 48%, 49% 60%, 65% 42%, 80% 58%, 100% 45%, 100% 100%, 0 100%)' }} />
        </section>

        <section id="empresa" className="bg-orange-600 py-24 text-white">
          <div className="container mx-auto grid gap-12 px-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <SectionLabel dark>Por qué elegir FILO</SectionLabel>
              <h2 className="mt-4 text-4xl font-black uppercase leading-tight md:text-6xl">
                Obra ordenada, segura y visible.
              </h2>
              <p className="mt-6 max-w-xl text-sm font-medium leading-7 text-white/82">
                Fachadas, pintura exterior, impermeabilización y mantenimiento ejecutados con planificación, seguridad y seguimiento claro.
              </p>
              <button onClick={() => goTo('servicios')} className="mt-9 border border-white/70 px-7 py-4 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:bg-white hover:text-orange-600">
                Ver servicios
              </button>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              {FEATURE_CARDS.map(({ icon: Icon, title, text }) => (
                <article key={title} className="bg-[#071226] p-7 shadow-2xl shadow-black/10">
                  <Icon className="mb-5 text-orange-500" size={30} />
                  <h3 className="text-lg font-black uppercase">{title}</h3>
                  <p className="mt-3 text-sm font-medium leading-6 text-white/70">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="proyectos" className="bg-white py-24">
          <div className="container mx-auto px-6">
            <div className="mb-14 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
              <div>
                <SectionLabel>Trabajos reales</SectionLabel>
                <h2 className="mt-4 text-4xl font-black uppercase leading-tight md:text-6xl">Proyectos recientes</h2>
              </div>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-3 bg-[#071226] px-6 py-4 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:bg-orange-600">
                <Instagram size={18} />
                Ver Instagram
              </a>
            </div>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {visibleProjects.map((project, index) => {
                const hasPlayableVideo = isPlayableVideoUrl(project.videoUrl);
                return (
                  <a key={project.title} href={project.videoUrl || WHATSAPP_LINK} target="_blank" rel="noreferrer" className="group relative aspect-[9/16] overflow-hidden bg-[#071226]" aria-label={`Ver ${project.title}`}>
                    {hasPlayableVideo ? (
                      <video src={project.videoUrl} poster={project.image} className="h-full w-full object-cover opacity-75 transition duration-700 group-hover:scale-105" muted loop playsInline autoPlay preload="metadata" />
                    ) : (
                      <img src={project.image} className="h-full w-full object-cover opacity-75 transition duration-700 group-hover:scale-105" alt={project.title} />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#071226] via-[#071226]/20 to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md transition group-hover:bg-orange-600">
                        <Play fill="currentColor" size={24} />
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <p className="mb-2 text-[10px] font-black uppercase tracking-[0.24em] text-orange-400">{project.tag || `Proyecto 0${index + 1}`}</p>
                      <h3 className="text-xl font-black uppercase text-white">{project.title}</h3>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </section>

        <section id="servicios" className="bg-zinc-100 py-24">
          <div className="container mx-auto px-6">
            <div className="mb-14 max-w-4xl">
              <SectionLabel>Servicios</SectionLabel>
              <h2 className="mt-4 text-4xl font-black uppercase leading-tight md:text-6xl">Fachadas, altura e impermeabilización</h2>
              <p className="mt-5 max-w-3xl text-sm font-medium leading-7 text-zinc-600">
                Servicios claros para convertir visitas en consultas: altura, pintura, sellados, humedad y mantenimiento.
              </p>
            </div>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {visibleServices.map((service, index) => (
                <ServiceCard key={service.title} icon={SERVICE_ICONS[index % SERVICE_ICONS.length]} title={service.title} desc={service.desc} featured={service.featured} />
              ))}
            </div>
          </div>
        </section>

        <section id="presupuesto" className="bg-[#071226] py-24 text-white">
          <div className="container mx-auto grid gap-10 px-6 lg:grid-cols-[0.75fr_1.25fr]">
            <div>
              <SectionLabel dark>Presupuesto</SectionLabel>
              <h2 className="mt-4 text-4xl font-black uppercase leading-tight md:text-6xl">Pedí una visita técnica</h2>
              <p className="mt-6 text-sm font-medium leading-7 text-white/72">
                Completá los datos del trabajo y se abre WhatsApp con toda la información. Es directo para cerrar consulta.
              </p>
              <div className="mt-8 space-y-4">
                {[
                  'Fachadas, medianeras, patios y terrazas.',
                  'Fotos y videos ayudan a evaluar más rápido.',
                  'El equipo responde con próximos pasos claros.',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 bg-white/5 p-4">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-500" />
                    <span className="text-sm font-semibold text-white/78">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 text-[#071226] shadow-2xl md:p-9">
              <form onSubmit={handleLeadSubmit} className="grid gap-4 md:grid-cols-2">
                <input className="border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm font-semibold outline-none focus:border-orange-500" type="text" required value={leadForm.name} onChange={(event) => setLeadForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="Nombre y apellido" />
                <select className="border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm font-semibold outline-none focus:border-orange-500" value={leadForm.company} onChange={(event) => setLeadForm((prev) => ({ ...prev, company: event.target.value }))}>
                  <option value="">Administrador o propietario</option>
                  {CONTACT_ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
                </select>
                <input className="border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm font-semibold outline-none focus:border-orange-500" type="tel" required value={leadForm.phone} onChange={(event) => setLeadForm((prev) => ({ ...prev, phone: event.target.value }))} placeholder="Teléfono / WhatsApp" />
                <input className="border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm font-semibold outline-none focus:border-orange-500" type="email" value={leadForm.email} onChange={(event) => setLeadForm((prev) => ({ ...prev, email: event.target.value }))} placeholder="Email" />
                <select className="border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm font-semibold outline-none focus:border-orange-500" required value={leadForm.projectType} onChange={(event) => setLeadForm((prev) => ({ ...prev, projectType: event.target.value }))}>
                  <option value="">Servicio</option>
                  {PROJECT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
                <select className="border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm font-semibold outline-none focus:border-orange-500" required value={leadForm.budget} onChange={(event) => setLeadForm((prev) => ({ ...prev, budget: event.target.value }))}>
                  <option value="">Presupuesto estimado</option>
                  {BUDGET_RANGES.map((range) => <option key={range} value={range}>{range}</option>)}
                </select>
                <select className="border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm font-semibold outline-none focus:border-orange-500" value={leadForm.timeline} onChange={(event) => setLeadForm((prev) => ({ ...prev, timeline: event.target.value }))}>
                  <option value="">Plazo de inicio</option>
                  {TIMELINES.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
                <input className="border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm font-semibold outline-none focus:border-orange-500" type="text" value={leadForm.location} onChange={(event) => setLeadForm((prev) => ({ ...prev, location: event.target.value }))} placeholder="Ubicación de la obra" />
                <div className="relative md:col-span-2">
                  <Ruler className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <input className="w-full border border-zinc-200 bg-zinc-50 py-4 pl-11 pr-4 text-sm font-semibold outline-none focus:border-orange-500" type="number" min="0" value={leadForm.surface} onChange={(event) => setLeadForm((prev) => ({ ...prev, surface: event.target.value }))} placeholder="Superficie aproximada en m2" />
                </div>
                <textarea className="resize-none border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm font-semibold outline-none focus:border-orange-500 md:col-span-2" rows="4" value={leadForm.message} onChange={(event) => setLeadForm((prev) => ({ ...prev, message: event.target.value }))} placeholder="Descripción breve del trabajo" />
                <button type="submit" className="inline-flex items-center justify-center gap-2 bg-orange-600 px-6 py-4 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:bg-[#071226] md:col-span-2">
                  <Send className="h-4 w-4" />
                  Pedir presupuesto
                </button>
              </form>

              {leadResult && (
                <div className="mt-6 border border-orange-200 bg-orange-50 p-5">
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-orange-600">{leadResult.status}</p>
                  <p className="mt-3 text-sm font-semibold leading-6 text-zinc-700">{leadResult.nextStep}</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#050b16] py-12 text-white">
        <div className="container mx-auto flex flex-col items-center justify-between gap-8 px-6 md:flex-row">
          <img src={WHITE_LOGO_URL} alt="Filo Constructora" className="h-20" />
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-3">
            {content.sections.map((item) => (
              <button key={item.id} onClick={() => goTo(item.id)} className="text-[10px] font-black uppercase tracking-[0.18em] text-white/70 hover:text-orange-500">
                {item.label}
              </button>
            ))}
          </div>
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/42">{content.footer.copy}</div>
        </div>
      </footer>

      <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer" onClick={() => handleWhatsappClick('Boton flotante')} className="fixed bottom-8 right-8 z-50 flex items-center justify-center rounded-full bg-green-500 p-4 text-white shadow-2xl transition hover:scale-110">
        <MessageCircle size={32} />
      </a>
    </div>
  );
}
