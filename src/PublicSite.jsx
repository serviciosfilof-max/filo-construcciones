import React, { useEffect, useState } from 'react';
import { Building2, ChevronRight, Clock, HardHat, Instagram, Layers, MapPin, Menu, MessageCircle, Phone, Play, X } from 'lucide-react';
import { defaultSiteContent } from './siteContent';

function goTo(id, closeMenu) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
  if (closeMenu) closeMenu();
}

function ServiceCard({ icon: Icon, title, desc }) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-[#fbfcfb] p-8">
      <Icon className="text-orange-600" size={28} />
      <h4 className="mt-4 text-2xl font-bold text-zinc-900">{title}</h4>
      <p className="mt-3 text-sm text-slate-500">{desc}</p>
    </div>
  );
}

export default function PublicSite({ onEnterInternal, content = defaultSiteContent }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState('inicio');

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
        <button className="absolute right-6 top-6" onClick={() => setMenuOpen(false)}><X size={32} /></button>
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
              <button onClick={() => goTo('proyectos')} className="bg-orange-600 px-10 py-5 text-sm font-black uppercase tracking-widest text-white transition hover:bg-white hover:text-zinc-900">
                {content.hero.primaryCta}
              </button>
              <button onClick={() => goTo('contacto')} className="border border-white/30 px-10 py-5 text-sm font-black uppercase tracking-widest text-white transition hover:bg-white/10">
                {content.hero.secondaryCta}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section id="empresa" className="bg-white py-24">
        <div className="container mx-auto px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-5xl font-black uppercase italic text-zinc-900 md:text-7xl">Soluciones FILO</h2>
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
              <span className="text-xs font-black uppercase tracking-widest text-orange-500">En Tiempo Real</span>
              <h3 className="mt-2 text-5xl font-black uppercase italic">Nuestras Obras</h3>
            </div>
            <button className="mt-8 flex items-center gap-3 border border-white/10 bg-white/5 px-6 py-3 transition hover:bg-white/10 md:mt-0">
              <Instagram className="text-orange-500" />
              <span className="text-xs font-bold uppercase tracking-widest">Ver más en Instagram</span>
            </button>
          </div>

          <div className="grid gap-6 md:grid-cols-4">
            {content.projects.map((project, index) => (
              <div key={project.title} className="group relative aspect-[9/16] overflow-hidden rounded-lg bg-zinc-900">
                <img
                  src={project.image}
                  className="h-full w-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105"
                  alt={project.title}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-md transition-colors group-hover:bg-orange-600">
                    <Play fill="white" size={24} />
                  </div>
                </div>
                <div className="absolute bottom-6 left-6">
                  <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-orange-500">{project.tag || `PROYECTO 0${index + 1}`}</p>
                  <p className="text-lg font-bold uppercase italic">{project.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="servicios" className="bg-white py-24">
        <div className="container mx-auto px-6">
          <div className="grid gap-6 md:grid-cols-3">
            <ServiceCard icon={Building2} title={content.services[0].title} desc={content.services[0].desc} />
            <ServiceCard icon={HardHat} title={content.services[1].title} desc={content.services[1].desc} />
            <ServiceCard icon={Layers} title={content.services[2].title} desc={content.services[2].desc} />
          </div>
        </div>
      </section>

      <section id="contacto" className="bg-white py-24">
        <div className="container mx-auto px-6">
          <div className="overflow-hidden rounded-3xl border border-zinc-100 bg-zinc-50 shadow-2xl md:flex">
            <div className="bg-zinc-900 p-12 text-white md:w-1/2 md:p-20">
              <h3 className="mb-8 text-5xl font-black uppercase italic">Hablemos <br /> de su obra.</h3>
              <div className="space-y-8">
                <div className="flex items-start gap-6">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center bg-orange-600"><Phone /></div>
                  <div>
                    <p className="mb-1 text-xs font-black uppercase text-zinc-500">Teléfono</p>
                    <p className="text-xl font-bold">{content.contact.phone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-6">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center bg-orange-600"><MapPin /></div>
                  <div>
                    <p className="mb-1 text-xs font-black uppercase text-zinc-500">Ubicación</p>
                    <p className="text-xl font-bold">{content.contact.location}</p>
                  </div>
                </div>
                <div className="flex items-start gap-6">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center bg-orange-600"><Clock /></div>
                  <div>
                    <p className="mb-1 text-xs font-black uppercase text-zinc-500">Horario</p>
                    <p className="text-xl font-bold">{content.contact.hours}</p>
                  </div>
                </div>
              </div>

              <div className="mt-16 flex gap-6 border-t border-zinc-800 pt-16">
                <Instagram className="cursor-pointer hover:text-orange-500" />
                <MessageCircle className="cursor-pointer hover:text-orange-500" />
              </div>
            </div>

            <div className="p-12 md:w-1/2 md:p-20">
              <form className="space-y-6">
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-widest text-zinc-400">Nombre Completo</label>
                  <input type="text" className="w-full border-b-2 border-zinc-200 bg-white py-3 focus:border-orange-600 focus:outline-none" />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-widest text-zinc-400">Email corporativo</label>
                  <input type="email" className="w-full border-b-2 border-zinc-200 bg-white py-3 focus:border-orange-600 focus:outline-none" />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-widest text-zinc-400">Mensaje / Requerimiento</label>
                  <textarea rows="4" className="w-full resize-none border-b-2 border-zinc-200 bg-white py-3 focus:border-orange-600 focus:outline-none" />
                </div>
                <button className="w-full bg-orange-600 py-5 text-sm font-black uppercase tracking-widest text-white transition hover:bg-zinc-900">
                  Enviar solicitud
                </button>
              </form>
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

      <a href="https://wa.me/123456789" target="_blank" rel="noreferrer" className="fixed bottom-8 right-8 z-50 flex items-center justify-center rounded-full bg-green-500 p-4 text-white shadow-2xl transition-transform hover:scale-110">
        <MessageCircle size={32} />
      </a>
    </div>
  );
}
