'use client';
import { useEffect, useState } from 'react';

// Registers the service worker (production builds only, so dev never serves a
// stale cache) and tracks how the app can be installed:
// - prompt: the browser's install prompt (Chrome, Edge, Android), or null.
// - installed: true when running as the installed app (or just installed).
// - ios: iPhone/iPad, where installing is Share → Add to Home Screen.
export function usePwa(){
  const [prompt, setPrompt] = useState(null);
  const [installed, setInstalled] = useState(true); // hidden until checked on the client
  const [ios, setIos] = useState(false);
  useEffect(() => {
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator)
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    const standalone = matchMedia('(display-mode: standalone)');
    const check = () => setInstalled(standalone.matches || navigator.standalone === true);
    check();
    setIos(/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
    const onPrompt = e => { e.preventDefault(); setPrompt(e); };
    const onInstalled = () => { setPrompt(null); setInstalled(true); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    standalone.addEventListener('change', check);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
      standalone.removeEventListener('change', check);
    };
  }, []);
  // Resolves to true when the user accepted the browser's prompt.
  const promptInstall = async () => {
    if (!prompt) return false;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    setPrompt(null);
    return outcome === 'accepted';
  };
  return { canPrompt: !!prompt, promptInstall, installed, ios };
}

// Shown when the browser has no install prompt to open.
export function InstallHelp({ ios }){
  const steps = ios
    ? [<>Open this site in <b>Safari</b>.</>, <>Tap the <b>Share</b> button (the square with an arrow).</>, <>Choose <b>Add to Home Screen</b>, then <b>Add</b>.</>]
    : [<>Open the browser menu (<b>⋮</b> or <b>…</b>).</>, <>Choose <b>Install app</b>, <b>Install Sala SMS</b> or <b>Add to Home screen</b>.</>, <>Confirm. The app then opens from your home screen or app list.</>];
  return <>
    <p style={{marginTop:0}}>Install Sala SMS to open it like an app, full screen and with its own icon.</p>
    <ol className="steps">{steps.map((s,i) => <li key={i}>{s}</li>)}</ol>
    {!ios && <p className="small muted">Installing needs the secure (https) site. If the option is missing, try Chrome or Edge.</p>}
  </>;
}
