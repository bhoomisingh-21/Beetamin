import Script from 'next/script'

const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim()
const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID?.trim()
const ahrefsKey =
  process.env.NEXT_PUBLIC_AHREFS_ANALYTICS_KEY?.trim() ?? 'eYgU9ROqNXH0iR+6UTsSkQ'

/** Ahrefs expects the script tag in `<head>` for installation verification. */
export function AhrefsAnalyticsHead() {
  if (!ahrefsKey) return null

  return (
    // eslint-disable-next-line @next/next/no-sync-scripts
    <script src="https://analytics.ahrefs.com/analytics.js" data-key={ahrefsKey} async />
  )
}

export function AnalyticsScripts() {
  return (
    <>
      {gaId ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}', { send_page_view: true });
            `}
          </Script>
        </>
      ) : null}
      {clarityId ? (
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${clarityId}");
          `}
        </Script>
      ) : null}
    </>
  )
}
