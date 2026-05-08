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
        <script id="siteforge-companion" dangerouslySetInnerHTML={{ __html: `(function(){if(window.top===window.self)return;function reportPath(){window.parent.postMessage({type:'siteforge_path',path:window.location.pathname},'*');}reportPath();var _push=history.pushState.bind(history);history.pushState=function(){_push.apply(history,arguments);reportPath();};window.addEventListener('popstate',reportPath);var sfSA=!document.hasStorageAccess;if(document.hasStorageAccess){document.hasStorageAccess().then(function(h){sfSA=h;if(!h){var sfB=document.createElement('div');sfB.id='sf-cookie-banner';sfB.style.cssText='position:fixed;top:0;left:0;right:0;background:#1d4ed8;color:#fff;padding:9px 16px;font:13px/1.4 sans-serif;z-index:2147483647;cursor:pointer;text-align:center;box-shadow:0 2px 6px rgba(0,0,0,.4);';sfB.textContent='Haz clic aqui para habilitar las cookies y acceder al sitio';sfB.addEventListener('click',function sfC(){sfB.removeEventListener('click',sfC);sfB.textContent='Solicitando acceso...';if(document.requestStorageAccess)document.requestStorageAccess().then(function(){window.location.reload();}).catch(function(){sfB.textContent='Acceso bloqueado. Habilita las cookies del sitio en la configuracion del navegador.';sfB.style.background='#991b1b';sfB.style.cursor='default';});});(document.body||document.documentElement).appendChild(sfB);}});}var active=false,sfL=null;function deactivate(){if(!active)return;active=false;if(sfL){document.removeEventListener('mouseover',sfL.mo);document.removeEventListener('mouseout',sfL.ml);document.removeEventListener('click',sfL.cl,true);sfL=null;}document.querySelectorAll('.sf-hover,.sf-selected').forEach(function(el){el.classList.remove('sf-hover','sf-selected');});}function activate(){if(active)return;active=true;var st=document.createElement('style');st.id='sf-inspector-style';st.textContent='.sf-hover{outline:2px solid #3b82f6!important;outline-offset:2px!important;cursor:crosshair!important;}.sf-selected{outline:3px solid #f59e0b!important;outline-offset:2px!important;}';if(!document.getElementById('sf-inspector-style'))document.head.appendChild(st);var hovered=null,selected=null;function getSelector(el){var path=[];var cur=el;while(cur&&cur.nodeType===1&&path.length<5){var seg=cur.tagName.toLowerCase();if(cur.id){seg+='#'+cur.id;path.unshift(seg);break;}if(cur.className&&typeof cur.className==='string'){var cls=cur.className.trim().split(' ').filter(Boolean).slice(0,2).join('.');if(cls)seg+='.'+cls;}path.unshift(seg);cur=cur.parentElement;}return path.join(' > ');}function getInfo(el){return{tag:el.tagName,text:(el.innerText||el.textContent||'').trim().slice(0,200),selector:getSelector(el),outerHTML:el.outerHTML.slice(0,600),path:window.location.pathname};}function mo(e){var t=e.target;if(t.id==='sf-cookie-banner')return;if(hovered&&hovered!==selected)hovered.classList.remove('sf-hover');hovered=t;if(t!==selected)t.classList.add('sf-hover');}function ml(e){if(e.target!==selected)e.target.classList.remove('sf-hover');}function cl(e){if(e.target&&e.target.id==='sf-cookie-banner')return;e.preventDefault();e.stopPropagation();if(selected)selected.classList.remove('sf-selected');selected=e.target;selected.classList.remove('sf-hover');selected.classList.add('sf-selected');window.parent.postMessage({type:'siteforge_selection',payload:getInfo(selected)},'*');}document.addEventListener('mouseover',mo);document.addEventListener('mouseout',ml);document.addEventListener('click',cl,true);sfL={mo:mo,ml:ml,cl:cl};}window.addEventListener('message',function(e){if(!e.data)return;if(e.data.type==='siteforge_activate')activate();if(e.data.type==='siteforge_deactivate')deactivate();if(e.data.type==='siteforge_navigate'){var a=document.createElement('a');a.href=e.data.path;a.style.display='none';document.body.appendChild(a);a.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));document.body.removeChild(a);}});})();` }} />
      </body>
    </html>
  )
}
