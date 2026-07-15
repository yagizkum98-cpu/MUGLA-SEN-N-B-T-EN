'use client'

import {FormEvent,useState} from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {ArrowLeft,BadgeCheck,LockKeyhole,ShieldCheck,UserPlus} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {loginUser,registerUser} from '@/lib/local-auth'
import {countries} from '@/lib/locations'
import {districtsForProvince,turkiyeProvinces} from '@/lib/turkiye-locations'

const field='w-full rounded-2xl border border-mugla-navy/15 bg-white px-4 py-3.5 outline-none focus:border-mugla-cyan focus:ring-4 focus:ring-mugla-cyan/10'

type PendingRegistration={
  name:string
  email:string
  phone:string
  nationality:'tc'|'foreign'
  country?:string
  province:string
  district:string
  password:string
  botAnswer:string
  botExpected:string
  website:string
}

function createBotCheck(){
  const first=Math.floor(Math.random()*8)+3
  const second=Math.floor(Math.random()*7)+2
  return{question:`${first} + ${second} = ?`,answer:String(first+second)}
}

function createActivationCode(){
  return String(Math.floor(100000+Math.random()*900000))
}

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
  const[botCheck,setBotCheck]=useState(createBotCheck)
  const[pendingRegistration,setPendingRegistration]=useState<PendingRegistration|null>(null)
  const[activationMethod,setActivationMethod]=useState<'email'|'phone'|''>('')
  const[activationCode,setActivationCode]=useState('')
  const[nationality,setNationality]=useState<'tc'|'foreign'>('tc')
  const[selectedProvince,setSelectedProvince]=useState('Mugla')
  const provinceDistricts=districtsForProvince(selectedProvince)
  const countryOptions=countries().filter(country=>country.code!=='TR')

  function changeMode(value:'login'|'register'){setMode(value);setError('');setMessage('')}

  function register(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setError('');setMessage('')
    const form=event.currentTarget
    const data=new FormData(form)
    const password=String(data.get('password'))
    const repeat=String(data.get('repeat'))
    if(password.length<8){setError('Sifre en az 8 karakter olmalidir.');return}
    if(password!==repeat){setError('Sifreler birbiriyle eslesmiyor.');return}
    const botAnswer=String(data.get('botAnswer')??'')
    if(botAnswer.trim()!==botCheck.answer){setBotCheck(createBotCheck());setError('Lutfen bot kontrolu sorusunu dogru yanitlayin.');return}
    setPendingRegistration({
      name:String(data.get('name')),
      email:String(data.get('email')),
      phone:String(data.get('phone')),
      nationality,
      country:nationality==='foreign'?String(data.get('country')):undefined,
      province:nationality==='foreign'?'Yurtdisi':String(data.get('province')),
      district:nationality==='foreign'?'Yurtdisi':String(data.get('district')),
      password,
      botAnswer,
      botExpected:botCheck.answer,
      website:String(data.get('website')??''),
    })
    setActivationMethod('')
    setActivationCode('')
    setBotCheck(createBotCheck())
    setMessage('Bilgiler alindi. Aktivasyon kodu icin e-posta veya telefon secin.')
  }

  async function activate(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setError('');setMessage('')
    if(!pendingRegistration||!activationMethod){setError('Lutfen aktivasyon yontemi secin.');return}
    setLoading('register')
    const data=new FormData(event.currentTarget)
    try{
      await registerUser({
        ...pendingRegistration,
        verificationMethod:activationMethod,
        verificationCode:String(data.get('activationCode')??''),
        verificationExpected:activationCode,
        identityReference:'',
      })
      setLoginEmail(pendingRegistration.email)
      setPendingRegistration(null)
      setActivationMethod('')
      setActivationCode('')
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
          <span className="flex items-center gap-2"><ShieldCheck size={18} className="text-mugla-cyan"/> E-posta veya telefon aktivasyonu ile guvenli kayit</span>
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

        {mode==='register'?(pendingRegistration?<div>
          <p className="text-xs font-bold tracking-[.2em] text-mugla-orange">AKTIVASYON KODU</p>
          <h2 className="mt-2 text-3xl font-bold">Kaydini dogrula</h2>
          <p className="mt-3 text-mugla-navy/55">Aktivasyon kodunu hangi kanaldan almak istedigini sec. Kod her gonderimde degisken uretilir.</p>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={()=>{const code=createActivationCode();setActivationCode(code);setActivationMethod('email');setMessage(`${pendingRegistration.email} adresine aktivasyon kodu gonderildi. Demo kod: ${code}`)}} className={`rounded-2xl border p-4 text-left ${activationMethod==='email'?'border-mugla-orange bg-orange-50':'border-mugla-navy/10 bg-white'}`}><b className="block">Mail adresime gonder</b><span className="mt-1 block text-sm text-mugla-navy/55">{pendingRegistration.email}</span></button>
            <button type="button" onClick={()=>{const code=createActivationCode();setActivationCode(code);setActivationMethod('phone');setMessage(`${pendingRegistration.phone} numarasina aktivasyon kodu gonderildi. Demo kod: ${code}`)}} className={`rounded-2xl border p-4 text-left ${activationMethod==='phone'?'border-mugla-orange bg-orange-50':'border-mugla-navy/10 bg-white'}`}><b className="block">Telefon numarama gonder</b><span className="mt-1 block text-sm text-mugla-navy/55">{pendingRegistration.phone}</span></button>
          </div>
          <form onSubmit={activate} className="mt-6 space-y-4">
            <label className="block"><span className="mb-2 block text-sm font-semibold">Aktivasyon kodu</span><input required name="activationCode" inputMode="numeric" placeholder="6 haneli kod" className={field}/></label>
            {message&&<p className="rounded-2xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">{message}</p>}
            {error&&<p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
            <Button type="submit" variant="orange" disabled={!!loading||!activationMethod} className="h-14 w-full"><UserPlus size={18}/>{loading==='register'?'Kayit tamamlanıyor...':'Kodu Onayla ve Kaydi Tamamla'}</Button>
            <button type="button" onClick={()=>{setPendingRegistration(null);setActivationMethod('');setActivationCode('');setMessage('');setError('')}} className="w-full text-center text-sm font-semibold text-mugla-blue">Bilgileri duzenle</button>
          </form>
        </div>:<div>
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
            <fieldset className="rounded-2xl bg-white p-4">
              <legend className="mb-3 text-sm font-semibold">Uyruk</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className={`cursor-pointer rounded-xl border p-3 text-sm font-semibold ${nationality==='tc'?'border-mugla-orange bg-orange-50 text-mugla-navy':'border-mugla-navy/10 text-mugla-navy/60'}`}><input type="radio" name="nationalityChoice" value="tc" checked={nationality==='tc'} onChange={()=>setNationality('tc')} className="mr-2 accent-mugla-orange"/>T.C. vatandasi</label>
                <label className={`cursor-pointer rounded-xl border p-3 text-sm font-semibold ${nationality==='foreign'?'border-mugla-orange bg-orange-50 text-mugla-navy':'border-mugla-navy/10 text-mugla-navy/60'}`}><input type="radio" name="nationalityChoice" value="foreign" checked={nationality==='foreign'} onChange={()=>setNationality('foreign')} className="mr-2 accent-mugla-orange"/>Yabanci uyruklu</label>
              </div>
              {nationality==='foreign'&&<label className="mt-4 block"><span className="mb-2 block text-sm font-semibold">Yurtdisi ulkesi</span><select required name="country" className={field}>{countryOptions.map(country=><option key={country.code} value={country.name}>{country.name}</option>)}</select></label>}
            </fieldset>
            <div className="grid gap-4 sm:grid-cols-2">
              <label><span className="mb-2 block text-sm font-semibold">Vatandas panel ili</span><select required={nationality==='tc'} disabled={nationality==='foreign'} name="province" className={`${field} disabled:cursor-not-allowed disabled:bg-mugla-navy/5 disabled:text-mugla-navy/35`} value={nationality==='foreign'?'Yurtdisi':selectedProvince} onChange={event=>setSelectedProvince(event.target.value)}>{nationality==='foreign'?<option>Yurtdisi</option>:turkiyeProvinces.map(province=><option key={province}>{province}</option>)}</select></label>
              <label><span className="mb-2 block text-sm font-semibold">Vatandas panel ilcesi</span><select required={nationality==='tc'} disabled={nationality==='foreign'} name="district" className={`${field} disabled:cursor-not-allowed disabled:bg-mugla-navy/5 disabled:text-mugla-navy/35`}>{nationality==='foreign'?<option>Yurtdisi</option>:provinceDistricts.map(district=><option key={district}>{district}</option>)}</select></label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label><span className="mb-2 block text-sm font-semibold">Sifre</span><input required name="password" type="password" autoComplete="new-password" className={field} minLength={8}/></label>
              <label><span className="mb-2 block text-sm font-semibold">Sifre tekrar</span><input required name="repeat" type="password" autoComplete="new-password" className={field} minLength={8}/></label>
            </div>
            <label className="block rounded-2xl bg-white p-4 text-sm"><span className="mb-2 block font-semibold">Bot kontrolu: {botCheck.question}</span><input required name="botAnswer" inputMode="numeric" className={field}/></label>
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-white p-4 text-sm leading-6"><input required type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-mugla-orange"/><span>KVKK Aydinlatma Metni'ni okudum, anladim ve onayliyorum.</span></label>
            <div className="rounded-2xl bg-green-50 p-4 text-sm text-green-800"><b>Rozet:</b> ✔ Dogrulanmis Kullanici. Bu rozet bot hesaplari azaltmak ve oylama guvenini artirmak icin kullanilir.</div>
            {error&&<p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
            <Button type="submit" variant="orange" disabled={!!loading} className="h-14 w-full"><UserPlus size={18}/>{loading==='register'?'Kayit olusturuluyor...':'Kayit Ol ve Dogrula'}</Button>
          </form>
        </div>):<div>
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

      </div>
    </section>
  </main>
}
