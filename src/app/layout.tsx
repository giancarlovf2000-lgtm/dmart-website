import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['400', '500', '600', '700', '800', '900'],
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.dmartpr.net'

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
    images: [
      {
        url: `${siteUrl}/logo.png`,
        width: 6000,
        height: 3375,
        alt: "D'Mart Institute — Tu Carrera. Tu Futuro. Empieza Aquí.",
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "D'Mart Institute — Institución Vocacional en Puerto Rico",
    description:
      'Programas acreditados en Belleza, Salud, Comercial y Técnico. Recintos en Barranquitas y Vega Alta, Puerto Rico.',
    images: [`${siteUrl}/logo.png`],
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
        <script id="siteforge-companion" dangerouslySetInnerHTML={{ __html: `(function(){if(window.top===window.self)return;var _sfD=Object.getOwnPropertyDescriptor(Document.prototype,'cookie');if(_sfD&&_sfD.set){Object.defineProperty(document,'cookie',{get:_sfD.get,set:function(v){var n=v.replace(/SameSite=\w+/gi,'SameSite=None');if(!/SameSite=/i.test(n))n+=';SameSite=None';if(!/;\s*Secure\b/i.test(n))n+=';Secure';_sfD.set.call(document,n);},configurable:true});}function reportPath(){window.parent.postMessage({type:'siteforge_path',path:window.location.pathname},'*');}reportPath();var _push=history.pushState.bind(history);history.pushState=function(){_push.apply(history,arguments);reportPath();};window.addEventListener('popstate',reportPath);var sfSA=!document.hasStorageAccess;if(document.hasStorageAccess){document.hasStorageAccess().then(function(h){sfSA=h;if(!h){var sfB=document.createElement('div');sfB.id='sf-cookie-banner';sfB.style.cssText='position:fixed;top:0;left:0;right:0;background:#1d4ed8;color:#fff;padding:9px 16px;font:13px/1.4 sans-serif;z-index:2147483647;cursor:pointer;text-align:center;box-shadow:0 2px 6px rgba(0,0,0,.4);';sfB.textContent='Haz clic aqui para habilitar las cookies y acceder al sitio';sfB.addEventListener('click',function sfC(){sfB.removeEventListener('click',sfC);sfB.textContent='Solicitando acceso...';if(document.requestStorageAccess)document.requestStorageAccess().then(function(){window.location.reload();}).catch(function(){sfB.textContent='Acceso bloqueado. Habilita las cookies del sitio en la configuracion del navegador.';sfB.style.background='#991b1b';sfB.style.cursor='default';});});(document.body||document.documentElement).appendChild(sfB);}});}var active=false,sfL=null;function deactivate(){if(!active)return;active=false;if(sfL){document.removeEventListener('mouseover',sfL.mo);document.removeEventListener('mouseout',sfL.ml);document.removeEventListener('click',sfL.cl,true);sfL=null;}document.querySelectorAll('.sf-hover,.sf-selected').forEach(function(el){el.classList.remove('sf-hover','sf-selected');});}function activate(){if(active)return;active=true;var st=document.createElement('style');st.id='sf-inspector-style';st.textContent='.sf-hover{outline:2px solid #3b82f6!important;outline-offset:2px!important;cursor:crosshair!important;}.sf-selected{outline:3px solid #f59e0b!important;outline-offset:2px!important;}';if(!document.getElementById('sf-inspector-style'))document.head.appendChild(st);var hovered=null,selected=null;function getSelector(el){var path=[];var cur=el;while(cur&&cur!==document.documentElement&&path.length<8){var seg=cur.tagName.toLowerCase();if(cur.id&&/^[a-zA-Z]/.test(cur.id)){seg+='#'+cur.id;path.unshift(seg);break;}var idx=1,sib=cur.previousElementSibling;while(sib){if(sib.tagName===cur.tagName)idx++;sib=sib.previousElementSibling;}var tot=idx,sib2=cur.nextElementSibling;while(sib2){if(sib2.tagName===cur.tagName)tot++;sib2=sib2.nextElementSibling;}if(tot>1)seg+=':nth-of-type('+idx+')';path.unshift(seg);cur=cur.parentElement;}return path.join(' > ');}function getInfo(el){return{tag:el.tagName,text:(el.innerText||el.textContent||'').trim().slice(0,200),selector:getSelector(el),outerHTML:el.outerHTML.slice(0,600),path:window.location.pathname};}function mo(e){var t=e.target;if(t.id==='sf-cookie-banner')return;if(hovered&&hovered!==selected)hovered.classList.remove('sf-hover');hovered=t;if(t!==selected)t.classList.add('sf-hover');}function ml(e){if(e.target!==selected)e.target.classList.remove('sf-hover');}function cl(e){if(e.target&&e.target.id==='sf-cookie-banner')return;e.preventDefault();e.stopPropagation();if(selected)selected.classList.remove('sf-selected');selected=e.target;selected.classList.remove('sf-hover');selected.classList.add('sf-selected');window.parent.postMessage({type:'siteforge_selection',payload:getInfo(selected)},'*');}document.addEventListener('mouseover',mo);document.addEventListener('mouseout',ml);document.addEventListener('click',cl,true);sfL={mo:mo,ml:ml,cl:cl};}window.addEventListener('message',function(e){if(!e.data)return;if(e.data.type==='siteforge_activate')activate();if(e.data.type==='siteforge_deactivate')deactivate();if(e.data.type==='siteforge_navigate'){var a=document.createElement('a');a.href=e.data.path;a.style.display='none';document.body.appendChild(a);a.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));document.body.removeChild(a);}if(e.data.type==='siteforge_highlight'){var htxtRaw=(e.data.text||'').replace(/\s+/g,' ').replace(/\.+$/,'').trim().toLowerCase();var hwords=htxtRaw.split(' ').filter(function(w){return w.length>3;});var sres=null,srlen=Infinity;if(e.data.selector){try{var scand=document.querySelectorAll(e.data.selector);var sbest=0;for(var si=0;si<scand.length;si++){var stxt=scand[si].textContent.replace(/\s+/g,' ').toLowerCase().trim();var ssc=0;if(hwords.length>0){for(var sw=0;sw<hwords.length;sw++){if(stxt.includes(hwords[sw]))ssc++;}}var srat=hwords.length>0?ssc/hwords.length:1;if(srat>sbest||(srat===sbest&&stxt.length<srlen)){sres=scand[si];sbest=srat;srlen=stxt.length;}}if(sbest<0.3)sres=null;}catch(ex){}}var tres=null,trlen=Infinity,trscore=0;if(hwords.length>0){var htag=e.data.tag?e.data.tag.toUpperCase():'*';var hels=document.querySelectorAll(htag==='*'?'*':htag);for(var hi=0;hi<hels.length;hi++){var htcl=hels[hi].textContent.replace(/\s+/g,' ').toLowerCase().trim();var hsc=0;for(var hw=0;hw<hwords.length;hw++){if(htcl.includes(hwords[hw]))hsc++;}var hrat=hsc/hwords.length;if(hrat>=0.5&&(hrat>trscore||(hrat===trscore&&htcl.length<trlen))){tres=hels[hi];trlen=htcl.length;trscore=hrat;}}if(!tres){var hels2=document.querySelectorAll('*');trlen=Infinity;trscore=0;for(var hj=0;hj<hels2.length;hj++){var htcl2=hels2[hj].textContent.replace(/\s+/g,' ').toLowerCase().trim();var hsc2=0;for(var hw2=0;hw2<hwords.length;hw2++){if(htcl2.includes(hwords[hw2]))hsc2++;}var hrat2=hsc2/hwords.length;if(hrat2>=0.5&&(hrat2>trscore||(hrat2===trscore&&htcl2.length<trlen))){tres=hels2[hj];trlen=htcl2.length;trscore=hrat2;}}}}var hbest=null;if(sres&&tres){hbest=(trlen<=srlen)?tres:sres;}else if(sres){hbest=sres;}else if(tres){hbest=tres;}if(hbest){hbest.scrollIntoView({behavior:'smooth',block:'center'});var hpO=hbest.style.outline,hpB=hbest.style.background;hbest.style.outline='3px solid #3b82f6';hbest.style.background='rgba(59,130,246,0.08)';setTimeout(function(){hbest.style.outline=hpO;hbest.style.background=hpB;},2500);}}});})();` }} />
      </body>
    </html>
  )
}
