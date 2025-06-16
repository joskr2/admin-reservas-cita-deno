import type { PageProps } from "$fresh/server.ts";
import type { AppState } from "../types/index.ts";
import Header from "../islands/Header.tsx";
import Footer from "../components/layout/Footer.tsx";

export default function Layout({
  Component,
  route,
  state,
}: PageProps<unknown, AppState>) {
  const isLoginPage = route === "/login";

  // Solo la página de login usa layout mínimo
  if (isLoginPage) {
    return (
      <div class="flex flex-col min-h-screen">
        <Component />
      </div>
    );
  }

  // Todas las demás páginas (incluyendo home) usan layout completo
  return (
    <div class="flex flex-col min-h-screen">
      <Header currentPath={route} user={state.user} />
      <main class="flex-grow bg-gray-50 dark:bg-gray-900">
        <Component />
      </main>
      <Footer />
    </div>
  );
}
