'use client';

import { useEffect, useRef, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Link, usePathname } from '@/i18n/navigation';

/**
 * A dialog rather than a slide-over panel, so the browser handles the focus
 * trap, the inert background and Escape. The one thing `<dialog>` does not do
 * is close on a backdrop click, which is added below.
 */
export function MobileMenu({
  label,
  closeLabel,
  links,
}: {
  label: string;
  closeLabel: string;
  links: readonly { href: string; label: string }[];
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Navigating with the sheet open leaves it open over the new page.
  useEffect(() => {
    ref.current?.close();
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => {
          ref.current?.showModal();
          setOpen(true);
        }}
        className="press hover:bg-ink-8 rounded-input -ms-2 grid size-10 place-items-center sm:hidden"
      >
        <Menu className="size-5" aria-hidden />
      </button>

      <dialog
        ref={ref}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          // The dialog element itself fills the viewport; a click that lands on
          // it rather than on the panel inside is a backdrop click.
          if (event.target === ref.current) ref.current?.close();
        }}
        className="bg-surface text-ink shadow-e3 m-0 h-dvh w-[min(20rem,85vw)] max-w-none p-0 backdrop:bg-ink/40 me-auto ms-0"
      >
        <div className="flex h-full flex-col p-5">
          <div className="mb-6 flex items-center justify-between">
            <span className="text-2xs text-steel font-semibold">{label}</span>
            <button
              type="button"
              aria-label={closeLabel}
              onClick={() => ref.current?.close()}
              className="press hover:bg-ink-8 rounded-input -me-2 grid size-10 place-items-center"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
          <nav className="flex flex-col">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="press hover:bg-ink-8 rounded-input -mx-2 px-2 py-3 text-lg font-semibold"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </dialog>
    </>
  );
}
