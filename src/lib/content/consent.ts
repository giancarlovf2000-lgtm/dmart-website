// Texto de consentimiento/autorización de uso de contenido. Versionado para
// dejar registro de qué versión aceptó cada persona (valor legal).
export const CONSENT_VERSION = '2026-07-v1'

export const CONSENT_TEXT =
  "Autorizo a D'Mart Institute a usar el contenido que subo (fotos y videos), incluida mi imagen, " +
  'en sus redes sociales, sitio web, materiales promocionales y campañas de mercadeo, de forma ' +
  'indefinida y sin compensación. Declaro que el contenido es mío o que tengo permiso para compartirlo.'

export const GUARDIAN_TEXT =
  'Soy menor de 18 años y cuento con el permiso de mi padre, madre o tutor legal para subir este ' +
  'contenido y otorgar esta autorización.'

// Límite de tamaño por archivo (debe coincidir con file_size_limit del bucket).
export const MAX_UPLOAD_BYTES = 200 * 1024 * 1024 // 200 MB
