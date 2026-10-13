import { MapPin, Phone, Clock } from 'lucide-react';
import { cn } from '@/utils/cn';
import {
  ADDRESS,
  PHONE,
  WHATSAPP_URL,
  GOOGLE_MAPS_EMBED,
  GOOGLE_MAPS_URL,
  SCHEDULE,
  FOUNDATION_YEAR,
  FOUNDER,
} from '@/utils/constants';

export function AboutSection({ className = '' }: { className?: string }) {
  return (
    <section
      className={cn(
        'mx-auto mb-20 max-w-[1200px] rounded-3xl bg-white px-6 py-20 shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.05)] max-md:mb-12 max-md:px-6 max-md:py-10',
        className
      )}
    >
      <div className="flex gap-12 max-md:flex-col max-md:gap-8">
        <div className="flex-[2]">
          <h2 className="mb-6 font-['Montserrat'] text-[2.5rem] font-extrabold text-[#2d3748] max-md:text-center max-md:text-[1.6rem] max-md:leading-tight">
           BIENVENIDOS A CHEEPERS THE BURGUER HOUSE, LA MEJOR CALIDAD AL MEJOR PRECIO
          </h2>
          
          <div className="mb-8 space-y-4">
            <p className="font-['Open_Sans'] text-[1.1em] leading-relaxed text-[#4a5568] max-md:text-left max-md:text-[1.05em]">
              Fundado en {FOUNDATION_YEAR} por {FOUNDER}, Cheepers nació con una idea clara:
              ofrecer comida rápida rica, accesible y sin vueltas.
            </p>

            <p className="font-['Open_Sans'] text-[1.1em] leading-relaxed text-[#4a5568] max-md:text-left max-md:text-[1.05em]">
              Actualmente contamos con una sucursal en Resistencia, Chaco, y aunque el camino no
              siempre fue fácil, seguimos avanzando con determinación. Este año apostamos fuerte
              por nuestro crecimiento, y por eso lanzamos esta nueva página web: como parte de
              una estrategia renovada que nos permita dar finalmente el salto que tanto deseamos.
              Nuestra filosofía es simple: alta calidad a precios bajos. Creemos firmemente que
              disfrutar de una buena hamburguesa no debería ser un lujo.
            </p>
          </div>

          <h3 className="mb-4 font-['Montserrat'] text-[1.8rem] font-bold text-[#e53e3e] max-md:text-center">
            ¿Y el nombre Cheepers?
          </h3>

          <p className="font-['Open_Sans'] text-[1.1em] leading-relaxed text-[#4a5568] max-md:text-left max-md:text-[1.05em]">
          Es una de las preguntas que más nos hacen. La verdad es que no tiene una historia compleja, pero sí mucha personalidad. Surge de una mezcla casual de palabras: "cheep", una variación de chips (papas fritas en inglés), terminó evolucionando hasta convertirse en Cheepers. Nos gustó cómo sonaba... y se quedó.
          </p>
        </div>

        <div className="flex-1">
          <div className="rounded-2xl bg-white p-8 shadow-[0_10px_30px_rgba(0,0,0,0.1)]">
            <h3 className="mb-6 text-center font-['Montserrat'] text-[1.8rem] font-bold text-[#2d3748]">
              Contáctanos
            </h3>

            <div className="mb-6 space-y-5">
              <div className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FDFDF5] text-[#e53e3e] shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
                  <Phone size={20} />
                </span>
                <div>
                  <p className="font-['Open_Sans'] text-sm text-[#4a5568]">
                    Consultas y pedidos{' '}
                    <a href={`tel:${PHONE.replace(/\s/g, '')}`} className="font-semibold text-[#c53030]">
                      {PHONE}
                    </a>
                  </p>
                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-['Open_Sans'] text-sm font-semibold text-[#c53030] hover:underline"
                  >
                    Enviar WhatsApp (Pedidos)
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FDFDF5] text-[#e53e3e] shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
                  <Clock size={20} />
                </span>
                <div>
                  <p className="mb-1 font-['Open_Sans'] text-sm font-semibold text-[#4a5568]">
                    Horario de Atención:
                  </p>
                  <p className="font-['Open_Sans'] text-sm text-[#4a5568]">{SCHEDULE}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FDFDF5] text-[#e53e3e] shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
                  <MapPin size={20} />
                </span>
                <div>
                  <p className="font-['Open_Sans'] text-sm text-[#4a5568]">
                    Ubicados en {ADDRESS}{' '}
                    <a
                      href={GOOGLE_MAPS_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-[#c53030] hover:underline"
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
                title="Ubicación Cheepers"
                className="max-md:h-[200px]"
              />
            </div>

            <a
              href={GOOGLE_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-full bg-[#c53030] px-6 py-4 font-['Montserrat'] text-base font-bold uppercase text-white transition-all duration-200 hover:-translate-y-[2px] hover:bg-[#a82828]"
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
