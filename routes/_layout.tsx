import type { PageProps } from "$fresh/server.ts";
import type { AppState } from "../types/index.ts";
import Header from "../islands/Header.tsx";
import Footer from "../components/layout/Footer.tsx";

export default function Layout({
  Component,
  route,
}: PageProps<unknown, AppState>) {
  const isPublicPage = route === "/" || route === "/login";

  // Para páginas públicas, usar layout mínimo
  if (isPublicPage) {
    return (
      <div class="flex flex-col min-h-screen">
        <Component />
      </div>
    );
  }

  // Para páginas privadas, usar layout completo con Header y Footer
  return (
    <div class="flex flex-col min-h-screen">
      <Header />
      <main class="flex-grow bg-gray-50 dark:bg-gray-900">
        <Component />
      </main>
      <Footer />
    </div>
  );
}
