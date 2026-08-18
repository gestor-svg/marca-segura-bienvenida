/**
 * MARCA SEGURA — Plantillas de las 3 hojas de bienvenida
 * Generadas a partir del diseño aprobado (paleta, tipografía y layout finales).
 * Cada función recibe `data` (campos extraídos/derivados) y `assets` (imágenes
 * en base64: logo de Marca Segura, logo del cliente si existe, QR de referido)
 * y regresa un documento HTML completo listo para renderizar con html2canvas.
 */

const SHARED_STYLE = `<style>
  :root{
    --blue:#0E51C4;
    --blue-deep:#0A3C93;
    --blue-ink:#0A2E70;
    --orange:#F77507;
    --orange-deep:#CF4D37;
    --paper:#F7F5F0;
    --paper-line:#E4E1D9;
    --white:#ffffff;
  }
  *{box-sizing:border-box; margin:0; padding:0;}
  body{
    background:#5b5b5b;
    font-family:'Inter', sans-serif;
    padding:40px 0;
    display:flex;
    flex-direction:column;
    align-items:center;
    gap:32px;
  }
  .page{
    width:816px;
    height:1056px;
    background:var(--paper);
    position:relative;
    overflow:hidden;
    box-shadow:0 20px 60px rgba(0,0,0,0.4);
    color:var(--blue-ink);
  }

  /* ---------- PAGE 1: PORTADA ---------- */
  .p1{
    display:flex;
    flex-direction:column;
    align-items:center;
    padding:56px 80px;
  }
  .p1::before{
    content:"";
    position:absolute;
    inset:36px;
    border:1px solid var(--orange);
    opacity:0.35;
    pointer-events:none;
  }
  .p1::after{
    content:"";
    position:absolute;
    inset:42px;
    border:1px solid var(--paper-line);
    pointer-events:none;
  }

  .logo-top{
    height:56px;
    margin-top:4px;
  }

  .client-logo-slot{
    margin-top:56px;
    height:150px;
    display:flex;
    align-items:center;
    justify-content:center;
  }
  .client-logo-slot img{
    max-height:150px;
    max-width:340px;
    object-fit:contain;
  }

  /* fallback when client has no logo */
  .no-logo-slot{
    margin-top:70px;
    text-align:center;
  }

  .eyebrow{
    margin-top:36px;
    font-family:'IBM Plex Mono', monospace;
    font-size:12px;
    letter-spacing:4px;
    text-transform:uppercase;
    color:var(--orange);
    font-weight:500;
  }

  .marca-nombre{
    font-family:'Fraunces', serif;
    font-weight:600;
    font-size:52px;
    text-align:center;
    line-height:1.05;
    margin-top:12px;
    max-width:600px;
    color:var(--blue-ink);
  }

  .registro-num{
    font-family:'IBM Plex Mono', monospace;
    font-size:13px;
    color:var(--blue-deep);
    opacity:0.7;
    margin-top:16px;
    letter-spacing:1px;
  }

  .divider{
    width:60px;
    height:2px;
    background:var(--orange);
    margin:30px 0;
  }

  .mensaje{
    font-size:16px;
    line-height:1.7;
    text-align:center;
    max-width:480px;
    color:var(--blue-deep);
  }

  .mensaje strong{ color:var(--blue-ink); }

  .bienvenida-line{
    font-family:'Fraunces', serif;
    font-size:18px;
    font-weight:500;
    text-align:center;
    max-width:480px;
    color:var(--blue-ink);
    margin-top:20px;
  }

  .titular-box{
    margin-top:36px;
    text-align:center;
  }
  .titular-label{
    font-family:'IBM Plex Mono', monospace;
    font-size:10px;
    letter-spacing:3px;
    text-transform:uppercase;
    color:var(--orange);
    margin-bottom:8px;
  }
  .titular-nombre{
    font-family:'Fraunces', serif;
    font-size:20px;
    font-weight:500;
    color:var(--blue-ink);
    max-width:460px;
    line-height:1.5;
  }
  .titular-nombre.multi{
    font-size:15px;
    line-height:1.7;
  }

  .p1-footer{
    position:absolute;
    bottom:44px;
    left:0; right:0;
    display:flex;
    flex-direction:column;
    align-items:center;
    gap:8px;
  }
  .p1-footer-logo{
    height:44px;
  }
  .p1-footer-tag{
    font-family:'IBM Plex Mono', monospace;
    font-size:9px;
    letter-spacing:2px;
    color:var(--blue-deep);
    opacity:0.7;
    text-transform:uppercase;
  }

  /* ---------- PAGE 2 & 3 shared ---------- */
  .p2, .p3{ padding:50px 68px; }
  .p-header{
    display:flex;
    justify-content:space-between;
    align-items:flex-end;
    border-bottom:2px solid var(--blue-ink);
    padding-bottom:16px;
  }
  .p-title{
    font-family:'Fraunces', serif;
    font-weight:600;
    font-size:26px;
    color:var(--blue-ink);
  }
  .p-sub{
    font-family:'IBM Plex Mono', monospace;
    font-size:10px;
    letter-spacing:2px;
    color:var(--orange);
    text-transform:uppercase;
    margin-bottom:6px;
    font-weight:500;
  }
  .p-reg{
    font-family:'IBM Plex Mono', monospace;
    font-size:12px;
    text-align:right;
    color:var(--blue-deep);
    opacity:0.75;
  }
  .p-header-logo{ height:44px; }

  .datatable{
    margin-top:24px;
    border:1px solid var(--paper-line);
  }
  .datarow{
    display:flex;
    border-bottom:1px solid var(--paper-line);
  }
  .datarow:last-child{ border-bottom:none; }
  .datacell{
    flex:1;
    padding:13px 18px;
    border-right:1px solid var(--paper-line);
  }
  .datacell:last-child{ border-right:none; }
  .datacell-label{
    font-family:'IBM Plex Mono', monospace;
    font-size:9px;
    letter-spacing:1.5px;
    text-transform:uppercase;
    color:var(--orange);
    margin-bottom:4px;
  }
  .datacell-value{
    font-size:13.5px;
    font-weight:500;
    color:var(--blue-ink);
  }

  .alert-block{
    margin-top:20px;
    background:var(--blue-ink);
    color:var(--paper);
    padding:20px 22px;
    display:flex;
    align-items:center;
  }
  .alert-icon-circle{
    width:52px;
    height:52px;
    min-width:52px;
    border-radius:50%;
    background:var(--orange);
    display:flex;
    align-items:center;
    justify-content:center;
    flex-shrink:0;
    margin-right:18px;
  }
  .alert-icon-circle svg{ width:28px; height:28px; }
  .alert-title{
    font-family:'IBM Plex Mono', monospace;
    font-size:11px;
    letter-spacing:2px;
    text-transform:uppercase;
    color:#FFCBA6;
    margin-bottom:6px;
    font-weight:600;
  }
  .alert-text{
    font-size:14px;
    line-height:1.6;
    max-width:600px;
  }

  /* option cards on page 3 */
  .service-card{
    margin-top:26px;
    border:1.5px solid var(--paper-line);
    padding:22px 24px;
    position:relative;
  }
  .service-card.featured{
    border-color:var(--orange);
    background:#FFF8F0;
  }
  .service-num{
    position:absolute;
    top:-13px;
    left:20px;
    background:var(--orange);
    color:white;
    font-family:'IBM Plex Mono', monospace;
    font-size:10px;
    letter-spacing:1px;
    padding:3px 10px;
  }
  .service-title{
    font-family:'Fraunces', serif;
    font-size:19px;
    font-weight:600;
    color:var(--blue-ink);
    margin-top:6px;
  }
  .service-desc{
    font-size:13px;
    color:var(--blue-deep);
    margin-top:6px;
    line-height:1.55;
    max-width:520px;
  }
  .service-desc strong{
    color:var(--blue-ink);
    font-weight:700;
  }
  .service-guarantee{
    margin-top:12px;
    font-family:'Fraunces', serif;
    font-size:19px;
    color:var(--orange-deep);
    font-weight:600;
    line-height:1.3;
  }
  .price-row{
    margin-top:20px;
    display:flex;
    align-items:flex-start;
    justify-content:center;
    gap:24px;
    flex-wrap:wrap;
    text-align:center;
  }
  .price-col{
    display:flex;
    flex-direction:column;
    align-items:center;
    gap:5px;
  }
  .price-col + .price-col{
    border-left:1px solid var(--paper-line);
    padding-left:32px;
  }
  .price-label{
    font-family:'IBM Plex Mono', monospace;
    font-size:9px;
    letter-spacing:1.5px;
    text-transform:uppercase;
    color:var(--blue-deep);
    opacity:0.7;
  }
  .price-label.highlight{
    color:var(--orange);
    opacity:1;
    font-weight:600;
  }
  .price-old{
    font-family:'Fraunces', serif;
    font-size:34px;
    font-weight:700;
    color:#1a1a1a;
    line-height:1;
    text-decoration:line-through;
  }
  .price-new{
    font-family:'Fraunces', serif;
    font-size:34px;
    font-weight:700;
    color:var(--orange);
    line-height:1;
  }
  .price-gift{
    font-family:'Fraunces', serif;
    font-size:20px;
    font-weight:700;
    color:white;
    background:var(--orange);
    padding:8px 18px;
    line-height:1.2;
    align-self:flex-end;
    margin-bottom:2px;
  }
  .price-window{
    margin-top:12px;
    font-size:11.5px;
    color:var(--blue-deep);
    font-style:italic;
  }

  .qr-row{
    margin-top:18px;
    display:flex;
    align-items:center;
  }
  .qr-row img{
    width:110px;
    height:110px;
    border:1.5px solid var(--orange);
    padding:6px;
    background:white;
    margin-right:20px;
  }
  .qr-caption-title{
    font-family:'Fraunces', serif;
    font-size:15px;
    font-weight:600;
    color:var(--blue-ink);
    display:flex;
    align-items:center;
  }
  .qr-caption-icon{
    width:26px;
    height:26px;
    min-width:26px;
    border-radius:50%;
    background:var(--orange);
    display:inline-flex;
    align-items:center;
    justify-content:center;
    margin-right:8px;
  }
  .next-page-block{
    margin-top:22px;
    background:var(--blue-ink);
    border-radius:2px;
    padding:16px 20px;
    display:flex;
    align-items:center;
    justify-content:center;
    text-align:center;
  }
  .next-page-icon{
    width:40px;
    height:40px;
    min-width:40px;
    border-radius:50%;
    background:var(--orange);
    display:flex;
    align-items:center;
    justify-content:center;
    flex-shrink:0;
    margin-right:16px;
  }
  .next-page-icon svg{ width:20px; height:20px; }
  .next-page-title{
    font-family:'Fraunces', serif;
    font-size:14px;
    font-weight:600;
    color:white;
  }
  .next-page-desc{
    font-size:12.5px;
    color:var(--paper);
    opacity:0.9;
    margin-top:2px;
  }
  .qr-caption-icon svg{ width:15px; height:15px; }
  .qr-caption-desc{
    font-size:12px;
    color:var(--blue-deep);
    margin-top:4px;
    max-width:340px;
    line-height:1.5;
  }

  .p-footer{
    position:absolute;
    bottom:32px;
    left:68px; right:68px;
    display:flex;
    justify-content:space-between;
    font-family:'IBM Plex Mono', monospace;
    font-size:9px;
    letter-spacing:1px;
    color:var(--blue-deep);
    opacity:0.7;
    border-top:1px solid var(--paper-line);
    padding-top:12px;
    text-transform:uppercase;
  }

  .growth-section{
    margin-top:20px;
  }
  .growth-eyebrow{
    font-family:'IBM Plex Mono', monospace;
    font-size:10px;
    letter-spacing:2px;
    text-transform:uppercase;
    color:var(--orange);
    font-weight:500;
  }
  .growth-title{
    font-family:'Fraunces', serif;
    font-size:19px;
    font-weight:600;
    color:var(--blue-ink);
    margin-top:4px;
  }
  .growth-block{
    margin-top:14px;
    border:1px solid var(--paper-line);
    border-left:3px solid var(--orange);
    padding:16px 20px;
    display:flex;
    align-items:center;
  }
  .growth-icon{
    width:46px;
    height:46px;
    min-width:46px;
    border-radius:50%;
    background:var(--orange);
    display:flex;
    align-items:center;
    justify-content:center;
    flex-shrink:0;
    margin-right:16px;
  }
  .growth-icon svg{ width:24px; height:24px; }
  .growth-block-title{
    font-family:'Fraunces', serif;
    font-size:14.5px;
    font-weight:600;
    color:var(--blue-ink);
  }
  .growth-block-desc{
    font-size:12px;
    color:var(--blue-deep);
    margin-top:4px;
    line-height:1.5;
    max-width:560px;
  }
  .growth-block-desc strong{
    color:var(--blue-ink);
    font-weight:700;
  }
  .growth-block-note{
    font-size:10.5px;
    color:var(--blue-deep);
    opacity:0.65;
    margin-top:5px;
    font-style:italic;
  }

  .label{
    font-family:'IBM Plex Mono', monospace;
    font-size:11px;
    color:#ccc;
    background:#333;
    padding:4px 10px;
    border-radius:4px;
  }
</style>`;

function esc(s) {
  if (s == null) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Íconos en línea (trazo blanco, pensados para ir sobre un círculo de color)
const ICON_CALENDAR = `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
const ICON_LICENSE = `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2Z"/><path d="M9 15l2 2 4-4"/></svg>`;
const ICON_PERCENT = `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>`;
const ICON_SHIELD = `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5l-8-3Z"/><path d="M9 12l2 2 4-4"/></svg>`;
const ICON_GIFT = `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5"/></svg>`;
const ICON_NEXT_PAGE = `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2Z"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>`;

export function buildHoja1(data, assets) {
  const titularLabel = data.titulares.length > 1 ? 'Titulares' : 'Titular';
  const titularClass = data.titulares.length > 1 ? 'titular-nombre multi' : 'titular-nombre';
  const titularDisplay = data.titulares.length > 2
    ? data.titulares.map(esc).reduce((acc, name, i) => {
        if (i === 0) return name;
        return acc + (i % 2 === 0 ? '<br>' : ' · ') + name;
      }, '')
    : data.titulares.map(esc).join(' · ');

  const marcaBlock = assets.clientLogoBase64
    ? `<div class="client-logo-slot"><img src="data:image/png;base64,${assets.clientLogoBase64}" alt="Logo del cliente"></div>
       <div class="eyebrow">Marca registrada</div>
       <div class="marca-nombre">${esc(data.marca)}</div>`
    : `<div class="no-logo-slot">
         <div class="eyebrow" style="margin-top:0;">Marca registrada</div>
         <div class="marca-nombre" style="margin-top:14px;">${esc(data.marca)}</div>
       </div>`;

  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@300;500;600;700&family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>${SHARED_STYLE.replace(/<\/?style>/g, '')} body{background:transparent;padding:0;}</style>
</head><body>
<div class="page p1" id="page-render-target">
  <img class="logo-top" src="data:image/png;base64,${assets.msLogoBase64}" alt="Marca Segura">
  ${marcaBlock}
  <div class="registro-num">REGISTRO N.º ${esc(data.registro)} · EXPEDIENTE ${esc(data.expediente)}</div>
  <div class="divider"></div>
  <div class="mensaje">
    Después de un proceso de más de <strong>cuatro meses</strong> ante el Instituto Mexicano de la Propiedad Industrial,
    su marca cuenta ahora con <strong>protección legal exclusiva</strong> durante los próximos diez años.
  </div>
  <div class="bienvenida-line">Bienvenido al grupo de negocios mexicanos con su marca blindada.</div>
  <div class="titular-box">
    <div class="titular-label">${titularLabel}</div>
    <div class="${titularClass}">${titularDisplay}</div>
  </div>
  <div class="p1-footer">
    <img class="p1-footer-logo" src="data:image/png;base64,${assets.msLogoBase64}" alt="Marca Segura">
    <div class="p1-footer-tag">www.marcasegura.mx</div>
  </div>
</div>
</body></html>`;
}

export function buildHoja2(data, assets) {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@300;500;600;700&family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>${SHARED_STYLE.replace(/<\/?style>/g, '')} body{background:transparent;padding:0;}</style>
</head><body>
<div class="page p2" id="page-render-target">
  <div class="p-header">
    <div>
      <div class="p-sub">Manual de operación</div>
      <div class="p-title">Su marca registrada</div>
    </div>
    <div class="p-reg">REG. ${esc(data.registro)}<br>CLASE ${esc(data.clase)}</div>
  </div>
  <div class="datatable">
    <div class="datarow">
      <div class="datacell">
        <div class="datacell-label">Fecha de registro</div>
        <div class="datacell-value">${esc(data.fechaEmisionLargo)}</div>
      </div>
      <div class="datacell">
        <div class="datacell-label">Vigencia hasta</div>
        <div class="datacell-value">${esc(data.fechaVigenciaLargo)}</div>
      </div>
    </div>
    <div class="datarow">
      <div class="datacell">
        <div class="datacell-label">Clase / Giro protegido</div>
        <div class="datacell-value">${esc(data.clase)} — ${esc(data.seAplicaA)}</div>
      </div>
      <div class="datacell">
        <div class="datacell-label">Declaración de uso</div>
        <div class="datacell-value">Vence: ${esc(data.declaracionVenceStr)}</div>
      </div>
    </div>
  </div>
  <div class="alert-block">
    <div class="alert-icon-circle">${ICON_CALENDAR}</div>
    <div>
      <div class="alert-title">Fecha clave — no la pierda de vista</div>
      <div class="alert-text">
        La ley exige presentar la <strong>Declaración de Uso</strong> dentro de los tres meses posteriores
        al tercer aniversario de su registro. Si no se presenta a tiempo, el IMPI puede <strong>cancelar su marca</strong>
        de forma automática, sin importar que siga en uso. En la siguiente hoja le explicamos cómo nos encargamos
        de esto por usted.
      </div>
    </div>
  </div>
  <div class="growth-section">
    <div class="growth-eyebrow">Lleve su marca más lejos</div>
    <div class="growth-title">¿Qué puede hacer con su marca? Llévela al siguiente nivel</div>
    <div class="growth-block">
      <div class="growth-icon">${ICON_LICENSE}</div>
      <div>
        <div class="growth-block-title">Cree una licencia de uso y cobre regalías</div>
        <div class="growth-block-desc">
          Registrada su marca, puede autorizar a otros negocios a usarla a cambio de un pago periódico.
          <strong>Es el primer paso para convertir su negocio en una franquicia</strong>: cada licencia que firme es un
          ingreso recurrente nuevo, sin abrir una sucursal más ni invertir capital adicional.
        </div>
      </div>
    </div>
    <div class="growth-block">
      <div class="growth-icon">${ICON_PERCENT}</div>
      <div>
        <div class="growth-block-title">¿Sabía que puede deducir impuestos con su marca?</div>
        <div class="growth-block-desc">
          Su marca ya es un activo intangible de su negocio. Bien estructurada, puede formar parte de su
          contabilidad y sus contratos entre empresas para generar deducciones legales. Potencialice el uso
          de su marca — <strong>ya no es solo un nombre, es un activo más</strong>.
        </div>
        <div class="growth-block-note">Contáctenos junto con su contador y le explicamos cómo, para que él mismo lo verifique.</div>
      </div>
    </div>
    <div class="growth-block">
      <div class="growth-icon">${ICON_SHIELD}</div>
      <div>
        <div class="growth-block-title">Proteja su marca en Amazon y Mercado Libre</div>
        <div class="growth-block-desc">
          Con su marca registrada puede inscribirse en los programas de protección de marca de Amazon y
          Mercado Libre. <strong>Esto le permite reportar y bloquear vendedores que copien sus productos o usen su
          nombre sin permiso</strong>, además de desbloquear herramientas premium de venta y publicidad exclusivas
          para marcas registradas.
        </div>
        <div class="growth-block-note">¿Prefiere que nosotros gestionemos su inscripción? Contáctenos y lo hacemos por usted.</div>
      </div>
    </div>
  </div>
  <div class="p-footer">
    <span>Marca Segura · www.marcasegura.mx</span>
    <span>Este documento no sustituye el título oficial del IMPI</span>
  </div>
</div>
</body></html>`;
}

export function buildHoja3(data, assets) {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@300;500;600;700&family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>${SHARED_STYLE.replace(/<\/?style>/g, '')} body{background:transparent;padding:0;}</style>
</head><body>
<div class="page p3" id="page-render-target">
  <div class="p-header">
    <div>
      <div class="p-sub">Para usted, como cliente Marca Segura</div>
      <div class="p-title">Dos formas de aprovechar hoy</div>
    </div>
    <img class="p-header-logo" src="data:image/png;base64,${assets.msLogoBase64}" alt="Marca Segura">
  </div>
  <div class="service-card featured">
    <div class="service-num">OPCIÓN 1</div>
    <div class="service-title">Monitoreo de Declaración de Uso</div>
    <div class="service-desc">
      No tiene que preocuparse por recordar la fecha: nosotros monitoreamos su expediente y le avisamos
      con tiempo suficiente para presentar su Declaración de Uso ante el IMPI, durante los tres años que dura
      la cobertura. Este servicio normalmente cuesta $3,000 + IVA — pero <strong>por ser cliente Marca Segura,
      hoy lo obtiene en $1,000 MXN</strong> por los tres años.
    </div>
    <div class="service-guarantee">Garantía 100% de satisfacción: si no le avisamos a tiempo, nosotros pagamos el trámite.</div>
    <div class="price-row">
      <div class="price-col">
        <div class="price-label">Precio público</div>
        <div class="price-old">$3,000 + IVA</div>
      </div>
      <div class="price-col">
        <div class="price-label highlight">Su precio, cliente Marca Segura</div>
        <div class="price-new">$1,000 MXN</div>
      </div>
      <span class="price-gift">LE REGALAMOS $2,000</span>
    </div>
    <div class="price-window">Precio especial de cliente Marca Segura — válido solo si contrata dentro de los primeros 30 días tras recibir su título.</div>
  </div>
  <div class="service-card">
    <div class="service-num">OPCIÓN 2</div>
    <div class="service-title">Ayúdele a alguien más a tener su marca</div>
    <div class="service-desc">
      Comparta este código con alguien que necesite registrar su marca. Al escanearlo, se abre un
      WhatsApp directo con nosotros — y en cuanto esa persona haga su trámite, <strong>recibe $1,000 pesos
      de descuento</strong>, cortesía suya.
    </div>
    <div class="qr-row">
      <img src="data:image/png;base64,${assets.qrBase64}" alt="QR de referido">
      <div>
        <div class="qr-caption-title"><span class="qr-caption-icon">${ICON_GIFT}</span>Escanee y comparta</div>
        <div class="qr-caption-desc">Ya tiene su marca — ayúdele a alguien más a tenerla. Comparta este código y su referido tendrá $1,000 pesos de descuento cuando haga su trámite con nosotros.</div>
      </div>
    </div>
  </div>
  <div class="next-page-block">
    <div class="next-page-icon">${ICON_NEXT_PAGE}</div>
    <div>
      <div class="next-page-title">En la siguiente página</div>
      <div class="next-page-desc">Encontrará el título oficial de su marca, emitido por el IMPI.</div>
    </div>
  </div>
  <div class="p-footer">
    <span>Marca Segura · www.marcasegura.mx</span>
    <span>Este documento no sustituye el título oficial del IMPI</span>
  </div>
</div>
</body></html>`;
}
