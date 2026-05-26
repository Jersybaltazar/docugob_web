import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos y condiciones — DocuGob",
  description:
    "Términos y condiciones de uso de la plataforma DocuGob, aplicables a todos los usuarios y suscriptores del servicio.",
};

const LAST_UPDATE = "26 de mayo de 2026";

export default function TerminosPage() {
  return (
    <article className="space-y-8 text-[15px] leading-relaxed text-foreground">
      <header className="space-y-3 border-b pb-6">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Documento legal
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Términos y condiciones de uso
        </h1>
        <p className="text-sm text-muted-foreground">
          Última actualización: {LAST_UPDATE}
        </p>
      </header>

      <Section title="1. Identificación del titular">
        <p>
          El presente documento regula el acceso y uso de la plataforma
          DocuGob (en adelante, &laquo;el Servicio&raquo; o
          &laquo;DocuGob&raquo;), disponible en línea bajo el dominio que el
          titular del Servicio determine.
        </p>
        <p>
          El titular del Servicio es <strong>Jersy Claudio Baltazar</strong>,
          persona natural identificada con DNI N° <strong>74070089</strong>,
          con domicilio en Jr. Los Pinos 129, distrito de Pillco Marca,
          provincia y departamento de Huánuco, Perú (en adelante, &laquo;el
          Titular&raquo;).
        </p>
        <p>
          Para consultas relacionadas con estos términos puedes escribir a{" "}
          <a
            href="mailto:jersy.baltazar.c@gmail.com"
            className="text-primary underline-offset-4 hover:underline"
          >
            jersy.baltazar.c@gmail.com
          </a>
          .
        </p>
      </Section>

      <Section title="2. Aceptación de los términos">
        <p>
          Al crear una cuenta, suscribirte a un plan o utilizar cualquier
          funcionalidad del Servicio, manifiestas haber leído, entendido y
          aceptado íntegramente estos Términos y Condiciones, así como la{" "}
          <a
            href="/privacidad"
            className="text-primary underline-offset-4 hover:underline"
          >
            Política de Privacidad
          </a>
          . Si no estás de acuerdo con alguno de los puntos aquí expresados,
          debes abstenerte de usar el Servicio.
        </p>
      </Section>

      <Section title="3. Descripción del Servicio">
        <p>
          DocuGob es una plataforma SaaS (software como servicio) que permite
          a entidades del sector público peruano y a sus colaboradores generar
          documentos administrativos (oficios, memorandos, informes,
          resoluciones, entre otros) a partir de plantillas oficiales, con
          asistencia de inteligencia artificial para la redacción del cuerpo
          del documento.
        </p>
        <p>
          El Servicio incluye, según el plan contratado: generación de
          documentos en formatos .docx y .pdf, almacenamiento de los archivos
          generados, vista previa, asistencia con IA, carga de plantillas con
          membrete propio y soporte por correo electrónico.
        </p>
        <p>
          DocuGob es una herramienta de apoyo a la redacción y formateo. El
          Titular <strong>no certifica</strong> la legalidad, exactitud o
          validez administrativa de los documentos que generes; esa
          responsabilidad recae en quien suscribe y emite el documento dentro
          de su entidad.
        </p>
      </Section>

      <Section title="4. Cuenta de usuario y elegibilidad">
        <p>
          Para acceder al Servicio debes crear una cuenta proporcionando una
          dirección de correo electrónico válida, un nombre completo y el
          nombre de la organización a la que perteneces. Eres responsable de
          mantener la confidencialidad de tu contraseña y de toda la actividad
          que ocurra bajo tu cuenta.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Debes ser mayor de 18 años. El Servicio no está dirigido a menores
            de edad.
          </li>
          <li>
            La información que registras debe ser verídica, completa y
            actualizada.
          </li>
          <li>
            Notifícanos de inmediato cualquier uso no autorizado de tu cuenta
            a la dirección de contacto.
          </li>
          <li>
            El Titular puede suspender o cancelar cuentas que infrinjan estos
            términos o sean utilizadas con fines ilícitos.
          </li>
        </ul>
      </Section>

      <Section title="5. Planes, precios y pagos">
        <p>
          DocuGob ofrece un plan Gratuito (con límite mensual de documentos y
          marca de agua) y planes de suscripción de pago (Profesional e
          Institucional). El detalle vigente de los planes está publicado en
          la página de{" "}
          <a
            href="/pricing"
            className="text-primary underline-offset-4 hover:underline"
          >
            Planes y precios
          </a>
          .
        </p>
        <p>
          Los pagos se procesan a través de pasarelas externas (actualmente
          Culqi). El Titular no almacena en sus servidores los datos
          completos de la tarjeta de crédito o débito; esa información es
          custodiada por el proveedor de pagos.
        </p>
        <p>
          Las suscripciones son <strong>recurrentes mensuales</strong> y se
          renuevan automáticamente hasta que las canceles. Los precios pueden
          ajustarse en el futuro; cualquier cambio aplicará al siguiente
          período de facturación y se te notificará con al menos 15 días de
          anticipación al correo registrado.
        </p>
      </Section>

      <Section title="6. Cancelación y reembolsos">
        <p>
          Puedes cancelar tu suscripción en cualquier momento desde tu panel
          de facturación. La cancelación surte efecto al final del período ya
          pagado: conservas acceso al plan contratado hasta esa fecha, y a
          partir del siguiente ciclo tu cuenta vuelve automáticamente al plan
          Gratuito.
        </p>
        <p>
          <strong>
            El Titular no realiza reembolsos prorrateados ni devoluciones de
            períodos parciales.
          </strong>{" "}
          Si consideras que existe un cobro indebido o un error de
          facturación, escribe a la dirección de contacto dentro de los 30
          días siguientes al cargo para revisar el caso.
        </p>
      </Section>

      <Section title="7. Uso aceptable">
        <p>Al utilizar DocuGob te comprometes a no:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Generar documentos con contenido ilícito, difamatorio, racista,
            que incite a la violencia o que vulnere derechos de terceros.
          </li>
          <li>
            Suplantar la identidad de funcionarios, entidades o terceros, ni
            falsificar firmas, sellos o numeraciones oficiales.
          </li>
          <li>
            Realizar ingeniería inversa, descompilación o intentos de acceso
            no autorizado a la infraestructura del Servicio.
          </li>
          <li>
            Automatizar el uso del Servicio (scraping, bots) más allá de las
            APIs y endpoints expresamente habilitados.
          </li>
          <li>
            Revender, sublicenciar o redistribuir el Servicio sin autorización
            previa y por escrito del Titular.
          </li>
        </ul>
      </Section>

      <Section title="8. Propiedad intelectual">
        <p>
          La plataforma DocuGob, su código, diseño, marca, plantillas
          predeterminadas y demás elementos son propiedad del Titular o de
          sus respectivos licenciantes, y están protegidos por la legislación
          peruana de propiedad intelectual.
        </p>
        <p>
          El Titular te otorga una licencia limitada, no exclusiva,
          intransferible y revocable para usar el Servicio durante la vigencia
          de tu cuenta, exclusivamente para los fines aquí descritos.
        </p>
      </Section>

      <Section title="9. Contenido del usuario y plantillas">
        <p>
          Los documentos que generas y las plantillas con membrete propio que
          subes (en adelante, &laquo;Contenido del Usuario&raquo;) son y
          siguen siendo de tu propiedad o de la entidad para la cual trabajas.
          El Titular no reclama titularidad sobre tu Contenido.
        </p>
        <p>
          Nos otorgas únicamente las licencias necesarias para alojar,
          procesar, renderizar y entregar el Contenido a través del Servicio
          (por ejemplo, convertir tu .docx a .pdf, mostrar la vista previa,
          enviarte el documento generado).
        </p>
        <p>
          Eres el único responsable por la legalidad, exactitud y veracidad de
          tu Contenido. El Titular podrá remover Contenido que infrinja la
          ley o estos términos previa notificación al correo registrado,
          salvo casos urgentes.
        </p>
      </Section>

      <Section title="10. Disponibilidad del Servicio">
        <p>
          El Titular hará esfuerzos comercialmente razonables para mantener
          el Servicio disponible las 24 horas, los 7 días de la semana, pero
          <strong> no garantiza disponibilidad ininterrumpida</strong>. El
          Servicio puede tener interrupciones por mantenimiento programado,
          incidentes técnicos, fallas de proveedores externos o causas de
          fuerza mayor.
        </p>
        <p>
          Para mantenimientos planificados que requieran caída de servicio
          superior a 30 minutos, el Titular avisará al menos con 24 horas de
          anticipación mediante correo electrónico o aviso en la plataforma.
        </p>
      </Section>

      <Section title="11. Limitación de responsabilidad">
        <p>
          En la máxima medida permitida por la legislación peruana, el
          Titular no será responsable por:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Daños indirectos, lucro cesante, pérdida de oportunidad o daño
            moral derivado del uso o imposibilidad de uso del Servicio.
          </li>
          <li>
            Decisiones administrativas, sanciones o consecuencias derivadas
            del uso del Contenido generado a través de la plataforma.
          </li>
          <li>
            Pérdida o corrupción de datos por causas atribuibles a
            proveedores externos (hosting, base de datos, IA, correo) en los
            casos en que se hayan adoptado las medidas técnicas razonables.
          </li>
        </ul>
        <p>
          En todo caso, la responsabilidad total del Titular frente a un
          usuario por cualquier reclamo relacionado con el Servicio se limita
          al monto efectivamente pagado por dicho usuario durante los 6 meses
          anteriores al hecho que origina el reclamo.
        </p>
      </Section>

      <Section title="12. Modificaciones del Servicio y de los términos">
        <p>
          El Titular puede modificar, suspender o discontinuar funciones del
          Servicio en cualquier momento. Cuando un cambio afecte de forma
          sustancial los derechos del usuario, se notificará con al menos 15
          días de anticipación al correo registrado.
        </p>
        <p>
          Estos Términos pueden actualizarse periódicamente. La versión
          vigente siempre estará publicada en esta página, con la fecha de
          última actualización al inicio del documento. El uso continuado del
          Servicio luego de un cambio constituye aceptación de la nueva
          versión.
        </p>
      </Section>

      <Section title="13. Terminación">
        <p>
          Puedes cerrar tu cuenta en cualquier momento desde la configuración
          o solicitándolo al correo de contacto. El Titular podrá suspender o
          cerrar tu cuenta, previa notificación razonable, si infringes estos
          términos, si la cuenta presenta riesgos de seguridad o si la
          actividad es manifiestamente ilícita.
        </p>
      </Section>

      <Section title="14. Comunicaciones y notificaciones">
        <p>
          Todas las notificaciones legales al Titular deben dirigirse al
          correo{" "}
          <a
            href="mailto:jersy.baltazar.c@gmail.com"
            className="text-primary underline-offset-4 hover:underline"
          >
            jersy.baltazar.c@gmail.com
          </a>
          . El Titular notificará al usuario en el correo electrónico
          registrado en la cuenta; es responsabilidad del usuario mantener
          esa dirección operativa y actualizada.
        </p>
      </Section>

      <Section title="15. Ley aplicable y jurisdicción">
        <p>
          Estos Términos se rigen por las leyes de la República del Perú.
          Toda controversia que surja de su interpretación o ejecución se
          someterá a los jueces y tribunales competentes del Distrito
          Judicial de Huánuco, con renuncia expresa a cualquier otro fuero.
        </p>
      </Section>

      <Section title="16. Disposiciones generales">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Si alguna cláusula de estos Términos fuera declarada nula o
            inejecutable, las demás conservarán plena validez.
          </li>
          <li>
            La tolerancia del Titular ante una infracción no implica renuncia
            a ejercer sus derechos en infracciones posteriores.
          </li>
          <li>
            No podrás ceder tu cuenta o tus derechos bajo estos Términos sin
            autorización previa y por escrito del Titular.
          </li>
        </ul>
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
