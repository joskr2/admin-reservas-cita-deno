import type { PageProps } from "$fresh/server.ts";
import type { AppState } from "./_middleware.ts";

export default function Layout({
  Component
}: PageProps<unknown, AppState>) {
  return (
    <>
      <Component />
    </>
  );
}
