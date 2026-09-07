import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Karaj — car servicing in Qatar';

/**
 * The link preview.
 *
 * This is the first thing anyone sees — before the site, and often instead of
 * it, since most people never open the link. It reuses the car diagram's
 * blueprint language rather than showing a screenshot, because a screenshot
 * scaled to 1200×630 is unreadable in a chat window.
 *
 * Deliberately no webfont fetch: `next/og` would need the font binary loaded
 * per render, and the Arabic wordmark is drawn as part of the artwork instead.
 */
export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isAr = locale === 'ar';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#F1F4F3',
          padding: 72,
          fontFamily: 'sans-serif',
        }}
      >
        {/* Blueprint grid, matching the diagram's backdrop. */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(#D8DEDC 1px, transparent 1px), linear-gradient(90deg, #D8DEDC 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            opacity: 0.5,
            display: 'flex',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <svg width="56" height="56" viewBox="0 0 28 28" fill="none" stroke="#0E1F26" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="14" cy="14" r="12.2" opacity="0.25" />
            <path d="M18.6 9.4a3.9 3.9 0 0 1-4.9 5L9.4 18.7a1.8 1.8 0 1 1-2.5-2.5l4.3-4.3a3.9 3.9 0 0 1 5-4.9l-2.4 2.4.9 2.5 2.5.9z" />
          </svg>
          <div style={{ fontSize: 44, fontWeight: 700, color: '#0E1F26' }}>
            {isAr ? 'كراج' : 'Karaj'}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div
            style={{
              fontSize: 68,
              fontWeight: 700,
              color: '#0E1F26',
              lineHeight: 1.15,
              maxWidth: 900,
              display: 'flex',
            }}
          >
            {isAr
              ? 'احجز صيانة سيارتك في أقل من دقيقة'
              : "Book your car's service in under a minute"}
          </div>
          <div style={{ fontSize: 30, color: '#5D6E73', display: 'flex' }}>
            {isAr
              ? 'اختر الجزء من رسم السيارة — أو ابدأ من العَرَض'
              : 'Point at the part — or start from the symptom'}
          </div>
        </div>

        {/* The car itself, at the foot of the card. */}
        <svg width="1056" height="200" viewBox="0 0 600 260" fill="none" style={{ marginBottom: -30 }}>
          <path
            d="M64 188 C56 182 52 170 54 156 C56 140 66 132 82 128 L150 118 C170 100 196 90 232 88 L330 88 C366 88 392 96 412 112 L470 132 C500 140 520 150 528 164 C534 174 534 182 530 188 L486 188 A38 38 0 0 1 410 188 L232 188 A38 38 0 0 1 156 188 Z"
            stroke="#0E1F26"
            strokeWidth="2.6"
            strokeLinejoin="round"
          />
          <circle cx="448" cy="188" r="38" stroke="#0E1F26" strokeWidth="2.6" />
          <circle cx="448" cy="188" r="19" stroke="#0E1F26" strokeWidth="1.8" />
          <circle cx="194" cy="188" r="38" stroke="#0E1F26" strokeWidth="2.6" />
          <circle cx="194" cy="188" r="19" stroke="#0E1F26" strokeWidth="1.8" />
          <path d="M176 116 C196 102 218 96 244 96 L318 96 L322 116 Z" stroke="#5D6E73" strokeWidth="1.8" />
          <path d="M336 96 L372 98 C390 104 402 112 412 124 L340 116 Z" stroke="#5D6E73" strokeWidth="1.8" />
          {/* Hotspots, in the marker yellow they use in the product. */}
          <circle cx="462" cy="142" r="8" fill="#F2B705" stroke="#0E1F26" strokeWidth="2.4" />
          <circle cx="296" cy="118" r="8" fill="#FFFFFF" stroke="#0E1F26" strokeWidth="2.4" />
          <circle cx="112" cy="152" r="8" fill="#FFFFFF" stroke="#0E1F26" strokeWidth="2.4" />
        </svg>
      </div>
    ),
    size,
  );
}
