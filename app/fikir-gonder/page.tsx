'use client'

import Link from 'next/link'
import {ChangeEvent,FormEvent,useEffect,useMemo,useRef,useState} from 'react'
import {ArrowLeft,CheckCircle2,FileText,Lightbulb,Paperclip,Send,Trash2,UploadCloud} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {saveProjectFiles} from '@/lib/project-files'
import {useProjects} from '@/lib/projects-store'
import {countries,muglaDistricts,turkiyeProvinces} from '@/lib/locations'
import {consumeCitizenSessionTransfer, getCurrentUser} from '@/lib/local-auth'
import {citizenUrl, isCitizenDomain, publicUrl} from '@/lib/domain-routing'
import {createClient} from '@/lib/supabase/client'
import {projectCategories,targetGroups,type ProjectCategory} from '@/lib/project-taxonomy'
import {allowedCategoriesForYear,annualThemeChangeEvent,annualThemeOptions,getAnnualThemeSetting,isAllThemesOpen,isProjectThemeAllowed} from '@/lib/annual-themes'

const MAX_TOTAL=100*1024*1024
const YEARLY_IDEA_LIMIT=5
const allowed=['pdf','doc','docx','ppt','pptx','xls','xlsx']
const countryOptions=countries()
const applicantTypes=['Bireysel','Tüzel','Grup'] as const
const field='w-full rounded-2xl border border-mugla-navy/15 bg-white px-4 py-3.5 outline-none transition focus:border-mugla-cyan focus:ring-4 focus:ring-mugla-cyan/10'
const projectDistrictOptions=['Tüm İlçeler',...muglaDistricts].sort((a,b)=>a==='Tüm İlçeler'?-1:b==='Tüm İlçeler'?1:a.localeCompare(b,'tr'))

function size(value:number){
  return value<1024*1024?`${(value/1024).toFixed(0)} KB`:`${(value/1024/1024).toFixed(1)} MB`
}

export default function IdeaForm(){
  const{projects,addProject,removeProject}=useProjects()
  const[files,setFiles]=useState<File[]>([])
  const[error,setError]=useState('')
  const[submitting,setSubmitting]=useState(false)
  const[success,setSuccess]=useState('')
  const[countryCode,setCountryCode]=useState('TR')
  const[province,setProvince]=useState('Muğla')
  const[category,setCategory]=useState<ProjectCategory>('Ulaşım')
  const[customTheme,setCustomTheme]=useState('')
  const[authorized,setAuthorized]=useState(false)
  const inputRef=useRef<HTMLInputElement>(null)
  const total=files.reduce((sum,file)=>sum+file.size,0)
  const currentUser=getCurrentUser()
  const currentYear=new Date().getFullYear()
  const currentYearKey=String(currentYear)
  const[themeVersion,setThemeVersion]=useState(0)
  const categoryOptions=useMemo(()=>allowedCategoriesForYear(currentYearKey),[currentYearKey,themeVersion])
  const activeThemeSetting=getAnnualThemeSetting(currentYearKey)
  const activeThemeLabels=isAllThemesOpen(currentYearKey)?['Tum temalar']:activeThemeSetting.themes.map(theme=>annualThemeOptions.find(option=>option.id===theme)?.label??theme)
  const yearlyIdeaCount=useMemo(()=>{
    if(!currentUser)return 0
    return projects.filter(project=>{
      const created=new Date(project.createdAt)
      const sameYear=!Number.isNaN(created.getTime())&&created.getFullYear()===currentYear
      const sameOwner=project.ownerId===currentUser.id||project.ownerEmail===currentUser.email
      return sameYear&&sameOwner
    }).length
  },[projects,currentUser,currentYear])
  const remainingIdeas=Math.max(0,YEARLY_IDEA_LIMIT-yearlyIdeaCount)

  useEffect(()=>{
    async function check(){
      if(!isCitizenDomain()){
        location.replace(citizenUrl(`${location.pathname}${location.search}`))
        return
      }
      const params=new URLSearchParams(location.search)
      if(consumeCitizenSessionTransfer(params.get('auth_transfer'))){
        params.delete('auth_transfer')
        history.replaceState(null,'',`${location.pathname}${params.toString()?`?${params.toString()}`:''}`)
      }
      if(getCurrentUser()){setAuthorized(true);return}
      try{
        const{data}=await createClient().auth.getSession()
        if(data.session){setAuthorized(true);return}
      }catch{}
      location.replace(publicUrl('/giris?mode=login&next=/fikir-gonder'))
    }
    check()
  },[])

  useEffect(()=>{
    const sync=()=>setThemeVersion(value=>value+1)
    window.addEventListener(annualThemeChangeEvent,sync)
    return()=>window.removeEventListener(annualThemeChangeEvent,sync)
  },[])

  useEffect(()=>{
    if(categoryOptions.length&&!categoryOptions.some(([name])=>name===category))setCategory(categoryOptions[0][0])
  },[categoryOptions,category])

  function addFiles(list:FileList|null){
    if(!list)return
    setError('')
    const incoming=Array.from(list)
    const invalid=incoming.find(file=>!allowed.includes(file.name.split('.').pop()?.toLocaleLowerCase('tr')??''))
    if(invalid){setError(`${invalid.name} desteklenen bir dosya turu degil.`);return}
    const merged=[...files,...incoming].filter((file,index,all)=>all.findIndex(x=>x.name===file.name&&x.size===file.size)===index)
    if(merged.reduce((sum,file)=>sum+file.size,0)>MAX_TOTAL){setError('Dosyalarin toplam boyutu 100 MB gecemez.');return}
    setFiles(merged)
  }

  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault()
    setError('')
    setSubmitting(true)
    const form=event.currentTarget
    const data=new FormData(form)
    const selectedCountry=countryOptions.find(x=>x.code===countryCode)?.name??countryCode
    const selectedCategory=String(data.get('category'))
    if(!isProjectThemeAllowed(currentYearKey,selectedCategory,'Genel')){
      setError(`${currentYear} yili icin bu tema basvuruya acik degil. Lutfen acik temalardan bir kategori secin.`)
      setSubmitting(false)
      return
    }
    const user=getCurrentUser()
    if(user){
      const sentThisYear=projects.filter(project=>{
        const created=new Date(project.createdAt)
        const sameYear=!Number.isNaN(created.getTime())&&created.getFullYear()===currentYear
        const sameOwner=project.ownerId===user.id||project.ownerEmail===user.email
        return sameYear&&sameOwner
      }).length
      if(sentThisYear>=YEARLY_IDEA_LIMIT){
        setError(`${currentYear} yılı için en fazla ${YEARLY_IDEA_LIMIT} proje fikri gönderebilirsiniz. Bu yılki hakkınız doldu.`)
        setSubmitting(false)
        return
      }
    }
    const project=addProject({
      title:String(data.get('title')).trim(),
      purpose:String(data.get('purpose')).trim(),
      summary:String(data.get('summary')).trim(),
      activities:String(data.get('activities')).trim(),
      expectedResults:String(data.get('expectedResults')).trim(),
      country:selectedCountry,
      countryCode,
      province:String(data.get('province')).trim(),
      applicantDistrict:String(data.get('applicantDistrict')).trim(),
      district:String(data.get('district')).trim(),
      category:selectedCategory,
      customTheme:selectedCategory==='Diğer'?customTheme.trim():undefined,
      subcategory:'Genel',
      targetGroup:String(data.get('targetGroup')),
      applicantType:String(data.get('applicantType')),
      budget:0,
      status:'Başvuru',
      moderationStatus:'Bekliyor',
      lat:37.08,
      lng:28.45,
      color:projectCategories.find(x=>x[0]===selectedCategory)?.[1]??'#64748b',
      attachments:files.map(file=>({name:file.name,size:file.size,type:file.type})),
      ownerId:user?.id,
      ownerName:user?.name,
      ownerEmail:user?.email,
    })
    try{
      await saveProjectFiles(project.id,files)
      setSuccess(project.projectCode)
      setFiles([])
      form.reset()
      setCategory(categoryOptions[0]?.[0]??'Ulaşım')
      setCustomTheme('')
    }catch{
      removeProject(project.id)
      setError('Dosyalar tarayici depolama alanina kaydedilemedi. Lutfen dosya boyutunu azaltip tekrar deneyin.')
    }finally{
      setSubmitting(false)
    }
  }

  if(!authorized)return <main className="grid min-h-screen place-items-center bg-mugla-sand"><p className="font-semibold text-mugla-navy/55">Oturum kontrol ediliyor...</p></main>

  if(success)return <main className="grid min-h-screen place-items-center bg-mugla-sand p-6">
    <section className="w-full max-w-xl rounded-[32px] bg-white p-10 text-center shadow-soft">
      <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-green-50 text-mugla-green"><CheckCircle2 size={38}/></span>
      <p className="mt-7 text-xs font-bold tracking-[.2em] text-mugla-orange">BASVURU ALINDI</p>
      <h1 className="mt-2 text-3xl font-bold">Fikriniz belediye onay kutusuna gönderildi.</h1>
      <div className="mx-auto mt-5 inline-flex rounded-full bg-mugla-sand px-4 py-2 text-sm font-black text-mugla-navy/70">Proje kodu: {success}</div>
      <p className="mt-4 leading-7 text-mugla-navy/55">Başvurunuz Bekliyor durumuyla proje havuzuna otomatik kaydedildi. Yetkili ekip onay veya red kararını belediye panelindeki onay kutusundan verir.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/projeler"><Button variant="orange">Projeleri goruntule</Button></Link>
        <Button variant="outline" onClick={()=>setSuccess('')}>Yeni fikir gonder</Button>
      </div>
    </section>
  </main>

  return <main className="min-h-screen bg-mugla-sand">
    <header className="border-b border-mugla-navy/10 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-mugla-navy/60 hover:text-mugla-navy"><ArrowLeft size={17}/> Ana sayfaya don</Link>
        <span className="hidden text-xs font-bold tracking-[.18em] text-mugla-orange sm:block">MUGLA SENIN BUTCEN</span>
      </div>
    </header>

    <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[.72fr_1.28fr] lg:py-16">
      <aside>
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-mugla-orange text-white"><Lightbulb size={27}/></span>
        <p className="mt-7 text-xs font-bold tracking-[.22em] text-mugla-cyan">FIKRINI PROJEYE DONUSTUR</p>
        <h1 className="mt-3 text-4xl font-bold leading-tight lg:text-5xl">Mugla icin fikrini paylas.</h1>
        <p className="mt-5 max-w-md leading-7 text-mugla-navy/55">Formu acik ve anlasilir bilgilerle doldurun. Basvurunuz teknik ekip tarafindan incelenerek degerlendirme surecine alinacaktir.</p>
        <div className="mt-6 rounded-2xl bg-white p-4 text-sm shadow-soft">
          <p className="font-bold text-mugla-navy">Yıllık fikir hakkı</p>
          <p className="mt-1 text-mugla-navy/60">{currentYear} döneminde {yearlyIdeaCount}/{YEARLY_IDEA_LIMIT} fikir gönderdiniz. Kalan hakkınız: {remainingIdeas}</p>
        </div>
        <div className="mt-4 rounded-2xl bg-white p-4 text-sm shadow-soft">
          <p className="font-bold text-mugla-navy">{currentYear} açık temaları</p>
          <div className="mt-3 flex flex-wrap gap-2">{activeThemeLabels.map(label=><span key={label} className="rounded-full bg-mugla-sand px-3 py-1 text-xs font-bold text-mugla-navy/65">{label}</span>)}</div>
          <p className="mt-3 text-mugla-navy/55">Bu yil fikirler yalnizca super admin tarafindan acilan tema alanlarindan gonderilebilir.</p>
        </div>
        <div className="mt-8 space-y-4 text-sm text-mugla-navy/65">{['Tum zorunlu alanlari doldurun.','Bir yıl dönemi içinde en fazla 5 proje fikri gönderebilirsiniz.','Kategori basvuruyu ilgili birime yonlendirir.','PDF, Word, PowerPoint ve Excel dosyalari ekleyebilirsiniz.','Dosyalarin toplam boyutu en fazla 100 MB olabilir.'].map((text,index)=><div key={text} className="flex gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white font-bold text-mugla-cyan">{index+1}</span><p className="pt-1">{text}</p></div>)}</div>
      </aside>

      <section className="rounded-[30px] bg-white p-6 shadow-soft sm:p-9">
        <form onSubmit={submit} className="space-y-6">
          <div>
            <label className="mb-2 block font-semibold" htmlFor="title">Proje adi <span className="text-red-500">*</span></label>
            <input id="title" name="title" className={field} required maxLength={160} placeholder="Projenize kisa ve anlasilir bir ad verin"/>
          </div>

          <fieldset className="rounded-2xl border border-mugla-navy/10 bg-mugla-sand/45 p-5">
            <legend className="px-2 font-bold">Başvuru sahibi</legend>
            <p className="mb-4 text-sm text-mugla-navy/50">Fikrin bireysel, tüzel kişi/kurum veya grup adına gönderildiğini belirtin.</p>
            <label><span className="mb-2 block text-sm font-semibold">Başvuru türü <span className="text-red-500">*</span></span><select name="applicantType" className={field} required>{applicantTypes.map(type=><option key={type}>{type}</option>)}</select></label>
          </fieldset>

          <fieldset className="rounded-2xl border border-mugla-navy/10 bg-mugla-sand/45 p-5">
            <legend className="px-2 font-bold">Basvuru konumu</legend>
            <p className="mb-4 text-sm text-mugla-navy/50">Bu bilgiler ulke, il ve ilce katilim sayaclarinda kullanilir.</p>
            <div className="grid gap-4">
              <label><span className="mb-2 block text-sm font-semibold">Ulke <span className="text-red-500">*</span></span><select name="country" className={field} value={countryCode} onChange={e=>{setCountryCode(e.target.value);if(e.target.value==='TR')setProvince('Muğla');else setProvince('')}} required>{countryOptions.map(x=><option key={x.code} value={x.code}>{x.name}</option>)}</select></label>
              <label><span className="mb-2 block text-sm font-semibold">Il / eyalet / bolge <span className="text-red-500">*</span></span>{countryCode==='TR'?<select name="province" className={field} value={province} onChange={e=>setProvince(e.target.value)} required>{turkiyeProvinces.map(x=><option key={x}>{x}</option>)}</select>:<input name="province" className={field} required value={province} onChange={e=>setProvince(e.target.value)} placeholder="Il, eyalet veya bolge adi"/>}</label>
              <label><span className="mb-2 block text-sm font-semibold">Ilce / sehir <span className="text-red-500">*</span></span>{countryCode==='TR'&&province==='Muğla'?<select name="applicantDistrict" className={field} required>{muglaDistricts.map(x=><option key={x}>{x}</option>)}</select>:<input name="applicantDistrict" className={field} required list="district-options" placeholder="Ilce veya sehir adini yazin/secin"/>}<datalist id="district-options"><option value="Merkez"/><option value="Kuzey"/><option value="Guney"/><option value="Dogu"/><option value="Bati"/></datalist></label>
            </div>
          </fieldset>

          <fieldset className="rounded-2xl border border-mugla-navy/10 bg-mugla-sand/45 p-5">
            <legend className="px-2 font-bold">Proje siniflandirmasi</legend>
            <p className="mb-4 text-sm text-mugla-navy/50">Yalnizca {currentYear} yili icin acik kategoriler basvuruya acilir.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <label><span className="mb-2 block text-sm font-semibold">Kategori <span className="text-red-500">*</span></span><select name="category" className={field} value={category} onChange={e=>{setCategory(e.target.value as ProjectCategory); if(e.target.value!=='Diğer')setCustomTheme('')}} required>{categoryOptions.map(item=><option key={item[0]}>{item[0]}</option>)}</select></label>
              <label><span className="mb-2 block text-sm font-semibold">Hedef Grup <span className="text-red-500">*</span></span><select name="targetGroup" className={field} required>{targetGroups.map(group=><option key={group}>{group}</option>)}</select></label>
              <label><span className="mb-2 block text-sm font-semibold">Projenin uygulanacağı ilçe <span className="text-red-500">*</span></span><select name="district" className={field} required>{projectDistrictOptions.map(district=><option key={district}>{district}</option>)}</select></label>
            </div>
            {category==='Diğer'&&<label className="mt-4 block"><span className="mb-2 block text-sm font-semibold">Proje teması <span className="text-red-500">*</span></span><input name="customTheme" className={field} required={category==='Diğer'} maxLength={120} value={customTheme} onChange={event=>setCustomTheme(event.target.value)} placeholder="Örn. Yerel kalkınma, kırsal üretim, sağlık, enerji..."/></label>}
          </fieldset>

          <div><label className="mb-2 block font-semibold" htmlFor="purpose">Projenin amaci <span className="text-red-500">*</span></label><textarea id="purpose" name="purpose" className={`${field} min-h-32 resize-y`} required maxLength={2000} placeholder="Projenin cozmek istedigi sorunu ve temel amacini aciklayin"/></div>
          <div><label className="mb-2 block font-semibold" htmlFor="summary">Projenin ozeti <span className="text-red-500">*</span></label><textarea id="summary" name="summary" className={`${field} min-h-36 resize-y`} required maxLength={3000} placeholder="Projeyi ana hatlariyla ozetleyin"/></div>
          <div><label className="mb-2 block font-semibold" htmlFor="activities">Projenin adimlari / faaliyetleri <span className="text-red-500">*</span></label><textarea id="activities" name="activities" className={`${field} min-h-44 resize-y`} required maxLength={5000} placeholder={'1. Hazirlik calismalari\n2. Uygulama asamasi\n3. Izleme ve degerlendirme'}/></div>
          <div><label className="mb-2 block font-semibold" htmlFor="expectedResults">Projeden beklenen sonuclar <span className="text-red-500">*</span></label><textarea id="expectedResults" name="expectedResults" className={`${field} min-h-36 resize-y`} required maxLength={3000} placeholder="Proje tamamlandiginda olusacak somut faydalari aciklayin"/></div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3"><span className="font-semibold">Proje dosyalari</span><span className={`text-xs font-semibold ${total>MAX_TOTAL*.9?'text-red-600':'text-mugla-navy/45'}`}>{size(total)} / 100 MB</span></div>
            <input ref={inputRef} className="hidden" type="file" multiple accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx" onChange={(e:ChangeEvent<HTMLInputElement>)=>{addFiles(e.target.files);e.target.value=''}}/>
            <button type="button" onClick={()=>inputRef.current?.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();addFiles(e.dataTransfer.files)}} className="grid w-full place-items-center rounded-2xl border-2 border-dashed border-mugla-cyan/35 bg-cyan-50/40 px-6 py-10 text-center hover:border-mugla-cyan hover:bg-cyan-50"><UploadCloud className="mb-3 text-mugla-cyan" size={34}/><b>Dosya secin veya buraya surukleyin</b><span className="mt-2 text-sm text-mugla-navy/45">PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX - Toplam en fazla 100 MB</span></button>
            {files.length>0&&<div className="mt-3 space-y-2">{files.map((file,index)=><div key={`${file.name}-${file.size}`} className="flex items-center gap-3 rounded-xl border bg-mugla-sand/50 p-3"><FileText className="shrink-0 text-mugla-cyan" size={20}/><span className="min-w-0 flex-1"><b className="block truncate text-sm">{file.name}</b><small className="text-mugla-navy/45">{size(file.size)}</small></span><button type="button" aria-label={`${file.name} dosyasini kaldir`} onClick={()=>setFiles(value=>value.filter((_,i)=>i!==index))} className="rounded-full p-2 text-red-600 hover:bg-red-50"><Trash2 size={16}/></button></div>)}</div>}
          </div>

          {error&&<div role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
          <div className="flex items-start gap-3 rounded-2xl bg-mugla-sand p-4 text-sm text-mugla-navy/60"><Paperclip className="mt-0.5 shrink-0" size={17}/><p>Yüklediğiniz belgelerde kişisel veya hassas bilgi bulunmadığından emin olun. Başvuru gönderildiğinde proje havuzuna ve belediye onay/red kutusuna otomatik kaydedilir.</p></div>
          <Button type="submit" variant="orange" disabled={submitting||remainingIdeas===0||!categoryOptions.length} className="h-13 w-full text-base">{remainingIdeas===0?'Yillik fikir hakkınız doldu':!categoryOptions.length?'Bu yil icin acik tema yok':submitting?'Basvuru kaydediliyor...':<>Fikrimi gonder <Send size={17}/></>}</Button>
        </form>
      </section>
    </div>
  </main>
}

