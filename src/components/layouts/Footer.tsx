// import { Marquee } from '#/components/ui/marquee'

const FOOTER_COLS = [
  {
    title: 'Shop',
    links: [
      'All Products',
      'Figurines',
      'Utility',
      'Home & Decor',
      'New Arrivals',
    ],
  },
  {
    title: 'Custom Print',
    links: [
      'Upload Model',
      'Get a Quote',
      'Materials',
      'Finishes',
      'Bulk Orders',
    ],
  },
  {
    title: 'Company',
    links: ['About', 'Contact', 'Instagram', 'Tokopedia', 'Shopee'],
  },
  {
    title: 'Help',
    links: ['FAQ', 'Shipping Info', 'Returns', 'Print Guide', 'Track Order'],
  },
]

export function Footer() {
  return (
    <footer className="bg-ink text-paper mt-16 sm:mt-20 lg:mt-30">
      {/* Marquee ticker */}
      {/* <div className="border-y border-[#2A2014] py-3.5 overflow-hidden">
        <Marquee
          className="h-display text-[26px] tracking-[-0.02em] p-0 [--gap:2.5rem] [--duration:40s]"
          // pauseOnHover
          repeat={3}
        >
          <span className="inline-flex items-center gap-10">
            <span>FROM PIXEL TO PHYSICAL</span>
            <span className="text-gold">★</span>
            <span>PRINTED IN 24H</span>
            <span className="text-sky">◆</span>
            <span>MADE IN INDONESIA</span>
            <span className="text-gold">★</span>
            <span>UPLOAD · QUOTE · PRINT · SHIP</span>
            <span className="text-sky">◆</span>
          </span>
        </Marquee>
      </div> */}

      {/* Main grid */}
      <div className="mx-auto max-w-360 px-8 py-16 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-10 lg:gap-12">
        {/* Brand */}
        <div className="flex flex-col gap-4 col-span-2 sm:col-span-3 lg:col-span-1">
          <div className="flex items-center gap-2.5">
            <svg width={36} height={36} viewBox="0 0 40 40" fill="none">
              <rect x="2" y="2" width="36" height="36" rx="10" fill="#FFC23C" />
              <rect x="9" y="10" width="3.2" height="20" fill="#16110A" />
              <rect x="27.8" y="10" width="3.2" height="20" fill="#5BB8FF" />
              <rect x="9" y="18.5" width="22" height="3" fill="#16110A" />
            </svg>
            <span className="h-display text-paper text-2xl">Horizon 3D</span>
          </div>
          <p className="text-sm leading-relaxed max-w-xs text-paper/60">
            From idea to held-in-hand. Upload any model, get an instant quote,
            and we'll print and ship it within 24 hours.
          </p>
        </div>

        {/* Link columns */}
        {FOOTER_COLS.map((col) => (
          <div key={col.title} className="flex flex-col gap-3">
            <p className="t-eyebrow text-gold">{col.title}</p>
            <ul className="flex flex-col gap-2 list-none p-0 m-0">
              {col.links.map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-sm text-paper/60 transition-colors hover:text-paper no-underline"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="mx-auto max-w-360 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 px-8 py-5 border-t border-[#2A2014] t-mono text-xs text-paper/40">
        <span>
          © {new Date().getFullYear()} HORIZON 3D PRINT — JAKARTA · INDONESIA
        </span>
        <span>
          ALL SYSTEMS NOMINAL{' '}
          <span className="text-(--success) animate-[blink_2s_infinite]">
            ●
          </span>
        </span>
      </div>
    </footer>
  )
}
