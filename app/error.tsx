'use client'
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="shell section"><div className="content-panel"><h1>A little pause.</h1><p>We couldn’t complete that request. Your last action may not have been saved. Please try again.</p><button className="button primary" onClick={reset}>Try again</button></div></main>}
