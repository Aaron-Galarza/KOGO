import { MapPin, Phone, Clock } from 'lucide-react';
import { cn } from '@/utils/cn';
import {
  ADDRESS,
  PHONE,
  WHATSAPP_URL,
  GOOGLE_MAPS_EMBED,
  GOOGLE_MAPS_URL,
  SCHEDULE,
} from '@/utils/constants';
import type { StoreConfig } from '@/types';

export function AboutSection({ config, className = '' }: { config?: StoreConfig | null; className?: string }) {
  const weeklySchedule = config?.dailySchedule?.filter((d) => d.day) ?? [];

  return (
    <section
      className={cn(
        'mx-auto mb-16 w-full max-w-[1200px] rounded-3xl bg-white px-5 py-14 shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.05)] sm:px-8 md:mb-20 md:py-20',
        className
      )}
    >
      <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
        <div className="max-md:text-center lg:flex-[2]">
          <h2 className="mb-5 font-['Montserrat'] text-[2.5rem] font-extrabold leading-tight text-[#2d3748] max-md:mb-4 max-md:text-[1.65rem]">
            BIENVENIDOS A KOGO | KOREAN STREET FOOD
          </h2>

          <div className="mb-8 space-y-4">
            <p className="font-['Open_Sans'] text-[1.1em] leading-relaxed text-[#4a5568] max-md:text-[1.02rem]">
              Comida coreana en Corrientes: alta calidad y una experiencia diferente.
            </p>

            <p className="font-['Open_Sans'] text-[1.1em] leading-relaxed text-[#4a5568] max-md:text-[1.02rem]">
              KOGO no nació de un día para el otro. Fue un camino de ideas, pruebas, formas y
              emociones que hoy cobran vida en cada detalle.
            </p>

            <p className="font-['Open_Sans'] text-[1.1em] leading-relaxed text-[#4a5568] max-md:text-[1.02rem]">
              La primera vez que abrimos esta puerta en Pasaje Agustín González 1075, no había nada.
              Solo un espacio vacío, polvo, ruido y días largos. Pero cada paso nos acercaba un poco
              más, porque no estábamos armando solo un local: estábamos creando una experiencia.
              Diseñamos una cocina que no se esconde, donde vas a poder ver, sentir y vivir todo.
            </p>
          </div>

          <h3 className="mb-4 font-['Montserrat'] text-[1.8rem] font-bold text-[#D95A2B] max-md:text-[1.35rem]">
            Lo que vas a encontrar en nuestra cocina
          </h3>

          <p className="font-['Open_Sans'] text-[1.1em] leading-relaxed text-[#4a5568] max-md:text-[1.02rem]">
            Desde la dedicación de lavar el arroz durante una hora para lograr el punto perfecto de
            nuestro Kimbap, hasta nuestros Hattogus (de mozzarella o salchicha + cheddar), crocantes
            por fuera y explosivos por dentro, que pasan por un estricto control de calidad antes de
            salir a la mesa. Servidos siempre con tus aderezos y toppings a gusto, como el clásico
            sweet chili o nuestra mayo gochujang con ese picor glorioso que te gusta.
          </p>

          <p className="mt-6 font-['Montserrat'] text-[1.3rem] font-bold text-[#2d3748] max-md:text-[1.05rem]">
            Algo nuevo está naciendo en Corrientes. Y esto… es solo el comienzo.
          </p>
        </div>

        <div className="w-full lg:flex-1">
          <div className="mx-auto w-full max-w-md rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.1)] sm:p-8 lg:mx-0 lg:max-w-none">
            <h3 className="mb-6 text-center font-['Montserrat'] text-[1.8rem] font-bold text-[#2d3748] max-md:text-[1.5rem]">
              Contáctanos
            </h3>

            <div className="mb-6 space-y-5">
              <div className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F2EEE9] text-[#D95A2B] shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
                  <Phone size={20} />
                </span>
                <div>
                  <p className="font-['Open_Sans'] text-sm text-[#4a5568]">
                    Consultas y pedidos{' '}
                    <a href={`tel:${PHONE.replace(/[^\d+]/g, '')}`} className="font-semibold text-[#D94B2B] whitespace-nowrap">
                      {PHONE}
                    </a>
                  </p>
                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-['Open_Sans'] text-sm font-semibold text-[#D94B2B] hover:underline"
                  >
                    Enviar WhatsApp (Pedidos)
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F2EEE9] text-[#D95A2B] shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
                  <Clock size={20} />
                </span>
                <div>
                  <p className="mb-1 font-['Open_Sans'] text-sm font-semibold text-[#4a5568]">
                    Horario de Atención:
                  </p>
                  {weeklySchedule.length > 0 ? (
                    <div className="space-y-0.5">
                      {weeklySchedule.map((d) => (
                        <p key={d.day} className="font-['Open_Sans'] text-sm text-[#4a5568]">
                          <span className="font-semibold">{d.day}:</span>{' '}
                          {d.isStoreOpen && d.ranges?.length
                            ? d.ranges.map((r) => `${r.open} – ${r.close}`).join(' | ')
                            : 'Cerrado'}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="font-['Open_Sans'] text-sm text-[#4a5568]">{SCHEDULE}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F2EEE9] text-[#D95A2B] shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
                  <MapPin size={20} />
                </span>
                <div>
                  <p className="font-['Open_Sans'] text-sm text-[#4a5568]">
                    Ubicados en {ADDRESS}{' '}
                    <a
                      href={GOOGLE_MAPS_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-[#D94B2B] hover:underline"
                    >
                      (Ver en Mapa)
                    </a>
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-4 overflow-hidden rounded-xl">
              <iframe
                src={GOOGLE_MAPS_EMBED}
                width="100%"
                height="280"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Ubicación KOGO"
                className="max-md:h-[200px]"
              />
            </div>

            <a
              href={GOOGLE_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-full bg-[#D94B2B] px-6 py-4 font-['Montserrat'] text-base font-bold uppercase text-white transition-all duration-200 hover:-translate-y-[2px] hover:bg-[#D94B2B]"
            >
              Abrir en Maps
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17l9.2-9.2M17 17V7H7"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
