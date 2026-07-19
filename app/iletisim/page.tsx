'use client'

import Link from 'next/link'
import {FormEvent, useMemo, useState} from 'react'
import {ArrowLeft, Building2, CheckCircle2, Mail, MapPin, Phone, Send} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {type ContactTopic, useContactRecords} from '@/lib/contact-store'

const field = 'w-full rounded-2xl border border-mugla-navy/15 bg-white px-4 py-3.5 outline-none transition focus:border-mugla-cyan focus:ring-4 focus:ring-mugla-cyan/10'
const topics: {value: ContactTopic; label: string}[] = [
  {value: 'Gorus', label: 'Gorus'},
  {value: 'Oneri', label: 'Oneri'},
  {value: 'Soru', label: 'Soru'},
]

function createSecurityQuestion() {
  const left = Math.floor(Math.random() * 8) + 2
  const right = Math.floor(Math.random() * 7) + 1
  return {text: `${left} + ${right}`, answer: left + right}
}

function ContactInfoCard() {
  return <div className="fade-up-card relative mt-5 overflow-hidden rounded-2xl border border-mugla-navy/10 bg-white p-5 shadow-soft">
    <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-mugla-cyan/10"/>
    <div className="absolute -bottom-14 left-10 h-28 w-28 rounded-full bg-mugla-orange/10"/>
    <div className="relative">
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-mugla-navy text-white shadow-sm">
          <Building2 size={23}/>
        </span>
        <div>
          <p className="text-xs font-black uppercase tracking-[.2em] text-mugla-orange">Adres</p>
          <h2 className="mt-1 text-lg font-black text-mugla-navy">Muğla Büyükşehir Belediyesi</h2>
        </div>
      </div>
      <div className="mt-5 space-y-3">
        <div className="group flex gap-3 rounded-2xl bg-mugla-sand/70 p-4 transition hover:-translate-y-0.5 hover:bg-mugla-sand">
          <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-mugla-cyan shadow-sm transition group-hover:scale-105">
            <MapPin size={18}/>
          </span>
          <p className="text-sm font-semibold leading-6 text-mugla-navy/70">
            Müştakbey Mahallesi, Belediye Sokak, No:6<br/>
            48000 Menteşe/Muğla
          </p>
        </div>
        <a href="tel:4444801" className="group flex items-center gap-3 rounded-2xl bg-mugla-navy p-4 text-white transition hover:-translate-y-0.5 hover:bg-mugla-blue">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/12 text-mugla-cyan transition group-hover:scale-105">
            <Phone size={18}/>
          </span>
          <span>
            <span className="block text-xs font-bold text-white/55">Telefon</span>
            <strong className="text-xl tracking-wide">444 48 01</strong>
          </span>
        </a>
      </div>
    </div>
  </div>
}

export default function ContactPage() {
  const {addContactRecord} = useContactRecords()
  const [question, setQuestion] = useState(() => createSecurityQuestion())
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const submittedAt = useMemo(() => new Date().toLocaleString('tr-TR'), [success])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const form = event.currentTarget
    const data = new FormData(form)
    if (Number(data.get('securityAnswer')) !== question.answer) {
      setError('Guvenlik sorusunun cevabi hatali. Lutfen yeni islemi cevaplayin.')
      setQuestion(createSecurityQuestion())
      return
    }
    if (data.get('kvkkAccepted') !== 'on') {
      setError('Iletisim talebinizi alabilmemiz icin KVKK onayini isaretleyin.')
      return
    }
    addContactRecord({
      name: String(data.get('name')).trim(),
      phone: String(data.get('phone')).trim(),
      email: String(data.get('email')).trim(),
      topic: String(data.get('topic')) as ContactTopic,
      subject: String(data.get('subject')).trim(),
      message: String(data.get('message')).trim(),
      kvkkAccepted: true,
    })
    form.reset()
    setQuestion(createSecurityQuestion())
    setSuccess(true)
  }

  if (success) return <main className="grid min-h-screen place-items-center bg-mugla-sand p-6">
    <section className="w-full max-w-xl rounded-[32px] bg-white p-10 text-center shadow-soft">
      <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-green-50 text-mugla-green"><CheckCircle2 size={38}/></span>
      <p className="mt-7 text-xs font-bold tracking-[.2em] text-mugla-orange">ILETISIM TALEBI ALINDI</p>
      <h1 className="mt-2 text-3xl font-bold">Mesajiniz belediye paneline iletildi.</h1>
      <p className="mt-4 leading-7 text-mugla-navy/55">{submittedAt} tarihinde kaydedilen gorus, oneri veya sorunuz ilgili birimler tarafindan degerlendirilecektir.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/"><Button variant="orange">Ana sayfaya don</Button></Link>
        <Button variant="outline" onClick={() => setSuccess(false)}>Yeni mesaj gonder</Button>
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
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-mugla-cyan text-white"><Mail size={27}/></span>
        <p className="mt-7 text-xs font-bold tracking-[.22em] text-mugla-orange">KATILIMCI BUTCE UYGULAMASI ILE ILGILI ILETISIM</p>
        <h1 className="mt-3 text-4xl font-bold leading-tight lg:text-5xl">Gorus, oneri ve sorularinizi bize iletin.</h1>
        <p className="mt-5 max-w-md leading-7 text-mugla-navy/55">Katilimci Butce sureciyle ilgili gorus, oneri ve sorularinizi bize iletebilirsiniz.</p>
        <div className="mt-8 rounded-2xl bg-white p-5 shadow-soft">
          <p className="font-bold text-mugla-navy">Muğla Büyükşehir Belediyesi Katılımcı Bütçe Programı</p>
          <p className="mt-2 text-sm leading-6 text-mugla-navy/55">Gorus ve onerileriniz, ilgili birimler tarafindan degerlendirilecektir.</p>
        </div>
        <ContactInfoCard/>
      </aside>

      <section className="rounded-[30px] bg-white p-6 shadow-soft sm:p-9">
        <form onSubmit={submit} className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <label><span className="mb-2 block font-semibold">Adiniz Soyadiniz <span className="text-red-500">*</span></span><input name="name" className={field} required minLength={3}/></label>
            <label><span className="mb-2 block font-semibold">Telefon Numaraniz <span className="text-red-500">*</span></span><input name="phone" className={field} required inputMode="tel" minLength={10}/></label>
            <label><span className="mb-2 block font-semibold">E-Posta Adresiniz <span className="text-red-500">*</span></span><input name="email" type="email" className={field} required/></label>
            <label><span className="mb-2 block font-semibold">Konu <span className="text-red-500">*</span></span><select name="topic" className={field} required>{topics.map(topic => <option key={topic.value} value={topic.value}>{topic.label}</option>)}</select></label>
          </div>
          <label><span className="mb-2 block font-semibold">Konu basligi <span className="text-red-500">*</span></span><input name="subject" className={field} required maxLength={160}/></label>
          <label><span className="mb-2 block font-semibold">Mesajiniz <span className="text-red-500">*</span></span><textarea name="message" className={`${field} min-h-40 resize-y`} required maxLength={3000}/></label>
          <label><span className="mb-2 block font-semibold">Guvenlik sorusu: {question.text} = ? <span className="text-red-500">*</span></span><input name="securityAnswer" className={field} required inputMode="numeric" autoComplete="off"/></label>
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-mugla-sand p-4 text-sm text-mugla-navy/65">
            <input name="kvkkAccepted" type="checkbox" required className="mt-1 h-4 w-4 shrink-0 accent-mugla-orange"/>
            <span>KVKK kapsaminda kisisel verilerimin iletisim talebimin degerlendirilmesi amaciyla islenmesini kabul ediyorum.</span>
          </label>
          {error && <div role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
          <Button type="submit" variant="orange" className="h-13 w-full text-base">Formu gonder <Send size={17}/></Button>
        </form>
      </section>
    </div>
  </main>
}
