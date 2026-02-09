import { Metadata } from "next";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "Terminos y Condiciones de Uso",
};

export default function CondicionesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-muted/50">
      <Navbar />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-24 pb-16">
        <h1 className="mb-8 text-3xl font-bold text-foreground">
          Terminos y Condiciones de Uso
        </h1>

        <div className="space-y-8 text-foreground/90">
          <section>
            <h2 className="mb-3 text-xl font-semibold">
              1. Identificacion del proveedor
            </h2>
            <p className="mb-3 leading-relaxed">
              Este servicio es ofrecido por:
            </p>
            <ul className="space-y-1 pl-6">
              <li>Llanero Bodegon</li>
              <li>Barquisimeto, Edo. Lara</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold">
              2. Uso de la aplicacion
            </h2>
            <p className="leading-relaxed">
              El usuario se compromete a hacer un uso adecuado y licito de la
              app, conforme a la legislacion venezolana, los principios de buena
              fe, las normas de convivencia y los presentes terminos y
              condiciones.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold">
              3. Precios y tipo de cambio
            </h2>
            <p className="leading-relaxed">
              Todos los precios mostrados en la app son referenciales y
              expresados en dolares estadounidenses (USD). El usuario podra pagar
              en dolares o en bolivares (VES). En caso de pagar en bolivares, se
              aplicara el tipo de cambio oficial publicado por el Banco Central
              de Venezuela (BCV) el dia de la transaccion. Los precios pueden
              variar sin previo aviso.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold">
              4. Formas de pago aceptadas
            </h2>
            <ul className="list-disc space-y-1 pl-6">
              <li>Efectivo (USD o VES)</li>
              <li>Transferencias bancarias (cuentas en bolivares o dolares)</li>
              <li>Pago movil (solo en bolivares)</li>
              <li>Zelle o metodos similares (si estan habilitados)</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold">
              5. Politica de entrega o retiro
            </h2>
            <p className="leading-relaxed">
              El cliente podra seleccionar entre retiro en tienda o entrega a
              domicilio (si aplica). Los costos de entrega se indicaran antes de
              confirmar la compra y podran variar segun la ubicacion del cliente.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold">
              6. Politica de devoluciones y reclamos
            </h2>
            <p className="leading-relaxed">
              No se aceptan devoluciones de productos perecederos o consumibles,
              salvo que esten vencidos o presenten defectos comprobables.
              Cualquier reclamo debe realizarse en un plazo maximo de 24 horas
              despues de recibir el producto. El bodegon se reserva el derecho de
              evaluar el caso antes de aprobar cualquier reembolso o cambio.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold">
              7. Privacidad y proteccion de datos
            </h2>
            <p className="leading-relaxed">
              La informacion personal proporcionada por los usuarios sera tratada
              de manera confidencial y utilizada unicamente para fines
              relacionados con la prestacion del servicio, conforme a la Ley de
              Proteccion de Datos vigente en Venezuela.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold">
              8. Propiedad intelectual
            </h2>
            <p className="leading-relaxed">
              Todos los contenidos disponibles en la app (textos, imagenes,
              logotipos, marcas, etc.) son propiedad del Bodegon o cuentan con la
              debida licencia y no podran ser usados sin autorizacion previa.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold">9. Modificaciones</h2>
            <p className="leading-relaxed">
              Nos reservamos el derecho de actualizar estos terminos en cualquier
              momento. Cualquier cambio sera informado a traves de la app y
              entrara en vigencia desde su publicacion.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold">
              10. Legislacion aplicable y jurisdiccion
            </h2>
            <p className="leading-relaxed">
              Estos terminos y condiciones se rigen por las leyes de la
              Republica Bolivariana de Venezuela. En caso de controversia, las
              partes se someten a los tribunales competentes de la ciudad de
              Barquisimeto, Estado Lara.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
