export default function PrivacidadPage() {
  return (
    <div className="bg-white">
      <div className="container mx-auto px-6 py-16 max-w-4xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Política de Privacidad</h1>

        <div className="prose prose-lg max-w-none">
          <p className="text-gray-600 mb-6">
            Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introducción</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              En Llanero, respetamos su privacidad y nos comprometemos a proteger sus datos personales.
              Esta Política de Privacidad explica cómo recopilamos, usamos, compartimos y protegemos su información
              cuando utiliza nuestra aplicación móvil y servicios.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Información que Recopilamos</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2.1 Información que Usted Proporciona</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li><strong>Información de cuenta:</strong> nombre, correo electrónico, número de teléfono, contraseña</li>
              <li><strong>Información de entrega:</strong> direcciones de entrega, instrucciones especiales</li>
              <li><strong>Información de pago:</strong> datos de tarjetas de crédito/débito, información de facturación</li>
              <li><strong>Preferencias:</strong> favoritos, historial de pedidos, preferencias alimentarias</li>
              <li><strong>Comunicaciones:</strong> mensajes de soporte, calificaciones y reseñas</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2.2 Información Recopilada Automáticamente</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li><strong>Información del dispositivo:</strong> modelo, sistema operativo, identificadores únicos</li>
              <li><strong>Datos de ubicación:</strong> ubicación GPS para rastreo de entregas y mostrar establecimientos cercanos</li>
              <li><strong>Datos de uso:</strong> interacciones con la app, páginas visitadas, tiempo de uso</li>
              <li><strong>Información de red:</strong> dirección IP, proveedor de servicios</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Cómo Usamos su Información</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Utilizamos la información recopilada para:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Procesar y entregar sus pedidos</li>
              <li>Comunicarnos con usted sobre sus pedidos y cuenta</li>
              <li>Procesar pagos y prevenir fraudes</li>
              <li>Proporcionar soporte al cliente</li>
              <li>Personalizar su experiencia y mostrar contenido relevante</li>
              <li>Mejorar nuestros servicios y desarrollar nuevas funcionalidades</li>
              <li>Enviar notificaciones sobre promociones y ofertas (con su consentimiento)</li>
              <li>Cumplir con obligaciones legales y resolver disputas</li>
              <li>Realizar análisis y estudios de mercado</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Compartir Información</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Podemos compartir su información con:
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">4.1 Socios Comerciales</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li><strong>Establecimientos:</strong> compartimos la información necesaria del pedido con bodegones y restaurantes</li>
              <li><strong>Repartidores:</strong> compartimos información de entrega y contacto para completar entregas</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">4.2 Proveedores de Servicios</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Procesadores de pago</li>
              <li>Servicios de hosting y almacenamiento en la nube</li>
              <li>Servicios de análisis y marketing</li>
              <li>Proveedores de atención al cliente</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">4.3 Requisitos Legales</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Podemos divulgar información cuando sea requerido por ley, orden judicial, o para proteger nuestros
              derechos, seguridad o la de otros usuarios.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Seguridad de Datos</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Implementamos medidas de seguridad técnicas y organizativas para proteger su información personal:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Encriptación de datos en tránsito y en reposo</li>
              <li>Controles de acceso estrictos</li>
              <li>Monitoreo regular de sistemas</li>
              <li>Auditorías de seguridad periódicas</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-4">
              Sin embargo, ningún sistema es 100% seguro. No podemos garantizar la seguridad absoluta de su información.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Retención de Datos</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Conservamos su información personal durante el tiempo necesario para cumplir con los propósitos
              descritos en esta política, a menos que la ley requiera o permita un período de retención más largo.
              Cuando su información ya no sea necesaria, la eliminaremos o anonimizaremos de forma segura.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Sus Derechos</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Usted tiene derecho a:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li><strong>Acceder:</strong> solicitar una copia de sus datos personales</li>
              <li><strong>Rectificar:</strong> corregir información inexacta o incompleta</li>
              <li><strong>Eliminar:</strong> solicitar la eliminación de sus datos personales</li>
              <li><strong>Restringir:</strong> limitar el procesamiento de sus datos</li>
              <li><strong>Portabilidad:</strong> recibir sus datos en un formato estructurado</li>
              <li><strong>Oponerse:</strong> rechazar ciertos usos de su información</li>
              <li><strong>Retirar consentimiento:</strong> retirar el consentimiento previamente otorgado</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-4">
              Para ejercer estos derechos, contáctenos a través de privacidad@llanero.app
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Cookies y Tecnologías Similares</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Utilizamos cookies y tecnologías similares para:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Mantener su sesión activa</li>
              <li>Recordar sus preferencias</li>
              <li>Analizar el uso de la aplicación</li>
              <li>Personalizar contenido y anuncios</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-4">
              Puede controlar las cookies a través de la configuración de su dispositivo o navegador.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Privacidad de Menores</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Nuestra aplicación no está dirigida a menores de 18 años. No recopilamos intencionalmente información
              personal de menores. Si descubrimos que hemos recopilado datos de un menor sin el consentimiento
              parental adecuado, tomaremos medidas para eliminar esa información.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Transferencias Internacionales</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Sus datos pueden ser transferidos y procesados en servidores ubicados fuera de Venezuela. Cuando
              transferimos datos internacionalmente, implementamos salvaguardas apropiadas para proteger su información
              de acuerdo con esta política de privacidad.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Cambios a esta Política</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Podemos actualizar esta Política de Privacidad periódicamente. Le notificaremos sobre cambios
              significativos mediante un aviso en la aplicación o por correo electrónico. Le recomendamos revisar
              esta política regularmente para mantenerse informado sobre cómo protegemos su información.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Contacto</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Si tiene preguntas, inquietudes o solicitudes relacionadas con esta Política de Privacidad, puede contactarnos:
            </p>
            <ul className="list-none text-gray-700 space-y-2">
              <li><strong>Email:</strong> privacidad@llanero.app</li>
              <li><strong>Soporte:</strong> soporte@llanero.app</li>
              <li><strong>Ubicación:</strong> Estado Lara, Venezuela</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Consentimiento</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Al utilizar la aplicación Llanero, usted reconoce que ha leído y comprendido esta Política de Privacidad
              y consiente el procesamiento de sus datos personales según lo descrito en este documento.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
