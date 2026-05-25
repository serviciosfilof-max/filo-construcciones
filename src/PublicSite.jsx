import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Droplets,
  HardHat,
  Instagram,
  Layers,
  Menu,
  MessageCircle,
  Paintbrush,
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

function ServiceCard({ icon: Icon, title, desc, featured = false }) {
  return (
    <div className={`rounded-[28px] border p-8 ${featured ? 'border-orange-200 bg-orange-50' : 'border-slate-200 bg-[#fbfcfb]'}`}>
      <div className={`flex h-12 w-12 items-center justify-center rounded-full ${featured ? 'bg-orange-600 text-white' : 'bg-white text-orange-600 shadow-sm'}`}>
        <Icon size={24} />
      </div>
      {featured && <p className="mt-5 text-[10px] font-black uppercase tracking-[0.35em] text-orange-700">Servicio destacado</p>}
      <h4 className="mt-4 text-2xl font-bold text-zinc-900">{title}</h4>
      <p className="mt-3 text-sm leading-7 text-slate-600">{desc}</p>
    </div>
  );
}

const WHATSAPP_NUMBER = '5491123010751';
const WHATSAPP_TEXT = encodeURIComponent(
  'Hola FILO, vi la web y quiero pedir presupuesto por impermeabilización de terraza o fachada vertical.'
);
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_TEXT}`;

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

function hasGardenContent(item) {
  return /jardin|jardín|jardines|jardiner/i.test([item.title, item.tag, item.desc].filter(Boolean).join(' '));
}

function buildLeadResult(form) {
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

export default function PublicSite({ onEnterInternal, content = defaultSiteContent }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState('inicio');
  const [leadForm, setLeadForm] = useState(LEAD_DEFAULTS);
  const [leadResult, setLeadResult] = useState(null);
  const visibleProjects = content.projects.filter((project) => !hasGardenContent(project));
  const visibleServices = content.services.filter((service) => !hasGardenContent(service));

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 50);
      const current = content.sections.find(({ id }) => {
        const el = document.getElementById(id);
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        return rect.top >= -120 && rect.top <= 280;
      });
      if (current) setActive(current.id);
    };

    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [content.sections]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('filo_lead_intake_v1');
      if (raw) {
        setLeadForm({ ...LEAD_DEFAULTS, ...JSON.parse(raw) });
      }
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
    setLeadResult(buildLeadResult(leadForm));
    window.open(buildLeadWhatsappLink(leadForm), '_blank', 'noopener,noreferrer');
  };

  const handleWhatsappClick = (source) => {
    trackMetaEvent('Contact', {
      content_name: source,
      content_category: 'WhatsApp',
    });
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 selection:bg-orange-500 selection:text-white">
      <nav className={`fixed z-50 w-full transition-all duration-500 ${scrolled ? 'bg-white/95 py-3 shadow-sm backdrop-blur' : 'bg-transparent py-6'}`}>
        <div className="container mx-auto flex items-center justify-between px-6">
          <button onClick={() => goTo('inicio')} className="flex items-center">
            <img src={content.logoUrl} alt="FILO Constructora" className="h-10 object-contain md:h-14" />
          </button>

          <div className="hidden items-center gap-10 md:flex">
            {content.sections.map((item) => (
              <button
                key={item.id}
                onClick={() => goTo(item.id)}
                className={`relative py-2 text-[11px] font-black uppercase tracking-[0.2em] transition ${active === item.id ? 'text-orange-600' : scrolled ? 'text-zinc-600' : 'text-white'} hover:text-orange-500`}
              >
                {item.label}
                {active === item.id && <span className="absolute bottom-0 left-0 h-0.5 w-full bg-orange-600" />}
              </button>
            ))}
            <button onClick={onEnterInternal} className="rounded-full bg-zinc-900 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-orange-600">
              Acceso interno
            </button>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="rounded-full bg-zinc-900 p-2 text-white transition hover:bg-orange-600">
              <Instagram size={20} />
            </a>
          </div>

          <button className="p-2 md:hidden" onClick={() => setMenuOpen((v) => !v)}>
            {menuOpen ? <X /> : <Menu className={scrolled ? 'text-zinc-900' : 'text-white'} />}
          </button>
        </div>
      </nav>

      <div className={`fixed inset-0 z-[60] flex flex-col items-center justify-center gap-8 bg-white transition-transform duration-500 md:hidden ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <button className="absolute right-6 top-6" onClick={() => setMenuOpen(false)}>
          <X size={32} />
        </button>
        {content.sections.map((item) => (
          <button key={item.id} className="text-3xl font-black uppercase italic hover:text-orange-600" onClick={() => goTo(item.id, () => setMenuOpen(false))}>
            {item.label}
          </button>
        ))}
        <button onClick={onEnterInternal} className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-black uppercase tracking-widest text-white">
          Acceso interno
        </button>
      </div>

      <section id="inicio" className="relative flex h-[90vh] items-center overflow-hidden bg-zinc-900">
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-zinc-950/80 to-transparent" />
        <img src={content.hero.image} className="absolute inset-0 h-full w-full object-cover opacity-60" alt="Obra FILO" />
        <div className="container relative z-20 mx-auto px-6 text-white">
          <div className="max-w-4xl">
            <div className="mb-6 flex items-center gap-4">
              <span className="h-0.5 w-12 bg-orange-600" />
              <span className="text-xs font-black uppercase tracking-[0.3em]">{content.hero.eyebrow}</span>
            </div>
            <h1 className="mb-8 text-6xl font-black uppercase italic leading-[0.9] tracking-tighter md:text-9xl">
              {content.hero.title} <br /> <span className="text-orange-500">{content.hero.accent}</span>
            </h1>
            <p className="max-w-2xl text-base leading-7 text-white/75 md:text-lg">{content.hero.subtitle}</p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <button onClick={() => goTo('presupuesto')} className="bg-orange-600 px-10 py-5 text-sm font-black uppercase tracking-widest text-white transition hover:bg-white hover:text-zinc-900">
                {content.hero.primaryCta}
              </button>
              <button onClick={() => goTo('proyectos')} className="border border-white/30 px-10 py-5 text-sm font-black uppercase tracking-widest text-white transition hover:bg-white/10">
                {content.hero.secondaryCta}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section id="empresa" className="bg-white py-24">
        <div className="container mx-auto px-6">
          <div className="mb-16 text-center">
              <h2 className="mb-4 text-5xl font-black uppercase italic text-zinc-900 md:text-7xl">Servicios que hoy resolvemos</h2>
              <div className="mx-auto h-2 w-20 bg-orange-600" />
            </div>
          <div className="grid gap-10 md:grid-cols-3">
            {content.highlights.map((item) => (
              <div key={item.title} className="group overflow-hidden border border-zinc-100 bg-zinc-50 shadow-sm transition-all duration-500 hover:shadow-2xl">
                <div className="relative aspect-square overflow-hidden">
                  <img src={item.image} alt={item.title} className="h-full w-full object-cover grayscale transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0" />
                  <div className="absolute inset-0 bg-gradient-to-t from-orange-500/40 to-transparent" />
                  <div className="absolute inset-0 flex flex-col justify-between p-8">
                    <div className="flex justify-end">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg transition-transform group-hover:scale-110">
                        <ChevronRight className="text-zinc-900" />
                      </div>
                    </div>
                    <div>
                      <h4 className="mb-2 text-3xl font-black uppercase leading-none text-white">{item.title}</h4>
                      <p className="text-sm font-bold uppercase tracking-wider text-zinc-200">{item.desc}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="proyectos" className="overflow-hidden bg-zinc-950 py-24 text-white">
        <div className="container mx-auto px-6">
          <div className="mb-16 flex flex-col items-center justify-between md:flex-row">
            <div className="text-center md:text-left">
              <span className="text-xs font-black uppercase tracking-widest text-orange-500">Fotos y videos de trabajos reales</span>
              <h3 className="mt-2 text-5xl font-black uppercase italic">Trabajos recientes</h3>
            </div>
            <button className="mt-8 flex items-center gap-3 border border-white/10 bg-white/5 px-6 py-3 transition hover:bg-white/10 md:mt-0">
              <Instagram className="text-orange-500" />
              <span className="text-xs font-bold uppercase tracking-widest">Ver más en Instagram</span>
            </button>
          </div>

          <div className="grid gap-6 md:grid-cols-4">
            {visibleProjects.map((project, index) => (
              <a key={project.title} href={project.videoUrl || WHATSAPP_LINK} target="_blank" rel="noreferrer" className="group relative aspect-[9/16] overflow-hidden rounded-lg bg-zinc-900">
                <img src={project.image} className="h-full w-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105" alt={project.title} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-md transition-colors group-hover:bg-orange-600">
                    <Play fill="white" size={24} />
                  </div>
                </div>
                <div className="absolute bottom-6 left-6">
                  <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-orange-500">{project.tag || `PROYECTO 0${index + 1}`}</p>
                  <p className="text-lg font-bold uppercase italic">{project.title}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section id="servicios" className="bg-white py-24">
        <div className="container mx-auto px-6">
          <div className="mb-12 max-w-3xl">
            <span className="text-xs font-black uppercase tracking-widest text-orange-600">Prioridad comercial</span>
            <h3 className="mt-3 text-5xl font-black uppercase italic leading-none text-zinc-900 md:text-7xl">Impermeabilización primero</h3>
            <p className="mt-5 text-base leading-7 text-slate-600">
              Nos enfocamos en resolver filtraciones, humedades y mantenimiento de superficies expuestas. También tomamos pintura, refacciones, trabajos verticales y construcciones cuando el alcance lo requiere.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {visibleServices.map((service, index) => (
              <ServiceCard
                key={service.title}
                icon={SERVICE_ICONS[index % SERVICE_ICONS.length]}
                title={service.title}
                desc={service.desc}
                featured={service.featured}
              />
            ))}
          </div>
        </div>
      </section>

      <section id="presupuesto" className="relative overflow-hidden bg-[#0d1110] py-24 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.24),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.08),_transparent_28%)]" />
        <div className="container relative mx-auto px-6">
          <div className="mb-12 max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.35em] text-orange-400">
              <Sparkles className="h-3.5 w-3.5" />
              Solicitud de presupuesto
            </span>
            <h3 className="mt-5 text-5xl font-black uppercase italic leading-none md:text-7xl">Cotizá tu terraza o fachada</h3>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/70">
              Completá los datos principales del trabajo y te respondemos por WhatsApp para coordinar la visita, revisar fotos o avanzar con una cotización.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[36px] border border-white/10 bg-white/5 p-8 backdrop-blur-xl md:p-10">
              <div className="flex items-center gap-3 text-sm font-black uppercase tracking-[0.3em] text-orange-300">
                <ShieldCheck className="h-5 w-5" />
                Respuesta más ordenada
              </div>
              <h4 className="mt-6 text-3xl font-black uppercase italic">Ideal para impermeabilización</h4>
              <p className="mt-4 text-sm leading-7 text-white/70">
                Si hay goteras, humedad en paredes, fisuras o una fachada que necesita intervención, el formulario nos deja una primera lectura del trabajo antes de coordinar.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  'Atendemos terrazas, balcones, medianeras y fachadas con filtraciones.',
                  'Podés indicar superficie, ubicación y urgencia para orientar mejor la consulta.',
                  'El WhatsApp se abre con todos los datos cargados para no repetir información.',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-400" />
                    <p className="text-sm leading-6 text-white/80">{item}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-white/50">Ubicación</p>
                  <p className="mt-3 text-lg font-bold">{content.contact.location}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-white/50">Horario</p>
                  <p className="mt-3 text-lg font-bold">{content.contact.hours}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-black/20 p-5 sm:col-span-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-white/50">WhatsApp directo</p>
                  <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer" onClick={() => handleWhatsappClick('WhatsApp directo')} className="mt-3 inline-flex items-center gap-2 text-lg font-bold text-orange-300 transition hover:text-orange-200">
                    {content.contact.phone}
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer" onClick={() => handleWhatsappClick('CTA presupuesto')} className="inline-flex items-center gap-2 rounded-full bg-orange-600 px-5 py-3 text-xs font-black uppercase tracking-[0.25em] text-white transition hover:bg-orange-500">
                  <MessageCircle className="h-4 w-4" />
                  Consultar por WhatsApp
                </a>
                <button onClick={() => goTo('inicio')} className="rounded-full border border-white/15 px-5 py-3 text-xs font-black uppercase tracking-[0.25em] text-white/80 transition hover:border-white/30 hover:bg-white/5">
                  Volver al inicio
                </button>
              </div>
            </div>

            <div className="rounded-[36px] bg-white p-6 text-zinc-900 shadow-2xl md:p-10">
              <div className="flex flex-col gap-3 border-b border-zinc-100 pb-6 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-orange-600">Solicitud de servicio</p>
                  <h4 className="mt-3 text-3xl font-black uppercase italic">Pedí presupuesto</h4>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-emerald-700">
                  <CalendarDays className="h-4 w-4" />
                  WhatsApp con datos
                </div>
              </div>

              <form onSubmit={handleLeadSubmit} className="mt-8 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.35em] text-zinc-400">Nombre y apellido</label>
                  <input
                    type="text"
                    required
                    value={leadForm.name}
                    onChange={(event) => setLeadForm((prev) => ({ ...prev, name: event.target.value }))}
                    className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 outline-none transition focus:border-orange-500 focus:bg-white"
                    placeholder="Tu nombre"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.35em] text-zinc-400">Administrador o propietario</label>
                  <select
                    value={leadForm.company}
                    onChange={(event) => setLeadForm((prev) => ({ ...prev, company: event.target.value }))}
                    className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 outline-none transition focus:border-orange-500 focus:bg-white"
                  >
                    <option value="">Seleccionar</option>
                    {CONTACT_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.35em] text-zinc-400">Teléfono o WhatsApp</label>
                  <input
                    type="tel"
                    required
                    value={leadForm.phone}
                    onChange={(event) => setLeadForm((prev) => ({ ...prev, phone: event.target.value }))}
                    className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 outline-none transition focus:border-orange-500 focus:bg-white"
                    placeholder="Ej: +54 11 0000-0000"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.35em] text-zinc-400">Email</label>
                  <input
                    type="email"
                    value={leadForm.email}
                    onChange={(event) => setLeadForm((prev) => ({ ...prev, email: event.target.value }))}
                    className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 outline-none transition focus:border-orange-500 focus:bg-white"
                    placeholder="correo@empresa.com"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.35em] text-zinc-400">Servicio</label>
                  <select
                    required
                    value={leadForm.projectType}
                    onChange={(event) => setLeadForm((prev) => ({ ...prev, projectType: event.target.value }))}
                    className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 outline-none transition focus:border-orange-500 focus:bg-white"
                  >
                    <option value="">Seleccionar</option>
                    {PROJECT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.35em] text-zinc-400">Presupuesto estimado</label>
                  <select
                    required
                    value={leadForm.budget}
                    onChange={(event) => setLeadForm((prev) => ({ ...prev, budget: event.target.value }))}
                    className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 outline-none transition focus:border-orange-500 focus:bg-white"
                  >
                    <option value="">Seleccionar</option>
                    {BUDGET_RANGES.map((range) => (
                      <option key={range} value={range}>
                        {range}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.35em] text-zinc-400">Plazo de inicio</label>
                  <select
                    value={leadForm.timeline}
                    onChange={(event) => setLeadForm((prev) => ({ ...prev, timeline: event.target.value }))}
                    className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 outline-none transition focus:border-orange-500 focus:bg-white"
                  >
                    <option value="">Seleccionar</option>
                    {TIMELINES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.35em] text-zinc-400">Ubicación de la obra</label>
                  <input
                    type="text"
                    value={leadForm.location}
                    onChange={(event) => setLeadForm((prev) => ({ ...prev, location: event.target.value }))}
                    className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 outline-none transition focus:border-orange-500 focus:bg-white"
                    placeholder="Ciudad / barrio"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.35em] text-zinc-400">Superficie aproximada</label>
                  <div className="relative">
                    <Ruler className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="number"
                      min="0"
                      value={leadForm.surface}
                      onChange={(event) => setLeadForm((prev) => ({ ...prev, surface: event.target.value }))}
                      className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 py-3 pl-11 pr-4 outline-none transition focus:border-orange-500 focus:bg-white"
                      placeholder="Metros cuadrados aproximados"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.35em] text-zinc-400">Descripción breve</label>
                  <textarea
                    rows="4"
                    value={leadForm.message}
                    onChange={(event) => setLeadForm((prev) => ({ ...prev, message: event.target.value }))}
                    className="w-full resize-none rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 outline-none transition focus:border-orange-500 focus:bg-white"
                    placeholder="Ej: terraza con filtraciones, fachada con grietas, humedad en techo, pintura exterior o refacción."
                  />
                </div>

                <div className="md:col-span-2 flex flex-col gap-3 sm:flex-row">
                  <button type="submit" className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-zinc-900 px-6 py-4 text-sm font-black uppercase tracking-[0.25em] text-white transition hover:bg-orange-600">
                    <Send className="h-4 w-4" />
                    Pedir presupuesto
                  </button>
                  <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer" onClick={() => handleWhatsappClick('Boton formulario')} className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-zinc-200 px-6 py-4 text-sm font-black uppercase tracking-[0.25em] text-zinc-900 transition hover:border-orange-500 hover:text-orange-600">
                    <MessageCircle className="h-4 w-4" />
                    Consultar por WhatsApp
                  </a>
                </div>
              </form>

              {leadResult && (
                <div className="mt-8 rounded-[28px] border border-orange-100 bg-orange-50 p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.35em] text-orange-600">Consulta recibida</p>
                      <h5 className="mt-2 text-2xl font-black uppercase italic text-zinc-900">{leadResult.status}</h5>
                    </div>
                    <div className="rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-orange-600">WhatsApp listo</div>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-zinc-700">{leadResult.nextStep}</p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <a href={buildLeadWhatsappLink(leadForm)} target="_blank" rel="noreferrer" onClick={() => handleWhatsappClick('Resultado formulario')} className="inline-flex items-center gap-2 rounded-full bg-orange-600 px-5 py-3 text-xs font-black uppercase tracking-[0.25em] text-white transition hover:bg-orange-500">
                      <MessageCircle className="h-4 w-4" />
                      Responder por WhatsApp
                    </a>
                    <button type="button" onClick={() => goTo('proyectos')} className="inline-flex items-center gap-2 rounded-full border border-orange-200 px-5 py-3 text-xs font-black uppercase tracking-[0.25em] text-orange-700 transition hover:bg-white">
                      Ver proyectos
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-900 bg-zinc-950 py-16 text-white">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
            <img src={content.logoUrl} alt="Filo Constructora" className="h-12 invert brightness-0" />
            <div className="flex flex-wrap justify-center gap-x-12 gap-y-3">
              {content.sections.map((item) => (
                <button key={item.id} onClick={() => goTo(item.id)} className="text-[10px] font-black uppercase tracking-widest hover:text-orange-500">
                  {item.label}
                </button>
              ))}
            </div>
            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-600">{content.footer.copy}</div>
          </div>
        </div>
      </footer>

      <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer" onClick={() => handleWhatsappClick('Boton flotante')} className="fixed bottom-8 right-8 z-50 flex items-center justify-center rounded-full bg-green-500 p-4 text-white shadow-2xl transition-transform hover:scale-110">
        <MessageCircle size={32} />
      </a>
    </div>
  );
}
