import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import type { Symptom } from '@/db/schema';
import { chipClass } from '@/components/ui/primitives';
import { SymptomIcon } from './symptom-icon';
import { cn } from '@/lib/cn';

/**
 * The second navigation model: what the driver notices, rather than what the
 * part is called. It is a scroll-snap rail of links — server-rendered, no
 * client JS, and crawlable, which the diagram cannot be.
 */
export async function SymptomRail({ symptoms }: { symptoms: Symptom[] }) {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations('symptoms');

  return (
    <div className="rail bleed gap-2 pb-2">
      {symptoms.map((symptom) => (
        <Link
          key={symptom.id}
          href={`/symptoms/${symptom.slug}`}
          className={chipClass(false, 'h-11 ps-3 pe-4')}
        >
          <SymptomIcon iconKey={symptom.iconKey} className="text-steel size-4 shrink-0" />
          <span>{locale === 'ar' ? symptom.labelAr : symptom.labelEn}</span>
          {/* Urgency 3 is the only thing on this rail allowed to use --marker:
              it is the one that means "do not drive on it". */}
          {symptom.urgency === 3 && (
            <span
              className={cn('bg-marker size-1.5 rounded-chip')}
              title={t('urgency3')}
              aria-label={t('urgency3')}
              role="img"
            />
          )}
        </Link>
      ))}
    </div>
  );
}
