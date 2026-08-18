import Script from 'next/script'

const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim()
const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID?.trim()
const ahrefsKey =
  process.env.NEXT_PUBLIC_AHREFS_ANALYTICS_KEY?.trim() ?? 'eYgU9ROqNXH0iR+6UTsSkQ'
const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() ?? '1927548154604288'

/** Meta Pixel base code — `beforeInteractive` so fbq exists on first paint (Pixel Helper / Meta verification). */
export function MetaPixelHead() {
  if (!metaPixelId) return null

  return (
    <Script id="meta-pixel" strategy="beforeInteractive">
      {`
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${metaPixelId}');
        fbq('track', 'PageView');
      `}
    </Script>
  )
}

export function MetaPixelNoscript() {
  if (!metaPixelId) return null

  return (
    <noscript>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        height="1"
        width="1"
        style={{ display: 'none' }}
        src={`https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1`}
        alt=""
      />
    </noscript>
  )
}

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
