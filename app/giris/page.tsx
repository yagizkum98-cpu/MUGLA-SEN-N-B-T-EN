'use client'

import {FormEvent,useState} from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {ArrowLeft,BadgeCheck,LockKeyhole,ShieldCheck,UserPlus} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {createClient} from '@/lib/supabase/client'
import {loginUser,registerUser,type VerificationMethod} from '@/lib/local-auth'
import {muglaDistricts} from '@/lib/locations'

const field='w-full rounded-2xl border border-mugla-navy/15 bg-white px-4 py-3.5 outline-none focus:border-mugla-cyan focus:ring-4 focus:ring-mugla-cyan/10'
const verificationMethods:{value:VerificationMethod;label:string;note:string}[]=[
  {value:'phone',label:'Telefon SMS OTP',note:'Demo kod: 123456'},
  {value:'email',label:'E-posta dogrulama',note:'Demo kod: 123456'},
  {value:'passport',label:'Pasaport',note:'Yabanci kullanici kimlik referansi'},
  {value:'international-id',label:'Uluslararasi kimlik',note:'Yabanci kullanici kimlik referansi'},
]

function nextPage(){
  if(typeof location==='undefined')return'/vatandas/panel'
  const requested=new URLSearchParams(location.search).get('next')??'/vatandas/panel'
  return requested.startsWith('/')&&!requested.startsWith('//')?requested:'/vatandas/panel'
}

export default function Login(){
  const[mode,setMode]=useState<'login'|'register'>('register')
  const[loading,setLoading]=useState('')
  const[error,setError]=useState('')
  const[message,setMessage]=useState('')
  const[loginEmail,setLoginEmail]=useState('')
  const[verificationMethod,setVerificationMethod]=useState<VerificationMethod>('phone')

  function changeMode(value:'login'|'register'){setMode(value);setError('');setMessage('')}

  async function register(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setError('');setMessage('')
    const form=event.currentTarget
    const data=new FormData(form)
    const password=String(data.get('password'))
    const repeat=String(data.get('repeat'))
    if(password.length<8){setError('Sifre en az 8 karakter olmalidir.');return}
    if(password!==repeat){setError('Sifreler birbiriyle eslesmiyor.');return}
    setLoading('register')
    try{
      const email=String(data.get('email'))
      await registerUser({
        name:String(data.get('name')),
        email,
        phone:String(data.get('phone')),
        district:String(data.get('district')),
        password,
        verificationMethod,
        verificationCode:String(data.get('verificationCode')??''),
        identityReference:String(data.get('identityReference')??''),
        botAnswer:String(data.get('botAnswer')??''),
        website:String(data.get('website')??''),
      })
      setLoginEmail(email)
      form.reset()
      setVerificationMethod('phone')
      setMode('login')
      setMessage('Kayit tamamlandi. ✔ Dogrulanmis Kullanici rozeti tanimlandi. Simdi e-posta ve sifrenizle giris yapin.')
    }catch(cause){setError(cause instanceof Error?cause.message:'Kayit olusturulamadi.')}
    finally{setLoading('')}
  }

  async function login(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setError('');setMessage('');setLoading('login')
    const data=new FormData(event.currentTarget)
    try{await loginUser(String(data.get('email')),String(data.get('password')));location.href=nextPage()}
    catch(cause){setError(cause instanceof Error?cause.message:'Giris yapilamadi.')}
    finally{setLoading('')}
  }

  async function google(){
    setError('');setLoading('google')
    try{
      const next=nextPage()
      const supabase=createClient()
      const{error}=await supabase.auth.signInWithOAuth({provider:'google',options:{redirectTo:`${location.origin}/auth/callback?next=${encodeURIComponent(next)}`}})
      if(error)throw error
    }catch{setError('Google girisi baslatilamadi. Supabase baglanti ayarlarini kontrol edin.');setLoading('')}
  }

  function eDevlet(){setLoading('edevlet');location.href=`/api/auth/edevlet?next=${encodeURIComponent(nextPage())}`}

  const needsOtp=verificationMethod==='phone'||verificationMethod==='email'
  const needsIdentity=verificationMethod==='passport'||verificationMethod==='international-id'

  return <main className="grid min-h-screen bg-mugla-sand lg:grid-cols-[.9fr_1.1fr]">
    <section className="hidden bg-mugla-navy p-16 text-white lg:flex lg:flex-col">
      <Link href="/" className="text-sm text-white/60">Ana sayfa</Link>
      <div className="my-auto max-w-xl">
        <span className="grid h-16 w-16 place-items-center overflow-hidden rounded-3xl bg-white p-1.5 shadow-soft">
          <Image src="/partners/mugla-buyuksehir.png" alt="T.C. Muğla Büyükşehir Belediyesi" width={720} height={721} className="h-full w-full object-contain"/>
        </span>
        <h1 className="mt-8 text-5xl font-bold leading-tight">Mugla'nin gelecegine guvenle katil.</h1>
        <p className="mt-5 text-lg leading-8 text-white/60">Bot riskini azaltmak icin her hesap en az bir kimlik dogrulama katmanindan gecer.</p>
        <div className="mt-8 grid gap-3 text-sm text-white/70">
          <span className="flex items-center gap-2"><BadgeCheck size={18} className="text-mugla-cyan"/> Dogrulanmis Kullanici rozeti</span>
          <span className="flex items-center gap-2"><ShieldCheck size={18} className="text-mugla-cyan"/> SMS, e-posta, e-Devlet, Google veya kimlik referansi</span>
        </div>
      </div>
      <p className="text-xs text-white/40">Mugla Buyuksehir Belediyesi · Guvenli Katilim Sistemi</p>
    </section>

    <section className="grid place-items-center p-6 py-10">
      <div className="w-full max-w-xl">
        <Link href="/" className="mb-8 flex items-center gap-2 text-sm lg:hidden"><ArrowLeft size={16}/> Ana sayfa</Link>
        <div className="mb-7 grid grid-cols-2 rounded-2xl bg-white p-1 shadow-sm">
          <button onClick={()=>changeMode('register')} className={`rounded-xl px-4 py-3 text-sm font-bold ${mode==='register'?'bg-mugla-navy text-white':'text-mugla-navy/55'}`}>Kayit Ol</button>
          <button onClick={()=>changeMode('login')} className={`rounded-xl px-4 py-3 text-sm font-bold ${mode==='login'?'bg-mugla-navy text-white':'text-mugla-navy/55'}`}>Giris Yap</button>
        </div>

        {mode==='register'?<div>
          <p className="text-xs font-bold tracking-[.2em] text-mugla-orange">COK KATMANLI KIMLIK DOGRULAMA</p>
          <h2 className="mt-2 text-3xl font-bold">Kayit ol</h2>
          <p className="mt-3 text-mugla-navy/55">Fikir gonderebilmek icin en az bir dogrulama yontemi zorunludur.</p>
          <form onSubmit={register} className="mt-7 space-y-4">
            <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true"/>
            <label className="block"><span className="mb-2 block text-sm font-semibold">Ad Soyad</span><input required name="name" autoComplete="name" className={field} minLength={3}/></label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label><span className="mb-2 block text-sm font-semibold">E-posta</span><input required name="email" type="email" autoComplete="email" className={field}/></label>
              <label><span className="mb-2 block text-sm font-semibold">Telefon numarasi</span><input required name="phone" type="tel" autoComplete="tel" className={field} pattern="[0-9+() -]{10,20}"/></label>
            </div>
            <label className="block"><span className="mb-2 block text-sm font-semibold">Vatandas panel ilcesi</span><select required name="district" className={field}>{muglaDistricts.map(district=><option key={district}>{district}</option>)}</select></label>
            <div className="rounded-3xl border border-mugla-navy/10 bg-white p-4">
              <p className="mb-3 text-sm font-bold">Dogrulama yontemi</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {verificationMethods.map(method=><button type="button" key={method.value} onClick={()=>setVerificationMethod(method.value)} className={`rounded-2xl border p-3 text-left text-sm ${verificationMethod===method.value?'border-mugla-orange bg-orange-50':'border-mugla-navy/10 bg-white'}`}><b className="block">{method.label}</b><span className="text-xs text-mugla-navy/50">{method.note}</span></button>)}
              </div>
              {needsOtp&&<label className="mt-4 block"><span className="mb-2 block text-sm font-semibold">Dogrulama kodu</span><input required name="verificationCode" inputMode="numeric" placeholder="123456" className={field}/></label>}
              {needsIdentity&&<label className="mt-4 block"><span className="mb-2 block text-sm font-semibold">Pasaport / uluslararasi kimlik referansi</span><input required name="identityReference" placeholder="Belge referans numarasi" className={field} minLength={6}/></label>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label><span className="mb-2 block text-sm font-semibold">Sifre</span><input required name="password" type="password" autoComplete="new-password" className={field} minLength={8}/></label>
              <label><span className="mb-2 block text-sm font-semibold">Sifre tekrar</span><input required name="repeat" type="password" autoComplete="new-password" className={field} minLength={8}/></label>
            </div>
            <label className="block rounded-2xl bg-white p-4 text-sm"><span className="mb-2 block font-semibold">Bot kontrolu: 7 + 4 = ?</span><input required name="botAnswer" inputMode="numeric" className={field}/></label>
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-white p-4 text-sm leading-6"><input required type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-mugla-orange"/><span>KVKK Aydinlatma Metni'ni okudum, anladim ve onayliyorum.</span></label>
            <div className="rounded-2xl bg-green-50 p-4 text-sm text-green-800"><b>Rozet:</b> ✔ Dogrulanmis Kullanici. Bu rozet bot hesaplari azaltmak ve oylama guvenini artirmak icin kullanilir.</div>
            {error&&<p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
            <Button type="submit" variant="orange" disabled={!!loading} className="h-14 w-full"><UserPlus size={18}/>{loading==='register'?'Kayit olusturuluyor...':'Kayit Ol ve Dogrula'}</Button>
          </form>
        </div>:<div>
          <p className="text-xs font-bold tracking-[.2em] text-mugla-orange">GUVENLI GIRIS</p>
          <h2 className="mt-2 text-3xl font-bold">Hesabina giris yap</h2>
          <p className="mt-3 text-mugla-navy/55">Dogrulanmis hesabinla devam et.</p>
          <form onSubmit={login} className="mt-8 space-y-4">
            <label className="block"><span className="mb-2 block text-sm font-semibold">E-posta</span><input required name="email" type="email" autoComplete="email" className={field} value={loginEmail} onChange={e=>setLoginEmail(e.target.value)}/></label>
            <label className="block"><span className="mb-2 block text-sm font-semibold">Sifre</span><input required name="password" type="password" autoComplete="current-password" className={field}/></label>
            {message&&<p className="rounded-2xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">{message}</p>}
            {error&&<p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
            <Button type="submit" disabled={!!loading} className="h-14 w-full"><LockKeyhole size={18}/>{loading==='login'?'Giris yapiliyor...':'Giris Yap'}</Button>
          </form>
          <button onClick={()=>changeMode('register')} className="mt-5 w-full text-center text-sm font-semibold text-mugla-blue">Hesabin yok mu? Kayit ol</button>
        </div>}

        <div className="my-7 flex items-center gap-3 text-xs text-mugla-navy/40"><span className="h-px flex-1 bg-mugla-navy/10"/>VEYA<span className="h-px flex-1 bg-mugla-navy/10"/></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Button onClick={google} disabled={!!loading} variant="outline" className="h-13">{loading==='google'?'Yonlendiriliyor...':'Google ile devam et'}</Button>
          <Button onClick={eDevlet} disabled={!!loading} className="h-13 bg-[#c62828] hover:bg-[#a91e1e]"><ShieldCheck size={18}/>{loading==='edevlet'?'Yonlendiriliyor...':'e-Devlet ile devam et'}</Button>
        </div>
        <p className="mt-4 text-center text-xs leading-5 text-mugla-navy/45">Uretimde Apple ve Microsoft hesaplari da OAuth saglayicisi olarak eklenebilir. Yabanci kullanicilar pasaport veya uluslararasi kimlik referansiyla dogrulanir.</p>
      </div>
    </section>
  </main>
}
