'use client'

import { useEffect, useState } from 'react'

declare global {
  interface Window {
    googleTranslateElementInit?: () => void
    google?: {
      translate?: {
        TranslateElement?: new (
          options: { pageLanguage: string; includedLanguages: string; autoDisplay: boolean },
          element: string
        ) => void
      }
    }
  }
}

const COOKIE_NAME = 'googtrans'
const LANGUAGES = [
  { code: 'tr', label: 'TR', cookie: '' },
  { code: 'en', label: 'EN', cookie: '/tr/en' },
  { code: 'ru', label: 'RU', cookie: '/tr/ru' },
  { code: 'zh-CN', label: 'ZH', cookie: '/tr/zh-CN' },
] as const

type LanguageCode = (typeof LANGUAGES)[number]['code']

function setTranslateCookie(value: string) {
  const expires = 'expires=Fri, 31 Dec 9999 23:59:59 GMT'
  document.cookie = `${COOKIE_NAME}=${value}; ${expires}; path=/`
  document.cookie = `${COOKIE_NAME}=${value}; ${expires}; path=/; domain=${location.hostname}`
}

function clearTranslateCookie() {
  document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
  document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${location.hostname}`
}

export function LanguageToggle() {
  const [language, setLanguage] = useState<LanguageCode>('tr')

  useEffect(() => {
    const current =
      LANGUAGES.find(item => item.cookie && document.cookie.includes(`${COOKIE_NAME}=${item.cookie}`))?.code ?? 'tr'
    setLanguage(current)
    document.documentElement.lang = current

    window.googleTranslateElementInit = () => {
      if (!window.google?.translate?.TranslateElement) return
      new window.google.translate.TranslateElement(
        { pageLanguage: 'tr', includedLanguages: LANGUAGES.map(item => item.code).join(','), autoDisplay: false },
        'google_translate_element'
      )
    }

    if (!document.querySelector('script[data-google-translate]')) {
      const script = document.createElement('script')
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
      script.async = true
      script.dataset.googleTranslate = 'true'
      document.body.appendChild(script)
    }
  }, [])

  function changeLanguage(next: LanguageCode) {
    setLanguage(next)
    document.documentElement.lang = next

    if (next === 'tr') {
      clearTranslateCookie()
      location.reload()
      return
    }

    setTranslateCookie(`/tr/${next}`)
    const combo = document.querySelector<HTMLSelectElement>('.goog-te-combo')
    if (combo) {
      combo.value = next
      combo.dispatchEvent(new Event('change', { bubbles: true }))
      return
    }
    location.reload()
  }

  return (
    <>
      <div id="google_translate_element" aria-hidden="true" />
      <div className="language-toggle notranslate" aria-label="Dil seçimi">
        {LANGUAGES.map(item => (
          <button
            className={language === item.code ? 'active' : ''}
            key={item.code}
            onClick={() => changeLanguage(item.code)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>
    </>
  )
}
