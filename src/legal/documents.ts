export const LEGAL_TERMS_VERSION = '2026-10-19-v4';
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
          'Para prestar el servicio utilizamos Firebase/Google Cloud para autenticación, base de datos, funciones y almacenamiento; Mercado Pago para suscripciones; y la plataforma WhatsApp Business de Meta para enviar confirmaciones y recordatorios de citas a quienes lo autorizaron. Estos proveedores reciben los datos estrictamente necesarios para sus funciones, como el nombre, el teléfono y los datos de la cita en el caso de WhatsApp, y los tratan de acuerdo con sus propios términos.',
          'Estos proveedores pueden almacenar o procesar la información en servidores ubicados fuera de Colombia, incluidos los Estados Unidos. Al aceptar esta política, el titular autoriza esa transferencia internacional, que se realiza únicamente para prestar el servicio y con proveedores que aplican medidas de seguridad sobre los datos.'
        ]
      },
      {
        title: 'Derechos, solicitudes y conservación',
        paragraphs: [
          'Las personas pueden solicitar conocer, actualizar y rectificar sus datos, pedir prueba de la autorización, conocer el uso dado, presentar consultas o reclamos, y solicitar la revocatoria o supresión cuando proceda conforme a la ley. Las solicitudes dirigidas a Stetik pueden enviarse a ' + LEGAL_OPERATOR.privacyEmail + '. Para datos de clientes gestionados por un profesional, contacte primero al profesional responsable.',
          'Conservamos la información mientras la cuenta esté activa. Para eliminar tu cuenta y tus datos, escribe a ' + LEGAL_OPERATOR.privacyEmail + ' desde el correo con el que te registraste. Atenderemos la solicitud en un plazo máximo de 15 días hábiles, y en ese plazo eliminaremos la cuenta, sus datos y los de los clientes registrados en ella. Las copias de respaldo, si existen, se eliminan de forma automática en un máximo de 90 días adicionales. Solo conservaremos, durante el tiempo que exija la ley, la información que debamos guardar por obligaciones legales, contables o tributarias, como los registros de pagos y la prueba de aceptación de estos documentos.',
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
        title: '1. Proveedor, ámbito y aceptación',
        paragraphs: [
          `Stetik es un servicio operado por ${LEGAL_OPERATOR.name}, identificado con ${LEGAL_OPERATOR.identification}, con domicilio en ${LEGAL_OPERATOR.address}. Para consultas, solicitudes o reclamaciones puede escribir a ${LEGAL_OPERATOR.privacyEmail}.`,
          'Estos términos regulan el acceso y uso de Stetik por personas ubicadas en Colombia. Al crear una cuenta, marcar la casilla de aceptación o usar el servicio después de aceptar la versión vigente, usted celebra este acuerdo con el operador y declara que tiene al menos 18 años y capacidad para aceptarlo. Si actúa por una empresa o negocio, declara contar con autorización para representarlo.'
        ]
      },
      {
        title: '2. El servicio',
        paragraphs: [
          'Stetik ofrece herramientas digitales de gestión para profesionales independientes, que pueden incluir agenda, clientes, notas, fotografías, formatos de consentimiento, ventas, pagos e inventario. Las funciones y límites de cada plan se describen en la aplicación y pueden variar según el plan contratado.',
          'Stetik es una herramienta de gestión y no presta servicios médicos, estéticos, contables ni jurídicos; tampoco verifica licencias, habilitaciones o credenciales profesionales. No reemplaza una historia clínica, los registros profesionales exigidos por la ley ni las copias de respaldo que el usuario deba conservar. El profesional es responsable de sus servicios, decisiones, autorizaciones, registros y obligaciones frente a sus clientes.'
        ]
      },
      {
        title: '3. Cuenta y obligaciones del usuario',
        paragraphs: [
          'El usuario debe proporcionar información veraz y actualizada, mantener la confidencialidad de sus credenciales, proteger sus dispositivos y notificar oportunamente cualquier uso no autorizado de su cuenta. El usuario es responsable de las actividades realizadas desde su cuenta.',
          'El usuario debe usar Stetik conforme a la ley y a estos términos. No debe acceder a cuentas ajenas, interferir con la seguridad o funcionamiento de la plataforma, cargar contenido ilícito ni vulnerar derechos de otras personas. No se permite registrar en Stetik datos personales de menores de edad.',
          'El usuario conserva los derechos que tenga sobre la información y el contenido que incorpora. Autoriza a Stetik a alojarlos y procesarlos solo en la medida necesaria para prestar, proteger y mantener las funciones solicitadas.'
        ]
      },
      {
        title: '4. Planes, precio, cobro y cancelación',
        paragraphs: [
          'El plan gratuito está sujeto a los límites informados en la aplicación. El plan Premium tiene un precio actual de $29.900 COP por mes, o $149.400 COP por 6 meses cobrados en un solo pago (equivalente a $24.900 COP por mes). Los pagos recurrentes son procesados por Mercado Pago, que presenta las condiciones de pago y solicita al usuario autorizar la suscripción.',
          'Al autorizar la suscripción, el usuario acepta que Mercado Pago efectúe el cobro recurrente mensual según las condiciones mostradas al momento de pagar. Stetik no almacena los datos completos de la tarjeta o del medio de pago.',
          'El usuario puede cancelar la renovación desde la sección Planes de Stetik. Una vez confirmada la cancelación, no se generarán nuevos cobros y el acceso Premium se mantendrá hasta finalizar el período pagado, salvo que la ley aplicable o las condiciones del proveedor de pago dispongan otra cosa. Si la cancelación no puede completarse desde la aplicación, el usuario podrá solicitar asistencia al correo de contacto indicado en estos términos.',
          'Los cambios de precio se informarán antes de que se apliquen a una renovación. Los derechos de retracto, reversión del pago, garantías y reembolsos que sean aplicables se atenderán de acuerdo con la legislación colombiana; estos términos no limitan derechos irrenunciables del consumidor.'
        ]
      },
      {
        title: '5. Datos personales y contenido de clientes',
        paragraphs: [
          'El tratamiento de datos personales por Stetik se describe en la Política de tratamiento de datos personales, que forma parte de las condiciones de uso del servicio.',
          'Cuando el usuario incorpora datos de sus clientes, el usuario determina las finalidades y actúa como responsable del tratamiento frente a esas personas. Por ello debe suministrarles la información requerida, obtener la autorización o contar con otra base jurídica válida antes de cargar datos, especialmente datos sensibles, y atender sus solicitudes. El usuario instruye a Stetik para alojar y procesar esa información únicamente para prestar las funciones solicitadas. Debe evitar cargar datos innecesarios o información que no esté autorizado a tratar.'
        ]
      },
      {
        title: '6. Disponibilidad, suspensión y terminación',
        paragraphs: [
          'Stetik procurará mantener el servicio disponible, pero pueden ocurrir interrupciones por mantenimiento, incidentes técnicos o causas ajenas al operador. No se garantiza disponibilidad ininterrumpida.',
          'El operador podrá restringir temporalmente el acceso cuando sea necesario para proteger la seguridad, cumplir la ley o responder a un uso ilícito o incumplimiento de estos términos. Cuando sea posible, informará al usuario el motivo y las medidas para corregir la situación.',
          'El usuario puede dejar de usar Stetik y cancelar su suscripción según estos términos. Para solicitar la eliminación de la cuenta o ejercer derechos sobre los datos, debe escribir al correo de contacto. La eliminación puede estar sujeta a obligaciones legales de conservación y a los plazos necesarios para atender reclamaciones.'
        ]
      },
      {
        title: '7. Responsabilidad y ley aplicable',
        paragraphs: [
          'El usuario es responsable de la exactitud, legalidad y respaldo del contenido que registra, así como de los servicios que ofrece a sus clientes. El uso de Stetik no convierte al operador en prestador, socio ni representante del usuario frente a sus clientes.',
          'Nada en estos términos excluye derechos irrenunciables de los consumidores ni responsabilidades que legalmente no puedan limitarse. Estos términos se rigen por las leyes de Colombia, sin perjuicio de las competencias de las autoridades y los derechos legales de los usuarios.'
        ]
      },
      {
        title: '8. Contacto, vigencia y modificaciones',
        paragraphs: [
          `Proveedor: ${LEGAL_OPERATOR.name}, ${LEGAL_OPERATOR.identification}. Domicilio: ${LEGAL_OPERATOR.address}. Contacto para consultas, solicitudes o reclamaciones: ${LEGAL_OPERATOR.privacyEmail}.`,
          'La versión y la fecha de vigencia de estos términos se indican al inicio del documento. El operador podrá modificarlos para reflejar cambios del servicio o de la ley. Cuando una modificación requiera aceptación, Stetik solicitará al usuario aceptarla antes de continuar usando las funciones protegidas. La versión aceptada y la constancia de aceptación se conservarán electrónicamente.'
        ]
      }
    ]
  }
} as const;
