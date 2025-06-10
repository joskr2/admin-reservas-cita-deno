import type { PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";

export default function App({ Component }: PageProps) {
  return (
    <html lang="es">
      <Head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Horizonte - Clínica de Psicología</title>
        <link rel="stylesheet" href="/css/styles.css" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <body class="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <Component />
      </body>
    </html>
  );
}
