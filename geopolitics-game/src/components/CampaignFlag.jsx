const FLAG_ART = {
  DZ: (
    <>
      <rect width="30" height="40" fill="#006233" />
      <rect x="30" width="30" height="40" fill="#fff" />
      <path d="M37 9a12 12 0 1 0 0 22 10 10 0 1 1 0-22" fill="#d21034" />
      <path d="m43 15 1.8 5.5h5.8l-4.7 3.4 1.8 5.5-4.7-3.4-4.7 3.4 1.8-5.5-4.7-3.4h5.8z" fill="#d21034" />
    </>
  ),
  CD: (
    <>
      <rect width="60" height="40" fill="#007fff" />
      <path d="M-5 41 52-2h15L8 42z" fill="#f7d618" />
      <path d="M-3 40 51-1h11L5 41z" fill="#ce1021" />
      <path d="m13 4 2.4 7.3h7.7l-6.2 4.5 2.4 7.3-6.3-4.5L7 23l2.4-7.3-6.2-4.5h7.7z" fill="#f7d618" />
    </>
  ),
  EG: (
    <>
      <rect width="60" height="13.34" fill="#ce1126" />
      <rect y="13.33" width="60" height="13.34" fill="#fff" />
      <rect y="26.66" width="60" height="13.34" fill="#000" />
      <path d="m27 17 6 1 6-1-2 2 1 5-5 2-5-2 1-5z" fill="#c09300" />
      <path d="M29 20h6v5h-6zM26 19h2v6h-2zm10 0h2v6h-2z" fill="#c09300" />
    </>
  ),
  ET: (
    <>
      <rect width="60" height="13.34" fill="#078930" />
      <rect y="13.33" width="60" height="13.34" fill="#fedd00" />
      <rect y="26.66" width="60" height="13.34" fill="#da121a" />
      <circle cx="30" cy="20" r="7" fill="#0f47af" />
      <path d="m30 13.5 1.8 5.2 5.5-.1-4.5 3.3 1.8 5.2-4.6-3.2-4.5 3.2 1.7-5.2-4.5-3.3 5.6.1z" fill="#fedd00" />
    </>
  ),
  GH: (
    <>
      <rect width="60" height="13.34" fill="#ce1126" />
      <rect y="13.33" width="60" height="13.34" fill="#fcd116" />
      <rect y="26.66" width="60" height="13.34" fill="#006b3f" />
      <path d="m30 12 2.4 6.1 6.5.3-5 4 1.7 6.3-5.6-3.6-5.6 3.6 1.7-6.3-5-4 6.5-.3z" fill="#000" />
    </>
  ),
  KE: (
    <>
      <rect width="60" height="9" fill="#000" />
      <rect y="9" width="60" height="3" fill="#fff" />
      <rect y="12" width="60" height="16" fill="#bb0000" />
      <rect y="28" width="60" height="3" fill="#fff" />
      <rect y="31" width="60" height="9" fill="#006600" />
      <path d="M30 10c-12 5-12 15 0 21 12-6 12-16 0-21z" fill="#fff" />
      <path d="M30 12c-9 4-9 13 0 17 9-4 9-13 0-17z" fill="#bb0000" />
      <path d="M30 13v15M25 14v13m10-13v13" stroke="#000" strokeWidth="2" />
      <path d="m16 13 3-3m25 3-3-3M16 27l3 3m25-3-3 3" stroke="#fff" strokeWidth="1.5" />
    </>
  ),
  MA: (
    <>
      <rect width="60" height="40" fill="#c1272d" />
      <path d="m30 8 3.5 10.2h10.7l-8.7 6.3 3.3 10.2-8.8-6.3-8.8 6.3 3.3-10.2-8.7-6.3h10.7z" fill="none" stroke="#006233" strokeWidth="1.8" />
    </>
  ),
  NG: (
    <>
      <rect width="20" height="40" fill="#008751" />
      <rect x="20" width="20" height="40" fill="#fff" />
      <rect x="40" width="20" height="40" fill="#008751" />
    </>
  ),
  ZA: (
    <>
      <rect width="60" height="20" fill="#de3831" />
      <rect y="20" width="60" height="20" fill="#002395" />
      <path d="M0 8h60v4H0zm0 20h60v4H0z" fill="#fff" />
      <path d="M0 0 30 20 0 40z" fill="#ffb612" />
      <path d="M0 3 26 20 0 37z" fill="#000" />
      <path d="M0 7 20 20 0 33" fill="none" stroke="#fff" strokeWidth="11" />
      <path d="M0 7 20 20 0 33" fill="none" stroke="#ffb612" strokeWidth="7" />
      <path d="M0 7 20 20 0 33" fill="none" stroke="#007a4d" strokeWidth="4" />
    </>
  ),
  TZ: (
    <>
      <rect width="60" height="40" fill="#00a3dd" />
      <path d="M0 0h60L0 40z" fill="#1eb53a" />
      <path d="M-3 34 49-2h14L3 43z" fill="#fcd116" />
      <path d="M-1 35 50-1h10L4 41z" fill="#000" />
    </>
  )
};

export default function CampaignFlag({ countryId, className = '' }) {
  return (
    <svg
      viewBox="0 0 60 40"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={`block overflow-hidden rounded-[3px] ${className}`}
    >
      {FLAG_ART[countryId] || <rect width="60" height="40" fill="#64748b" />}
    </svg>
  );
}
