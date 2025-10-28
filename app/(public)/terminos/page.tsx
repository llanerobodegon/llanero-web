export default function TerminosPage() {
  return (
    <div className="bg-white">
      <div className="container mx-auto px-6 py-16 max-w-4xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Términos y Condiciones</h1>

        <div className="prose prose-lg max-w-none">
          <p className="text-gray-600 mb-6">
            Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Aceptación de los Términos</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Al acceder y utilizar la aplicación Llanero, usted acepta estar sujeto a estos Términos y Condiciones.
              Si no está de acuerdo con alguna parte de estos términos, no debe utilizar nuestra aplicación.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Descripción del Servicio</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Llanero es una plataforma de delivery que conecta a usuarios con bodegones y restaurantes en el estado Lara, Venezuela.
              Facilitamos el proceso de pedido y entrega de alimentos y productos de comercios locales.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Registro y Cuenta de Usuario</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Para utilizar nuestros servicios, debe:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Proporcionar información precisa y completa durante el registro</li>
              <li>Mantener la seguridad de su contraseña</li>
              <li>Ser mayor de 18 años o contar con el consentimiento de un padre o tutor</li>
              <li>Notificar inmediatamente cualquier uso no autorizado de su cuenta</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Pedidos y Pagos</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Al realizar un pedido a través de Llanero:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Acepta pagar el precio total mostrado, incluyendo el costo de los productos, tarifas de entrega e impuestos aplicables</li>
              <li>Los precios pueden variar según el establecimiento y están sujetos a cambios sin previo aviso</li>
              <li>Los métodos de pago aceptados se muestran durante el proceso de compra</li>
              <li>Nos reservamos el derecho de cancelar pedidos en caso de información incorrecta o actividad sospechosa</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Entregas</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Los tiempos de entrega son estimados y pueden variar debido a:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Disponibilidad del establecimiento</li>
              <li>Condiciones del tráfico</li>
              <li>Condiciones climáticas</li>
              <li>Volumen de pedidos</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-4">
              Llanero no se hace responsable por retrasos causados por circunstancias fuera de nuestro control.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Cancelaciones y Reembolsos</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Las cancelaciones están sujetas a las siguientes condiciones:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Los pedidos pueden cancelarse dentro de un período limitado después de realizados</li>
              <li>Una vez que el establecimiento ha comenzado a preparar el pedido, es posible que no se pueda cancelar</li>
              <li>Los reembolsos se procesarán según el método de pago original</li>
              <li>El tiempo de procesamiento de reembolsos puede variar según la institución financiera</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Conducta del Usuario</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Los usuarios se comprometen a:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>No utilizar la plataforma para actividades ilegales o fraudulentas</li>
              <li>No acosar, amenazar o abusar de repartidores o personal de los establecimientos</li>
              <li>Proporcionar información de entrega precisa</li>
              <li>No intentar manipular calificaciones o reseñas</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Propiedad Intelectual</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Todo el contenido de la aplicación Llanero, incluyendo pero no limitado a textos, gráficos, logos,
              iconos, imágenes y software, es propiedad de Llanero o sus proveedores de contenido y está protegido
              por las leyes de propiedad intelectual.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Limitación de Responsabilidad</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Llanero actúa como intermediario entre usuarios y establecimientos. No somos responsables de:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>La calidad, seguridad o legalidad de los productos ofrecidos</li>
              <li>La capacidad de los establecimientos para completar pedidos</li>
              <li>Problemas de salud o alergias relacionadas con los alimentos</li>
              <li>Pérdida o daño de bienes personales durante la entrega</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Modificaciones del Servicio</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Nos reservamos el derecho de modificar, suspender o discontinuar cualquier aspecto de nuestro servicio
              en cualquier momento sin previo aviso. No seremos responsables ante usted o terceros por cualquier
              modificación, suspensión o discontinuación del servicio.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Ley Aplicable</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Estos Términos y Condiciones se rigen por las leyes de la República Bolivariana de Venezuela.
              Cualquier disputa relacionada con estos términos estará sujeta a la jurisdicción exclusiva de los
              tribunales del estado Lara.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Contacto</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Si tiene preguntas sobre estos Términos y Condiciones, puede contactarnos a través de:
            </p>
            <ul className="list-none text-gray-700 space-y-2">
              <li>Email: soporte@llanero.app</li>
              <li>Ubicación: Estado Lara, Venezuela</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
