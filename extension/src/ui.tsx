import type {ReactNode} from 'react';
import {ShieldCheck} from 'lucide-react';
export function Header({title='CyberLens Shield'}:{title?:string}){return <header className="mb-4 flex items-center gap-3"><ShieldCheck className="text-cyan-400"/><div><h1 className="text-sm font-semibold">{title}</h1><p className="font-mono text-[9px] tracking-widest text-slate-400">CYBER INTELLIGENCE · INDIA</p></div></header>}
export function Notice({children}:{children:ReactNode}){return <p role="status" className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-xs leading-6 text-amber-200">{children}</p>}
