import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'transparent',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#dc2626', // red-600
        }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: 32, height: 32 }}
        >
          <path
            d="M12 22C12 22 17 18 17 13C17 10.7909 15.2091 9 13 9C12.35 9 11.75 9.15 11.22 9.42C10.78 8.01 9.5 7 8 7C6.067 7 4.5 8.567 4.5 10.5C4.5 11.5 5 12.35 5.75 12.91C4.38 13.5 3.5 14.89 3.5 16.5C3.5 18.9853 5.51472 21 8 21C9.64 21 11.07 20.12 11.85 18.82L12 19L12.15 18.82C12.93 20.12 14.36 21 16 21C18.4853 21 20.5 18.9853 20.5 16.5C20.5 14.89 19.62 13.5 18.25 12.91C19 12.35 19.5 11.5 19.5 10.5C19.5 8.567 17.933 7 16 7C14.5 7 13.22 8.01 12.78 9.42C12.25 9.15 11.65 9 11 9C8.79086 9 7 10.7909 7 13C7 18 12 22 12 22Z"
            fill="currentColor"
          />
          <circle cx="12" cy="13" r="1.5" fill="white" fillOpacity="0.8" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
