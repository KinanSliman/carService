import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

/**
 * The favicon: the wordmark's wrench on the ink surface. Generated rather than
 * committed as a binary so it stays in step with the logo — and because a
 * missing favicon is the first thing a reviewer's browser tab shows them.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0E1F26',
          borderRadius: 7,
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 28 28"
          fill="none"
          stroke="#F1F4F3"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18.6 9.4a3.9 3.9 0 0 1-4.9 5L9.4 18.7a1.8 1.8 0 1 1-2.5-2.5l4.3-4.3a3.9 3.9 0 0 1 5-4.9l-2.4 2.4.9 2.5 2.5.9z" />
        </svg>
      </div>
    ),
    size,
  );
}
