import { useState, useEffect } from 'react'
import Hero from '../components/Hero'
import TrustBar from '../components/TrustBar'
import BestSelling from '../components/BestSelling'
import Reviews from '../components/Reviews'

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
