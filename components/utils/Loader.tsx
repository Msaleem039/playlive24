'use client'

interface LoaderProps {
  className?: string
  size?: number
}

export default function Loader({ className = '', size = 30 }: LoaderProps) {
  const R = size
  const width = 2 * R

  return (
    <>
      <div 
        className={`bet-loader ${className}`}
        style={{
          '--R': `${R}px`,
          width: `${width}px`,
          aspectRatio: '1',
          borderRadius: '50%',
          display: 'grid',
          WebkitMask: 'linear-gradient(#000 0 0)',
          mask: 'linear-gradient(#000 0 0)',
          animation: 'l30 2s infinite linear'
        } as React.CSSProperties & { '--R': string }}
      />
      <style dangerouslySetInnerHTML={{
        __html: `
          .bet-loader {
            --g1: #514b82 96%, #0000;
            --g2: #eeeeee 96%, #0000;
          }
          .bet-loader::before,
          .bet-loader::after {
            content: "";
            grid-area: 1/1;
            width: 50%;
            background:
              radial-gradient(farthest-side, var(--g1)) calc(var(--R) + 0.866*var(--R) - var(--R)) calc(var(--R) - 0.5*var(--R) - var(--R)),
              radial-gradient(farthest-side, var(--g1)) calc(var(--R) + 0.866*var(--R) - var(--R)) calc(var(--R) - 0.5*var(--R) - var(--R)),
              radial-gradient(farthest-side, var(--g2)) calc(var(--R) + 0.5*var(--R) - var(--R)) calc(var(--R) - 0.866*var(--R) - var(--R)),
              radial-gradient(farthest-side, var(--g1)) 0 calc(-1*var(--R)),
              radial-gradient(farthest-side, var(--g2)) calc(var(--R) - 0.5*var(--R) - var(--R)) calc(var(--R) - 0.866*var(--R) - var(--R)),
              radial-gradient(farthest-side, var(--g1)) calc(var(--R) - 0.866*var(--R) - var(--R)) calc(var(--R) - 0.5*var(--R) - var(--R)),
              radial-gradient(farthest-side, var(--g2)) calc(-1*var(--R)) 0,
              radial-gradient(farthest-side, var(--g1)) calc(var(--R) - 0.866*var(--R) - var(--R)) calc(var(--R) + 0.5*var(--R) - var(--R));
            background-size: calc(2*var(--R)) calc(2*var(--R));
            background-repeat: no-repeat;
          }
          .bet-loader::after {
            transform: rotate(180deg);
            transform-origin: right;
          }
          @keyframes l30 {
            100% { transform: rotate(-1turn); }
          }
        `
      }} />
    </>
  )
}
