import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PRI, PRI_LIGHT, ACC, SIDEBAR_W, authH, fmt, Card, Btn, Input, Badge, SaveBar } from './AdminUI';
import { ALL_PRODUCTS, STICKER_SIZE_PRICES, getProductDetails } from '../../data/products';
import { AnalyticsView, ReportsView } from '../../components/AdminAnalytics';
import TiptapEditor from '../../components/TiptapEditor';
import logo from '@assets/SLEEKBLUE_LOGO_1779927359068.webp';

const NAV_ITEMS = [
  { id: 'dashboard',       icon: '📊', label: 'Dashboard' },
  { id: 'page-editor',     icon: '🧩', label: 'Page Editor' },
  { id: 'image-manager',   icon: '🖼️', label: 'Image Manager' },
  { id: 'products',        icon: '🛍️', label: 'Products' },
  { id: 'orders',          icon: '🛒', label: 'Orders' },
  { id: 'sticker-prices',  icon: '🏷️', label: 'Sticker Prices' },
  { id: 'business-book',   icon: '📒', label: 'Business Book' },
  { id: 'blog',            icon: '✍️', label: 'Blog' },
  { id: 'about',           icon: '📖', label: 'About Us' },
  { id: 'content',         icon: '🎨', label: 'Content CMS' },
  { id: 'faq',             icon: '❓', label: 'FAQ Manager' },
  { id: 'seo',             icon: '🔍', label: 'SEO Manager' },
  { id: 'settings',        icon: '⚙️', label: 'Site Settings' },
  { id: 'acceptances',     icon: '📋', label: 'T&C Acceptances' },
  { id: 'security',        icon: '🔑', label: 'Security' },
  { id: 'analytics',       icon: '📈', label: 'Analytics' },
  { id: 'reports',         icon: '💰', label: 'Reports' },
  { id: 'leads',           icon: '📲', label: 'WA Leads' },
  { id: 'promo-banner',    icon: '📣', label: 'Promo Banner' },
  { id: 'activity-log',    icon: '📜', label: 'Activity Log' },
  { id: 'seo-agent',       icon: '🤖', label: 'SEO Agent' },
  { id: 'growth',          icon: '🚀', label: 'Growth Dashboard' },
  { id: 'newsletter',      icon: '📧', label: 'Newsletter' },
  { id: 'comments',        icon: '💬', label: 'Comments' },
  { id: 'reviews-pending', icon: '⭐', label: 'Reviews Pending' },
  { id: 'referrals',       icon: '🔗', label: 'Referrals' },
]

export function SidebarInner({ view, setView, counts, onLogout, onClose }) {
  return (
    <div className="flex flex-col h-full" style={{ background: '#8A88DA' }}>
      <div className="px-4 py-5 border-b border-white/15 text-center flex-shrink-0">
        <img src={logo} alt="Sleekblue" className="mx-auto h-10 rounded-xl bg-white p-1" />
        <p className="mt-3 text-[10px] uppercase tracking-[0.24em] text-white/75">Admin Panel</p>
      </div>
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {NAV_ITEMS.map(item => {
          const active = view === item.id
          const badge = counts?.[item.id]
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => { setView(item.id); onClose?.() }}
              className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold transition ${
                active ? 'bg-white text-[#5B4BC4] shadow-sm' : 'text-white/90 hover:bg-white/10'
              }`}
            >
              <span className="text-base leading-none">{item.icon}</span>
              <span className="flex-1 truncate">{item.label}</span>
              {badge != null && badge > 0 && (
                <span className="rounded-full bg-[#FF6B00] px-2 py-0.5 text-[10px] font-semibold text-white">{badge}</span>
              )}
            </button>
          )
        })}
      </nav>
      <div className="p-4 border-t border-white/15 flex-shrink-0">
        <Btn variant="ghost" onClick={onLogout} className="w-full bg-white/10 text-white border-white/20 hover:bg-white/15">🚪 Log Out</Btn>
      </div>
    </div>
  )
}

export function Sidebar({ view, setView, counts, onLogout, isOpen, onClose }) {
  return (
    <>
      <div className="hidden lg:flex w-[220px] min-h-screen flex-shrink-0 flex-col shadow-inner shadow-slate-900/30">
        <SidebarInner view={view} setView={setView} counts={counts} onLogout={onLogout} />
      </div>
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} aria-hidden="true" />
      )}
      <div
        className={`fixed top-0 left-0 z-50 h-full w-[280px] flex flex-col shadow-2xl lg:hidden transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ background: '#8A88DA' }}
      >
        <button type="button" onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white text-2xl leading-none z-10" aria-label="Close menu">✕</button>
        <SidebarInner view={view} setView={setView} counts={counts} onLogout={onLogout} onClose={onClose} />
      </div>
    </>
  )
}
