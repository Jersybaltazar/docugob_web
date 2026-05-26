import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de privacidad — DocuGob",
  description:
    "Política de privacidad y tratamiento de datos personales de DocuGob, conforme a la Ley N° 29733 de Protección de Datos Personales del Perú.",
};

const LAST_UPDATE = "26 de mayo de 2026";

export default function PrivacidadPage() {
  return (
    <article className="space-y-8 text-[15px] leading-relaxed text-foreground">
      <header className="space-y-3 border-b pb-6">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Documento legal
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Política de privacidad y tratamiento de datos personales
        </h1>
        <p className="text-sm text-muted-foreground">
          Última actualización: {LAST_UPDATE}
        </p>
      </header>

      <Section title="1. Marco legal">
        <p>
          La presente política se emite en cumplimiento de la{" "}
          <strong>
            Ley N° 29733 — Ley de Protección de Datos Personales del Perú
          </strong>{" "}
          y su Reglamento aprobado por D.S. N° 003-2013-JUS, así como
          normativa concordante emitida por la Autoridad Nacional de
          Protección de Datos Personales (ANPD) del Ministerio de Justicia y
          Derechos Humanos.
        </p>
        <p>
          Esta política describe qué datos personales recopilamos al usar la
          plataforma DocuGob, con qué finalidad los tratamos, con quiénes los
          compartimos y cómo puedes ejercer tus derechos.
        </p>
      </Section>

      <Section title="2. Identificación del titular del banco de datos">
        <p>
          Responsable del tratamiento:{" "}
          <strong>Jersy Claudio Baltazar</strong>, persona natural con DNI N°{" "}
          <strong>74070089</strong>, con domicilio en Jr. Los Pinos 129,
          distrito de Pillco Marca, provincia y departamento de Huánuco,
          Perú.
        </p>
        <p>
          Canal de contacto para asuntos de privacidad y ejercicio de
          derechos:{" "}
          <a
            href="mailto:jersy.baltazar.c@gmail.com"
            className="text-primary underline-offset-4 hover:underline"
          >
            jersy.baltazar.c@gmail.com
          </a>
          .
        </p>
      </Section>

      <Section title="3. Datos personales que recopilamos">
        <p>De acuerdo con la funcionalidad utilizada, tratamos:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Datos de identificación y contacto:</strong> nombre
            completo, correo electrónico, nombre de la entidad u organización
            a la que perteneces.
          </li>
          <li>
            <strong>Credenciales de acceso:</strong> contraseña almacenada
            como <em>hash</em> con algoritmo seguro (bcrypt). Nunca almacenamos
            tu contraseña en texto claro.
          </li>
          <li>
            <strong>Datos de actividad:</strong> documentos generados, fecha y
            hora de acceso, dirección IP, tipo de navegador y eventos de
            auditoría necesarios para la trazabilidad del servicio.
          </li>
          <li>
            <strong>Datos de facturación:</strong> plan contratado, historial
            de pagos y suscripción. Los datos completos de tarjeta (número,
            CVV, expiración) <strong>no</strong> son almacenados por DocuGob;
            son tratados directamente por nuestra pasarela de pagos (Culqi).
          </li>
          <li>
            <strong>Contenido del usuario:</strong> documentos, plantillas y
            archivos que cargas o generas, incluyendo posibles datos de
            terceros que tú incluyas en ellos. Tú eres responsable de incluir
            o no datos personales en ese contenido.
          </li>
        </ul>
      </Section>

      <Section title="4. Finalidades del tratamiento">
        <p>Los datos se tratan con los siguientes fines:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Gestionar tu cuenta, autenticación, recuperación de contraseña y
            verificación de correo electrónico.
          </li>
          <li>
            Prestar el servicio de generación, almacenamiento y descarga de
            documentos.
          </li>
          <li>
            Cobrar las suscripciones, emitir comprobantes y dar soporte de
            facturación.
          </li>
          <li>
            Enviarte comunicaciones operativas (cambios en el servicio,
            avisos de seguridad, recordatorios de cobro). Estos correos no
            son opcionales mientras tu cuenta esté activa.
          </li>
          <li>
            Mejorar la calidad del servicio, detectar abusos y prevenir
            fraudes mediante análisis agregado y trazabilidad de eventos.
          </li>
          <li>Cumplir obligaciones legales, contables y tributarias.</li>
        </ul>
        <p>
          No realizamos perfilado automatizado con efectos jurídicos sobre
          los titulares ni vendemos tus datos a terceros con fines
          publicitarios.
        </p>
      </Section>

      <Section title="5. Base legal del tratamiento">
        <p>
          El tratamiento se realiza con las siguientes bases legitimadoras
          previstas en la Ley N° 29733 y su Reglamento:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Consentimiento</strong> que otorgas al registrarte y
            aceptar esta política.
          </li>
          <li>
            <strong>Ejecución contractual</strong>, para prestar el servicio
            que has solicitado y cobrar la suscripción.
          </li>
          <li>
            <strong>Cumplimiento de obligaciones legales</strong> en materia
            tributaria, contable y de protección al consumidor.
          </li>
          <li>
            <strong>Interés legítimo</strong> del Titular para fines
            limitados de seguridad de la información, prevención de fraude y
            mejora del servicio, siempre que no prevalezcan los derechos del
            titular de los datos.
          </li>
        </ul>
      </Section>

      <Section title="6. Encargados y terceros con acceso">
        <p>
          Para operar la plataforma compartimos datos estrictamente
          necesarios con los siguientes <em>encargados del tratamiento</em>,
          quienes los procesan por cuenta nuestra bajo obligación de
          confidencialidad:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Supabase</strong> (Estados Unidos / Unión Europea) —
            base de datos PostgreSQL y almacenamiento.
          </li>
          <li>
            <strong>Render</strong> (Estados Unidos) — hosting de la API
            (backend).
          </li>
          <li>
            <strong>Vercel</strong> (Estados Unidos) — hosting del frontend.
          </li>
          <li>
            <strong>Resend</strong> (Estados Unidos / Unión Europea) — envío
            de correos transaccionales (verificación, recuperación,
            notificaciones).
          </li>
          <li>
            <strong>Culqi</strong> (Perú) — procesamiento de pagos con
            tarjeta.
          </li>
          <li>
            <strong>Google (Gemini API)</strong> (Estados Unidos) — modelo
            de inteligencia artificial para asistir en la redacción del
            cuerpo de los documentos.
          </li>
          <li>
            <strong>Sentry</strong> (Estados Unidos) — monitoreo de errores
            técnicos. Recibe únicamente metadatos del error (mensaje de
            excepción, ruta del incidente, navegador, código de estado);
            los datos personales (correo, contraseña, tokens, identidad
            del usuario) son filtrados <em>antes</em> de salir de
            nuestros servidores.
          </li>
        </ul>
        <p>
          Estos proveedores cuentan con sus propias políticas de privacidad y
          aplican estándares internacionales de seguridad. Solo procesan los
          datos para la finalidad encargada por DocuGob.
        </p>
      </Section>

      <Section title="7. Transferencias internacionales">
        <p>
          Algunos de los encargados listados operan fuera del territorio
          peruano. En ese sentido, declaras conocer y aceptar que tus datos
          podrán ser transferidos a Estados Unidos y/o la Unión Europea con
          el único propósito de prestar el servicio que has contratado,
          conforme al artículo 15 de la Ley N° 29733.
        </p>
        <p>
          Estas transferencias se realizan bajo cláusulas contractuales y
          medidas técnicas que aseguran un nivel adecuado de protección
          equivalente al previsto por la normativa peruana.
        </p>
      </Section>

      <Section title="8. Plazo de conservación">
        <p>
          Conservamos tus datos personales mientras tu cuenta permanezca
          activa. Tras la cancelación de la cuenta, los datos y documentos
          generados se conservan durante un plazo de{" "}
          <strong>cinco (5) años</strong> con el único fin de atender
          eventuales requerimientos legales, contables, tributarios o de
          fiscalización por parte de autoridades competentes. Cumplido ese
          plazo, los datos son eliminados o anonimizados.
        </p>
        <p>
          Puedes solicitar la eliminación anticipada de tus datos en cualquier
          momento, salvo aquellos cuya conservación esté impuesta por una
          obligación legal vigente.
        </p>
      </Section>

      <Section title="9. Medidas de seguridad">
        <p>
          Aplicamos medidas técnicas y organizativas razonables para proteger
          tus datos, entre ellas:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Cifrado en tránsito (HTTPS / TLS) en todas las comunicaciones.
          </li>
          <li>
            Almacenamiento de contraseñas con <em>hashing</em> bcrypt y
            tokens de sesión con expiración corta.
          </li>
          <li>
            Cookies de sesión <em>HttpOnly</em> y <em>Secure</em>, no
            accesibles desde JavaScript del navegador.
          </li>
          <li>
            Aislamiento de datos por organización (multi-tenant) a nivel de
            aplicación.
          </li>
          <li>
            Registros de auditoría inmutables con encadenamiento por hash
            para eventos sensibles.
          </li>
          <li>
            Control de acceso basado en roles y mínimos privilegios sobre la
            infraestructura.
          </li>
        </ul>
        <p>
          Pese a estas medidas, ningún sistema es absolutamente invulnerable.
          En caso de un incidente de seguridad que afecte tus datos
          personales, te notificaremos dentro de los plazos exigidos por la
          normativa.
        </p>
      </Section>

      <Section title="10. Derechos del titular de los datos">
        <p>
          Conforme a los artículos 18 a 24 de la Ley N° 29733, en todo
          momento puedes ejercer los siguientes derechos sobre tus datos
          personales:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Acceso:</strong> obtener información sobre los datos
            personales tuyos que tratamos.
          </li>
          <li>
            <strong>Rectificación:</strong> corregir datos inexactos o
            incompletos.
          </li>
          <li>
            <strong>Cancelación / supresión:</strong> solicitar la
            eliminación de tus datos cuando ya no sean necesarios o cuando
            revoques tu consentimiento.
          </li>
          <li>
            <strong>Oposición:</strong> oponerte al tratamiento de tus datos
            por motivos legítimos.
          </li>
          <li>
            <strong>Revocación del consentimiento:</strong> retirar el
            consentimiento previamente otorgado, sin efectos retroactivos.
          </li>
          <li>
            <strong>Información:</strong> conocer cuáles son los encargados y
            terceros que tratan tus datos por cuenta nuestra.
          </li>
        </ul>
      </Section>

      <Section title="11. Cómo ejercer tus derechos">
        <p>
          Para ejercer cualquiera de los derechos antes señalados, envíanos
          una solicitud al correo{" "}
          <a
            href="mailto:jersy.baltazar.c@gmail.com"
            className="text-primary underline-offset-4 hover:underline"
          >
            jersy.baltazar.c@gmail.com
          </a>{" "}
          adjuntando:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Tus nombres completos, número de DNI o documento de identidad
            equivalente.
          </li>
          <li>
            Descripción clara del derecho que deseas ejercer y los datos
            específicos sobre los que recae.
          </li>
          <li>Una dirección de correo válida para responder.</li>
        </ul>
        <p>
          Atenderemos la solicitud dentro de los plazos previstos por la Ley
          N° 29733 (en general, hasta 20 días hábiles). Si consideras que tu
          solicitud no fue atendida adecuadamente, puedes presentar un
          reclamo ante la <strong>Autoridad Nacional de Protección de
          Datos Personales (ANPD)</strong> del Ministerio de Justicia y
          Derechos Humanos.
        </p>
      </Section>

      <Section title="12. Cookies y tecnologías similares">
        <p>
          DocuGob utiliza cookies estrictamente necesarias para mantener la
          sesión iniciada, recordar tus preferencias de interfaz y proteger
          el servicio frente a usos abusivos. Estas cookies no requieren
          consentimiento previo por ser indispensables para el funcionamiento
          del servicio.
        </p>
        <p>
          Actualmente no utilizamos cookies de publicidad ni cookies de
          rastreo de terceros con fines comerciales. Si esto cambia, se
          actualizará esta política y, cuando corresponda, se solicitará tu
          consentimiento explícito.
        </p>
      </Section>

      <Section title="13. Menores de edad">
        <p>
          El Servicio no está dirigido a menores de 18 años. No recopilamos
          intencionalmente datos personales de menores. Si detectamos que se
          ha creado una cuenta en nombre de un menor sin autorización del
          padre, madre o tutor legal, procederemos a cerrarla.
        </p>
      </Section>

      <Section title="14. Cambios en esta política">
        <p>
          Esta política puede actualizarse cuando cambien las prácticas de
          tratamiento, los proveedores empleados o la normativa aplicable. La
          versión vigente siempre estará publicada en esta página con su
          fecha de actualización. Cuando los cambios afecten derechos del
          titular de forma sustancial, se notificarán al correo registrado.
        </p>
      </Section>

      <Section title="15. Contacto">
        <p>
          Para cualquier consulta sobre esta política o el tratamiento de
          tus datos personales, escribe a{" "}
          <a
            href="mailto:jersy.baltazar.c@gmail.com"
            className="text-primary underline-offset-4 hover:underline"
          >
            jersy.baltazar.c@gmail.com
          </a>
          .
        </p>
      </Section>
    </article>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <div className="space-y-3 text-muted-foreground">{children}</div>
    </section>
  );
}
