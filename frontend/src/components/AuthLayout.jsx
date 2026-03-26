export const AuthLayout = ({ title, description, asideTitle, asideCopy, highlights = [], children, footer }) => (
  <div className="relative min-h-screen overflow-hidden bg-neutral-950">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.35),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(34,197,94,0.24),transparent_25%)]" />
    <div className="relative grid min-h-screen lg:grid-cols-[1.08fr_0.92fr]">
      <aside className="hidden px-10 py-10 lg:flex lg:flex-col lg:justify-between">
        <div className="glass-panel relative overflow-hidden rounded-[36px] border-white/10 bg-white/8 p-10 text-white">
          <div className="absolute inset-x-10 top-0 h-px bg-white/30" />
          <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white/90">
            <img src="/logo.png" alt="Inventory Pro" className="h-8 w-8 rounded-xl object-cover" />
            Inventory Pro
          </div>
          <div className="mt-14 space-y-6">
            <h1 className="max-w-xl text-5xl font-semibold leading-tight text-white">{asideTitle}</h1>
            <p className="max-w-lg text-base leading-7 text-white/75">{asideCopy}</p>
          </div>
          <div className="mt-12 grid gap-4">
            {highlights.map((item) => (
              <div key={item.title} className="rounded-[28px] border border-white/12 bg-white/10 p-5">
                <p className="mb-1 text-sm font-semibold text-white">{item.title}</p>
                <p className="mb-0 text-sm text-white/70">{item.description}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[28px] border border-white/12 bg-white/10 p-5">
              <p className="mb-1 text-3xl font-semibold text-white">99.9%</p>
              <p className="mb-0 text-sm text-white/70">Inventory uptime for business-critical teams</p>
            </div>
            <div className="rounded-[28px] border border-white/12 bg-white/10 p-5">
              <p className="mb-1 text-3xl font-semibold text-white">4x</p>
              <p className="mb-0 text-sm text-white/70">Faster stock tracking from receiving to checkout</p>
            </div>
          </div>
        </div>
      </aside>
      <main className="flex items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
        <div className="glass-panel w-full max-w-xl rounded-[36px] p-6 sm:p-8">
          <div className="mb-8 space-y-2">
            <h2 className="text-3xl font-semibold text-neutral-950">{title}</h2>
            <p className="text-sm text-neutral-500">{description}</p>
          </div>
          {children}
          {footer ? <div className="mt-8 border-t border-neutral-100 pt-6">{footer}</div> : null}
        </div>
      </main>
    </div>
  </div>
);
