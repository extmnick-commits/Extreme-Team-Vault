'use client'

import { useEffect, useRef } from 'react'

function urlMeta(raw: string) {
  try {
    const parsed = new URL(raw)
    return {
      hostname: parsed.hostname,
      pathname: parsed.pathname,
      queryKeys: [...parsed.searchParams.keys()],
      protocol: parsed.protocol,
    }
  } catch {
    return { hostname: null, pathname: null, queryKeys: [] as string[], protocol: null }
  }
}

export default function LiveRoomFrame({ src }: { src: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const meta = urlMeta(src)
    const isPlaceholder =
      meta.hostname === 'mycustomname.whereby.com' ||
      meta.hostname === 'subdomain.whereby.com'
    const box = iframeRef.current?.getBoundingClientRect()
    // #region agent log
    fetch('http://127.0.0.1:7327/ingest/3521cea2-834c-4a48-92b1-a701ece0381c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4e8c08'},body:JSON.stringify({sessionId:'4e8c08',location:'LiveRoomFrame.tsx:mount',message:'iframe mounted',data:{...meta,isPlaceholder,width:box?.width??0,height:box?.height??0,origin:typeof window!=='undefined'?window.location.origin:null},timestamp:Date.now(),hypothesisId:'A'})}).catch(()=>{});
    // #endregion
  }, [src])

  return (
    <iframe
      ref={iframeRef}
      src={src}
      title="Live training room"
      allow="camera; microphone; fullscreen; speaker; display-capture; autoplay; compute-pressure"
      width="100%"
      height="100%"
      className="block border-0"
      onLoad={() => {
        const box = iframeRef.current?.getBoundingClientRect()
        let frameAccess: string = 'unknown'
        try {
          const href = iframeRef.current?.contentWindow?.location.href
          frameAccess = href ? 'same-origin' : 'no-href'
        } catch {
          frameAccess = 'cross-origin'
        }
        // #region agent log
        fetch('http://127.0.0.1:7327/ingest/3521cea2-834c-4a48-92b1-a701ece0381c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4e8c08'},body:JSON.stringify({sessionId:'4e8c08',location:'LiveRoomFrame.tsx:onLoad',message:'iframe load event',data:{...urlMeta(src),width:box?.width??0,height:box?.height??0,frameAccess},timestamp:Date.now(),hypothesisId:'D'})}).catch(()=>{});
        // #endregion
      }}
      onError={() => {
        // #region agent log
        fetch('http://127.0.0.1:7327/ingest/3521cea2-834c-4a48-92b1-a701ece0381c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4e8c08'},body:JSON.stringify({sessionId:'4e8c08',location:'LiveRoomFrame.tsx:onError',message:'iframe error event',data:urlMeta(src),timestamp:Date.now(),hypothesisId:'E'})}).catch(()=>{});
        // #endregion
      }}
    />
  )
}
