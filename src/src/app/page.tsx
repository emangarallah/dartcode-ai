'use client';
import {useEffect,useState} from 'react';
import {Code2,Sparkles,BrainCircuit,GraduationCap,Zap,ExternalLink,LoaderCircle,Copy,Check} from 'lucide-react';
type Mode='coach'|'direct';
export default function Home(){
 const [problem,setProblem]=useState('');const [url,setUrl]=useState('');const [language,setLanguage]=useState('dart');const [difficulty,setDifficulty]=useState('medium');const [mode,setMode]=useState<Mode>('coach');const [answer,setAnswer]=useState('');const [loading,setLoading]=useState(false);const [error,setError]=useState('');const [clientId,setClientId]=useState('');
 useEffect(()=>{let id=localStorage.getItem('dartcode-client-id');if(!id){id=crypto.randomUUID();localStorage.setItem('dartcode-client-id',id)}setClientId(id)},[]);
 async function solve(){if(!problem.trim()){setError('أدخل نص المسألة أولاً.');return}setLoading(true);setError('');setAnswer('');try{const res=await fetch('/api/solve',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({problem,url,language,difficulty,mode,clientId})});const data=await res.json();if(!res.ok)throw new Error(data.error||'تعذر توليد الحل.');setAnswer(data.answer||'')}catch(e){setError(e instanceof Error?e.message:'حدث خطأ أثناء الاتصال.')}finally{setLoading(false)}}
 async function copyAnswer(){if(answer)await navigator.clipboard.writeText(answer)}
 return <main className="shell">
 <nav className="nav"><div className="brand"><div ���q�^