import { createContext, useContext, useEffect, useState } from 'react'
const ThemeContext = createContext(null)
export function ThemeProvider({ children }) { const [theme,setTheme]=useState(()=>localStorage.getItem('crimelens_theme') || 'dark'); useEffect(()=>{ document.documentElement.classList.toggle('dark',theme==='dark'); localStorage.setItem('crimelens_theme',theme) },[theme]); return <ThemeContext.Provider value={{theme,toggleTheme:()=>setTheme(t=>t==='dark'?'light':'dark')}}>{children}</ThemeContext.Provider> }
export const useTheme = () => useContext(ThemeContext)
