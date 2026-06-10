import { useState, useEffect } from 'react'
import Hero from '../components/Hero'
import TrustBar from '../components/TrustBar'
import BestSelling from '../components/BestSelling'
import Reviews from '../components/Reviews'
import { useSEO } from '../hooks/useSEO'

const SECTION_MAP = {
  hero:        <Hero />,
  trustBar:    <TrustBar />,
  bestSelling: <BestSelling />,
  reviews:     <Reviews />,
}

const DEFAULT_LAYOUT = [
  { id: 'hero',        visible: true },
  { id: 'trustBar',    visible: true },
  { id: 'bestSelling', visible: true },
  { id: 'reviews',     visible: true },
]

export default function HomePage() {
  useSEO('home', { title: 'Sleekblue Media Houz — Premium Printing. Zero Stress.', description: 'Nigeria\'s top printing and branding company. Die-cut stickers, flex banners, product labels, corporate branding — fast delivery across Nigeria.', keywords: 'printing company Nigeria, die cut stickers Lagos, flex banner printing, corporate branding Nigeria' })
  const [layout, setLayout] = useState(DEFAULT_LAYOUT)

  useEffect(() => {
    fetch('/api/page-layout')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (Array.isArray(d) && d.length) setLayout(d) })
      .catch(() => {})
  }, [])

  return (
    <>
      {layout
        .filter(s => s.visible !== false)
        .map(s => SECTION_MAP[s.id] ? <div key={s.id}>{SECTION_MAP[s.id]}</div> : null)
      }
    </>
  )
}
