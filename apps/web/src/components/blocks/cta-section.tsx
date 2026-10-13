import { cn } from '@/utils/cn';
import { WhatsappIcon } from '@/components/ui/icons';
import { WHATSAPP_URL } from '@/utils/constants';

export function CTASection({ className = '' }: { className?: string }) {
  return (
    <section
      className={cn('mx-auto mb-20 max-w-[1200px] px-4 text-center', className)}
    >
      <div className="rounded-3xl bg-[#D94B2B] px-8 py-16 text-white shadow-[0_10px_15px_rgba(217,90,43,0.3)]">
        <h2 className="mb-4 font-['Montserrat'] text-[2.5em] font-extrabold max-md:text-[1.8em]">
          ¿Listo para pedir?
        </h2>
        <p className="mb-8 font-['Open_Sans'] text-[1.2em] text-white/90 max-md:text-base">
          Hacé tu pedido ahora y recibilo en la puerta de tu casa.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a
            href="/menu"
            className="inline-block rounded-full border-2 border-white bg-transparent px-8 py-4 font-['Montserrat'] text-lg font-bold uppercase text-white transition-all duration-300 hover:-translate-y-[2px] hover:bg-white hover:text-[#D94B2B]"
          >
            Ver Menú
          </a>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border-2 border-white bg-transparent px-8 py-4 font-['Montserrat'] text-lg font-bold uppercase text-white transition-all duration-300 hover:-translate-y-[2px] hover:bg-white hover:text-[#D94B2B]"
          >
            <WhatsappIcon className="h-5 w-5" />
            WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
