export const LMS_BACKGROUND_SVG = `
<svg width="1200" height="1200" viewBox="0 0 1200 1200" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g1" x1="0" y1="0" x2="1200" y2="1200" gradientUnits="userSpaceOnUse">
      <stop stop-color="#F97316" stop-opacity="0.18"/>
      <stop offset="1" stop-color="#F97316" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="g2" x1="1200" y1="0" x2="0" y2="1200" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FFFFFF" stop-opacity="0.10"/>
      <stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <!-- soft glow -->
  <circle cx="260" cy="240" r="260" fill="url(#g1)"/>
  <circle cx="980" cy="920" r="360" fill="url(#g2)"/>

  <!-- abstract "campus" blocks -->
  <g opacity="0.22" stroke="#FFFFFF" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">
    <path d="M160 860V560L360 480L560 560V860" />
    <path d="M240 860V620" />
    <path d="M320 860V600" />
    <path d="M400 860V620" />
    <path d="M480 860V660" />
    <path d="M160 560L360 640L560 560" />
  </g>

  <!-- book + graduation cap -->
  <g opacity="0.18" stroke="#F97316" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">
    <path d="M760 520C820 480 900 480 960 520V820C900 780 820 780 760 820V520Z" />
    <path d="M760 520C700 480 620 480 560 520V820C620 780 700 780 760 820" />
    <path d="M620 610H700" />
    <path d="M620 680H720" />
    <path d="M620 750H690" />

    <path d="M770 360L920 420L770 480L620 420L770 360Z" />
    <path d="M920 420V510" />
    <path d="M885 505C885 540 835 565 770 565C705 565 655 540 655 505" />
  </g>

  <!-- small dots -->
  <g opacity="0.22" fill="#FFFFFF">
    <circle cx="820" cy="160" r="6"/>
    <circle cx="860" cy="200" r="5"/>
    <circle cx="900" cy="150" r="4"/>
    <circle cx="1030" cy="220" r="5"/>
    <circle cx="980" cy="260" r="4"/>
    <circle cx="140" cy="240" r="5"/>
    <circle cx="180" cy="280" r="4"/>
    <circle cx="120" cy="320" r="4"/>
  </g>
</svg>
`;

