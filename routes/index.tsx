import Header from "../components/layout/Header.tsx";
import Footer from "../components/layout/Footer.tsx";
import { LuLogIn } from "@preact-icons/lu";

export default function Home() {
  return (
    <div class="flex flex-col min-h-screen">
      <Header />

      {/* Main Content */}
      <main class="flex-grow flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div class="text-center px-4 py-16">
          <h1 class="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
            <span class="block">Bienvenido a</span>
            <span class="block text-indigo-600 dark:text-indigo-400">
              Horizonte Clínico
            </span>
          </h1>
          <p class="mt-3 max-w-md mx-auto text-base text-gray-500 dark:text-gray-300 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Tu plataforma de confianza para la gestión de perfiles de psicólogos
            y la administración de citas.
          </p>
          <div class="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <div class="rounded-md shadow">
              <a
                href="/login"
                class="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10 transition duration-150 ease-in-out"
              >
                <LuLogIn class="w-5 h-5 mr-3" />
                Acceder al sistema
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
