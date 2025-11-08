import React from 'react'

const Logo = () => {
  return (
    <div>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="340"
        height="200"
        viewBox="0 0 1000 240"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Glow + depth filters */}
          <filter id="neon3D" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur1" />
            <feOffset in="blur1" dx="2" dy="2" result="offset1" />
            <feMerge>
              <feMergeNode in="offset1" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Full Yellow Neon Gradient */}
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFF700" />   {/* bright neon yellow */}
            <stop offset="100%" stopColor="#FFD700" />  {/* golden yellow */}
          </linearGradient>
        </defs>

        <g transform="translate(40,40)" filter="url(#neon3D)">
          {/* BACK SHADOW LAYER */}
          <text
            x="4"
            y="114"
            fontFamily="Segoe UI, Roboto, Helvetica, Arial, sans-serif"
            fontSize="76"
            fontWeight="600"
            letterSpacing="3"
            fill="#111"
            opacity="0.6"
          >
            PLAYLIVE7
          </text>

          {/* MAIN PURE YELLOW GRADIENT */}
          <text
            x="0"
            y="110"
            fontFamily="Segoe UI, Roboto, Helvetica, Arial, sans-serif"
            fontSize="76"
            fontWeight="600"
            letterSpacing="3"
            fill="url(#grad1)"
          >
            PLAYLIVE7/24
          </text>

          {/* WHITE INNER STROKE */}
          <text
            x="0"
            y="110"
            fontFamily="Segoe UI, Roboto, Helvetica, Arial, sans-serif"
            fontSize="76"
            fontWeight="600"
            letterSpacing="3"
            fill="none"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="1"
          >
            PLAYLIVE7/24
          </text>
        </g>

        <title>PlayLive7 — Neon Yellow Futuristic Logo</title>
      </svg>
    </div>
  )
}

export default Logo
