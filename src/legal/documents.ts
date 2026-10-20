export const LEGAL_TERMS_VERSION = '2026-10-19-v3';
export const LEGAL_PRIVACY_VERSION = '2026-10-19-v3';

export const LEGAL_OPERATOR = {
  name: 'Brayan Alexis Muñoz',
  identification: 'C.C. 1.020.455.625',
  address: 'Carrera 55 # 34-53, Bello, Antioquia, Colombia',
  privacyEmail: 'brayanml93@gmail.com'
};

export const LEGAL_DOCUMENTS = {
  privacy: {
    title: 'Política de tratamiento de datos personales',
    version: LEGAL_PRIVACY_VERSION,
    sections: [
      {
        title: 'Responsable y alcance',
        paragraphs: [
          `El responsable de Stetik es ${LEGAL_OPERATOR.name}, identificado como ${LEGAL_OPERATOR.identification}, con domicilio en ${LEGAL_OPERATOR.address}. Para consultas o solicitudes sobre datos personales: ${LEGAL_OPERATOR.privacyEmail}.`,
          'Esta política describe el tratamiento que realiza Stetik sobre la cuenta del profesional que usa el servicio. No reemplaza el aviso de privacidad ni la autorización que cada profesional debe entregar a sus propios clientes.'
        ]
      },
      {
        title: 'Datos tratados y finalidades',
        paragraphs: [
          'Podemos tratar datos de cuenta e identificación del profesional, correo electrónico, datos de autenticación, información de suscripción y facturación, y datos técnicos necesarios para proteger y operar el servicio.',
          'El profesional puede almacenar datos de sus clientes, como nombre, contacto, citas, servicios, pagos, notas, documentos de identidad, fotografías, firmas e información relacionada con procedimientos. Estos últimos pueden incluir datos sensibles o de salud.',
          'Usamos los datos para crear y proteger cuentas, prestar las funciones de agenda y gestión, mantener respaldos y registros técnicos, atender solicitudes, procesar suscripciones, prevenir fraude y cumplir obligaciones legales. No vendemos datos personales ni usamos datos de clientes para publicidad.'
        ]
      },
      {
        title: 'Datos de clientes y datos sensibles',
        paragraphs: [
          'El profesional que registra información de sus clientes decide para qué la usa y debe actuar como responsable del tratamiento frente a ellos. Stetik presta herramientas de almacenamiento y gestión y trata esa información para operar el servicio según las instrucciones del profesional.',
          'El profesional debe informar a cada cliente, obtener antes de cargar los datos la autorización que corresponda —incluida autorización explícita cuando se traten datos sensibles—, permitir el ejercicio de sus derechos y limitar la información a lo estrictamente necesario. No cargue datos de salud, identificaciones, imágenes o firmas si no cuenta con una base legal válida y las autorizaciones requeridas.',
          'Stetik no valida la suficiencia de las autorizaciones del profesional. La plantilla de consentimiento de procedimiento de la aplicación no constituye por sí sola una autorización de tratamiento de datos ni reemplaza una historia clínica, un consentimiento médico individualizado o los deberes de conservación aplicables.'
        ]
      },
      {
        title: 'Proveedores y transferencias',
        paragraphs: [
          'Para prestar el servicio utilizamos Firebase/Google Cloud para autenticación, base de datos, funciones y almacenamiento, y Mercado Pago para suscripciones. Estos proveedores reciben los datos estrictamente necesarios para sus funciones y pueden tratarlos de acuerdo con sus propios términos y ubicaciones de infraestructura.',
          'La ubicación efectiva del proyecto de Firebase, las transferencias internacionales aplicables y los contratos con encargados deben verificarse y documentarse por el operador antes del lanzamiento.'
        ]
      },
      {
        title: 'Derechos, solicitudes y conservación',
        paragraphs: [
          'Las personas pueden solicitar conocer, actualizar y rectificar sus datos, pedir prueba de la autorización, conocer el uso dado, presentar consultas o reclamos, y solicitar la revocatoria o supresión cuando proceda conforme a la ley. Las solicitudes dirigidas a Stetik pueden enviarse a ' + LEGAL_OPERATOR.privacyEmail + '. Para datos de clientes gestionados por un profesional, contacte primero al profesional responsable.',
          'Conservamos la información mientras la cuenta esté activa y durante el tiempo adicional necesario para prestar el servicio, atender reclamaciones y cumplir obligaciones legales. Deben definirse plazos concretos de conservación, eliminación y copias de respaldo antes del lanzamiento.',
          'Si una solicitud no es atendida conforme al procedimiento legal, la persona puede acudir ante la Superintendencia de Industria y Comercio, una vez agotado el trámite correspondiente ante el responsable.'
        ]
      },
      {
        title: 'Seguridad, cambios y contacto',
        paragraphs: [
          'Aplicamos controles técnicos y organizativos razonables para proteger los datos. Ningún servicio en Internet puede prometer seguridad absoluta; el profesional también debe proteger sus credenciales, dispositivos y acceso a la información de sus clientes.',
          'La aplicación utiliza almacenamiento y tecnologías de sesión necesarios para autenticación y operación. Actualmente no integra herramientas de analítica ni publicidad; si se incorporan, se actualizará esta política y se solicitarán las opciones de consentimiento que correspondan.',
          'Publicaremos en esta página las versiones vigentes de la política. Los cambios sustanciales se comunicarán por los medios disponibles y, cuando sea necesario, solicitaremos una nueva aceptación.',
          'La política debe revisarse conforme a la Ley 1581 de 2012 y su reglamentación, incluida la compilación aplicable del Decreto 1074 de 2015.',
          `Responsable: ${LEGAL_OPERATOR.name}. Domicilio: ${LEGAL_OPERATOR.address}. Correo: ${LEGAL_OPERATOR.privacyEmail}.`
        ]
      }
    ]
  },
  terms: {
    title: 'Términos y condiciones',
    version: LEGAL_TERMS_VERSION,
    sections: [
      {
        title: 'Proveedor y aceptación',
        paragraphs: [
          `Stetik es operada por ${LEGAL_OPERATOR.name}, identificado como ${LEGAL_OPERATOR.identification}, con domicilio en ${LEGAL_OPERATOR.address}. Contacto: ${LEGAL_OPERATOR.privacyEmail}. Estos términos deben revisarse jurídicamente antes de considerarse definitivos.`,
          'Al crear una cuenta o continuar usando el servicio después de aceptar estos términos, usted manifiesta que tiene al menos 18 años, que puede celebrar este acuerdo y que acepta la versión indicada. Si actúa en nombre de un negocio, declara tener facultades para hacerlo.'
        ]
      },
      {
        title: 'El servicio y sus límites',
        paragraphs: [
          'Stetik es una herramienta de gestión para profesionales independientes: puede incluir agenda, clientes, notas, fotografías, consentimientos, ventas, pagos e inventario. Las funciones disponibles pueden cambiar; informaremos los cambios que afecten materialmente el servicio.',
          'La aplicación no es un servicio de urgencias, no presta atención médica, no valida credenciales profesionales y no sustituye historias clínicas, sistemas contables, asesoría jurídica ni copias de seguridad independientes. El profesional conserva la responsabilidad sobre sus servicios, licencias, decisiones, registros y cumplimiento de los plazos legales de conservación.'
        ]
      },
      {
        title: 'Cuenta y uso permitido',
        paragraphs: [
          'Usted debe proporcionar información veraz, custodiar sus credenciales, mantener actualizado su correo y notificarnos cualquier uso no autorizado. Es responsable de la actividad realizada desde su cuenta.',
          'No cargue información sin autorización o base jurídica válida; no use el servicio para vulnerar derechos de terceros, enviar contenido ilícito, interferir con la plataforma o acceder a cuentas ajenas. No registre información de menores de edad en Stetik.',
          'Usted conserva sus derechos sobre el contenido que carga y nos autoriza a alojarlo, reproducirlo y procesarlo únicamente en la medida necesaria para prestar, proteger y mantener el servicio.'
        ]
      },
      {
        title: 'Planes, precio y renovación',
        paragraphs: [
          'El plan gratuito tiene los límites que se muestran en la aplicación. El plan Premium cuesta actualmente $19.900 COP por mes, cobrado de forma recurrente a través de Mercado Pago. Antes de confirmar el pago, revise en Mercado Pago el importe, la frecuencia y las condiciones que allí se presenten.',
          'Al autorizar la suscripción en Mercado Pago, usted autoriza los cobros recurrentes según el ciclo indicado allí. La suscripción puede cancelarse en cualquier momento desde la sección Planes de Stetik; la cancelación detiene futuras renovaciones y el acceso Premium se mantiene hasta el final del período ya pagado, salvo que la ley aplicable disponga otra cosa.',
          'Los derechos de retracto, reversión de pago, garantías, reembolsos y demás derechos del consumidor se respetan en los casos y plazos previstos por la ley colombiana. Esta cláusula no los limita. Cualquier cambio de precio se informará antes de que entre en vigor para una renovación.'
        ]
      },
      {
        title: 'Datos personales y contenido de clientes',
        paragraphs: [
          'El tratamiento de datos personales por la plataforma se describe en la Política de tratamiento de datos personales. Al usar funciones que guardan datos de clientes, usted actúa como responsable frente a esas personas y debe entregar su propio aviso de privacidad, obtener las autorizaciones necesarias —en especial para datos sensibles— y atender sus solicitudes.',
          'Usted nos instruye para alojar y procesar esos datos con el fin de operar las funciones solicitadas. No cargue datos que no sean necesarios ni información de personas que no hayan sido debidamente informadas.'
        ]
      },
      {
        title: 'Disponibilidad, suspensión y terminación',
        paragraphs: [
          'Procuramos mantener el servicio disponible, pero puede haber interrupciones por mantenimiento, incidentes o causas fuera de nuestro control. No garantizamos disponibilidad ininterrumpida.',
          'Podemos restringir temporalmente una cuenta ante riesgos de seguridad, uso ilícito o incumplimientos, procurando informar el motivo y permitir su corrección cuando sea posible. Usted puede dejar de usar el servicio y cancelar su plan desde la sección Planes. La eliminación de cuenta y los plazos de conservación deben solicitarse al contacto del proveedor hasta que exista una función de autoservicio.'
        ]
      },
      {
        title: 'Responsabilidad y ley aplicable',
        paragraphs: [
          'Nada en estos términos excluye derechos irrenunciables del consumidor ni responsabilidades que legalmente no puedan excluirse. El uso profesional de la plataforma no convierte a Stetik en prestador de los servicios que usted ofrece a sus clientes.',
          'Estos términos se rigen por las leyes de Colombia. Las controversias estarán sujetas a las autoridades y jurisdicción competentes, sin perjuicio de los derechos que asisten a consumidores y usuarios.'
        ]
      },
      {
        title: 'Contacto y cambios',
        paragraphs: [
          `Para consultas o reclamaciones: ${LEGAL_OPERATOR.privacyEmail}. Proveedor: ${LEGAL_OPERATOR.name}; domicilio: ${LEGAL_OPERATOR.address}.`,
          'La versión vigente, su fecha y su registro de aceptación se conservarán en la aplicación. Si un cambio requiere nueva aceptación, la aplicación la solicitará antes de permitir continuar. La relación de consumo debe revisarse conforme a la Ley 1480 de 2011 y sus modificaciones vigentes.'
        ]
      }
    ]
  }
} as const;
