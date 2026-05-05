import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['400', '500', '600', '700', '800', '900'],
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://dmartinstitute.edu'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    template: '%s | D\'Mart Institute',
    default: 'D\'Mart Institute — Institución Vocacional Acreditada en Puerto Rico',
  },
  description:
    'D\'Mart Institute es una institución postsecundaria acreditada en Puerto Rico con recintos en Barranquitas y Vega Alta. Programas en Belleza, Salud, Comercial y Técnico. Ayuda económica disponible.',
  keywords: [
    'escuela vocacional Puerto Rico',
    'cosmetología Puerto Rico',
    'enfermería práctica PR',
    'técnico electricidad Puerto Rico',
    'Barranquitas escuela',
    'Vega Alta instituto',
    'D\'Mart Institute',
    'programas vocacionales PR',
    'ayuda económica PELL Grant',
    'ACCSC acreditado',
  ],
  authors: [{ name: 'D\'Mart Institute' }],
  creator: 'D\'Mart Institute',
  publisher: "D'Mart Institute",
  openGraph: {
    type: 'website',
    locale: 'es_PR',
    url: siteUrl,
    siteName: "D'Mart Institute",
    title: "D'Mart Institute — Tu Carrera. Tu Futuro. Empieza Aquí.",
    description:
      'Institución postsecundaria acreditada en Puerto Rico. Programas vocacionales en Belleza, Salud, Comercial y Técnico. Recintos en Barranquitas y Vega Alta.',
  },
  twitter: {
    card: 'summary_large_image',
    title: "D'Mart Institute — Institución Vocacional en Puerto Rico",
    description:
      'Programas acreditados en Belleza, Salud, Comercial y Técnico. Recintos en Barranquitas y Vega Alta, Puerto Rico.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="min-h-screen flex flex-col bg-white">
        {children}
        <script
          id="siteforge-companion"
          dangerouslySetInnerHTML={{
            __html: `(function(){
  if(!window.location.search.includes('siteforge=true'))return;
  var ORIGIN='https://siteforge-dmart.vercel.app';
  var hovered=null,selected=null;
  var style=document.createElement('style');
  style.textContent='.sf-hover{outline:2px solid #3b82f6!important;outline-offset:2px!important;cursor:crosshair!important;}.sf-selected{outline:3px solid #f59e0b!important;outline-offset:2px!important;}';
  document.head.appendChild(style);
  function getSelector(el){
    var path=[];
    var current=el;
    while(current&&current.nodeType===1&&path.length<5){
      var seg=current.tagName.toLowerCase();
      if(current.id){seg+='#'+current.id;path.unshift(seg);break;}
      if(current.className&&typeof current.className==='string'){
        var cls=current.className.trim().split(/\\s+/).slice(0,2).join('.');
        if(cls)seg+='.'+cls;
      }
      path.unshift(seg);
      current=current.parentElement;
    }
    return path.join(' > ');
  }
  function getInfo(el){
    return{
      tag:el.tagName,
      text:(el.innerText||el.textContent||'').trim().slice(0,200),
      selector:getSelector(el),
      outerHTML:el.outerHTML.slice(0,600),
      path:window.location.pathname
    };
  }
  document.addEventListener('mouseover',function(e){
    var t=e.target;
    if(hovered&&hovered!==selected)hovered.classList.remove('sf-hover');
    hovered=t;
    if(t!==selected)t.classList.add('sf-hover');
  });
  document.addEventListener('mouseout',function(e){
    if(e.target!==selected)e.target.classList.remove('sf-hover');
  });
  document.addEventListener('click',function(e){
    e.preventDefault();e.stopPropagation();
    if(selected)selected.classList.remove('sf-selected');
    selected=e.target;
    selected.classList.remove('sf-hover');
    selected.classList.add('sf-selected');
    window.parent.postMessage({type:'siteforge_selection',payload:getInfo(selected)},ORIGIN);
  },true);
})();`,
          }}
        />
      </body>
    </html>
  )
}
