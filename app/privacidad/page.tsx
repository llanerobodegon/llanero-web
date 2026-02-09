import { Metadata } from "next";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "Politicas de Privacidad",
};

export default function PrivacidadPage() {
  return (
    <div className="flex min-h-screen flex-col bg-muted/50">
      <Navbar />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-24 pb-16">
        <h1 className="mb-8 text-3xl font-bold text-foreground">
          Politicas de Privacidad
        </h1>

        <div className="space-y-8 text-foreground/90">
          <section>
            <h2 className="mb-3 text-xl font-semibold">1. Introduccion</h2>
            <p className="leading-relaxed">
              En el Bodegon Llanero, ubicado en Barquisimeto, Estado Lara, nos
              comprometemos a proteger la privacidad y los datos personales de
              nuestros usuarios. Esta politica describe como recopilamos,
              utilizamos y protegemos la informacion que nos proporciona al usar
              nuestra aplicacion.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold">
              2. Informacion que recopilamos
            </h2>
            <p className="leading-relaxed">
              Podemos recopilar informacion personal como nombre completo,
              numero de telefono, direccion de entrega, correo electronico, y
              datos de pago necesarios para procesar sus pedidos.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold">
              3. Finalidad del tratamiento de datos
            </h2>
            <p className="mb-3 leading-relaxed">
              Los datos son utilizados exclusivamente para:
            </p>
            <ul className="list-disc space-y-1 pl-6">
              <li>Procesar y gestionar pedidos.</li>
              <li>Contactar al cliente en caso de ser necesario.</li>
              <li>Realizar entregas y emitir facturas.</li>
              <li>
                Ofrecer promociones o informacion relevante, previa
                autorizacion del usuario.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold">
              4. Almacenamiento y seguridad de los datos
            </h2>
            <p className="leading-relaxed">
              Toda la informacion se almacena de forma segura y se aplican
              medidas razonables para protegerla contra accesos no autorizados,
              perdida o alteracion. Solo el personal autorizado tiene acceso a
              esta informacion.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold">
              5. Compartir informacion con terceros
            </h2>
            <p className="leading-relaxed">
              No compartimos la informacion personal con terceros, excepto en
              casos necesarios para la prestacion del servicio (como empresas de
              delivery) o por requerimiento legal de autoridades competentes.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold">
              6. Derechos del usuario
            </h2>
            <p className="leading-relaxed">
              El usuario tiene derecho a acceder, modificar, actualizar o
              eliminar su informacion personal comunicandose con nosotros a
              traves de nuestros canales oficiales.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold">7. Consentimiento</h2>
            <p className="leading-relaxed">
              Al usar nuestra aplicacion, el usuario acepta esta politica de
              privacidad y el uso de sus datos conforme a lo descrito.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold">
              8. Cambios en la politica
            </h2>
            <p className="leading-relaxed">
              Nos reservamos el derecho de modificar esta politica en cualquier
              momento. Los cambios seran notificados dentro de la app y estaran
              disponibles publicamente.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold">9. Contacto</h2>
            <p className="leading-relaxed">
              Si tiene alguna duda sobre esta politica o desea ejercer sus
              derechos de privacidad, puede escribirnos a traves de nuestros
              canales oficiales de contacto.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
