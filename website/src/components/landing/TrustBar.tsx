

const PARTNER_LOGOS = [
  { name: 'Northlight Digital', color: '#10b981' },
  { name: 'Framewright Studio', color: '#3b82f6' },
  { name: 'Launchpad Collective', color: '#8b5cf6' },
  { name: 'Bractive Agency', color: '#f97316' },
  { name: 'Ironview Consulting', color: '#ec4899' },
  { name: 'Solstice Creative', color: '#06b6d4' },
];

const TOOL_LOGOS = [
  { name: 'Framer', color: '#000000' },
  { name: 'Webflow', color: '#4353FF' },
  { name: 'Wix', color: '#000000' },
  { name: '10Web', color: '#06b6d4' },
  { name: 'Durable', color: '#8b5cf6' },
  { name: 'Shopify', color: '#96bf48' },
];

export function TrustBar() {
  return (
    <div className="py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="mx-auto mb-8 max-w-2xl text-center text-sm font-medium text-fg-subtle uppercase tracking-widest">
          Trusted by agencies & built for AI builders
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-8 opacity-50 transition-all duration-300 hover:opacity-100">
          {PARTNER_LOGOS.map((partner) => (
            <span
              key={partner.name}
              className="text-sm font-semibold text-fg-subtle transition-colors duration-200 hover:text-fg"
              style={{ color: partner.color }}
            >
              {partner.name}
            </span>
          ))}
        </div>
        <div className="mt-10 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex flex-wrap items-center justify-center gap-x-8 gap-y-6 opacity-40 transition-all duration-300 hover:opacity-80">
            {TOOL_LOGOS.map((tool) => (
              <span
                key={tool.name}
                className="text-xs font-semibold uppercase tracking-wider text-fg-subtle transition-colors duration-200 hover:text-fg"
                style={{ color: tool.color }}
              >
                {tool.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}