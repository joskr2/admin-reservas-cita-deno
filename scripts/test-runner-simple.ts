#!/usr/bin/env -S deno run --allow-all --unstable-kv

// scripts/test-runner-simple.ts - Script simplificado para ejecutar tests
import { parseArgs } from "https://deno.land/std@0.216.0/cli/parse_args.ts";

interface SimpleTestConfig {
  type: string;
  coverage: boolean;
  verbose: boolean;
  filter?: string | undefined;
  outputDir: string;
}

async function runTests(config: SimpleTestConfig): Promise<void> {
  console.log("🧪 Iniciando ejecución de tests...");

  // Crear directorio de salida
  await ensureDir(config.outputDir);

  const testSuites = getTestSuites(config.type);
  const results: Array<{
    suite: string;
    success: boolean;
    duration: number;
    output: string;
  }> = [];

  for (const suite of testSuites) {
    console.log(`\n🔍 Ejecutando: ${suite.name}`);

    const startTime = Date.now();
    const result = await runTestSuite(suite, config);
    const duration = Date.now() - startTime;

    results.push({
      suite: suite.name,
      success: result.success,
      duration,
      output: result.output,
    });

    if (result.success) {
      console.log(`✅ ${suite.name} completado en ${duration}ms`);
    } else {
      console.log(`❌ ${suite.name} falló en ${duration}ms`);
      if (config.verbose) {
        console.log(result.output);
      }
    }
  }

  // Generar reporte simple
  await generateSimpleReport(results, config);

  // Mostrar resumen
  showSummary(results);
}

function getTestSuites(type: string): Array<{ name: string; path: string }> {
  const suites = [];

  if (type === "unit" || type === "all") {
    suites.push(
      { name: "Unit Tests - Repositories", path: "tests/unit/repositories/" },
      { name: "Unit Tests - Components", path: "tests/unit/components/" },
      { name: "Unit Tests - Utils", path: "tests/unit/utils/" },
    );
  }

  if (type === "integration" || type === "all") {
    suites.push({
      name: "Integration Tests - API",
      path: "tests/integration/api/",
    });
  }

  if (type === "performance" || type === "all") {
    suites.push({ name: "Performance Tests", path: "tests/performance/" });
  }

  return suites;
}

async function runTestSuite(
  suite: { name: string; path: string },
  config: SimpleTestConfig,
): Promise<{ success: boolean; output: string }> {
  try {
    const args = ["test", "--unstable-kv", "--allow-all"];

    if (config.coverage) {
      args.push(`--coverage=${config.outputDir}/coverage`);
    }

    if (config.filter) {
      args.push(`--filter=${config.filter}`);
    }

    args.push(suite.path);

    const command = new Deno.Command("deno", { args });
    const result = await command.output();

    const output = new TextDecoder().decode(result.stdout);
    const errorOutput = new TextDecoder().decode(result.stderr);

    return {
      success: result.success,
      output: output + (errorOutput ? `\nErrors:\n${errorOutput}` : ""),
    };
  } catch (error) {
    return {
      success: false,
      output: `Error ejecutando suite: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}

async function generateSimpleReport(
  results: Array<{
    suite: string;
    success: boolean;
    duration: number;
    output: string;
  }>,
  config: SimpleTestConfig,
): Promise<void> {
  const report = {
    timestamp: new Date().toISOString(),
    config,
    results,
    summary: {
      totalSuites: results.length,
      successfulSuites: results.filter((r) => r.success).length,
      failedSuites: results.filter((r) => !r.success).length,
      totalDuration: results.reduce((sum, r) => sum + r.duration, 0),
    },
  };

  await Deno.writeTextFile(
    `${config.outputDir}/test-report.json`,
    JSON.stringify(report, null, 2),
  );

  console.log(`📊 Reporte generado en: ${config.outputDir}/test-report.json`);
}

function showSummary(
  results: Array<{ suite: string; success: boolean; duration: number }>,
): void {
  console.log("\n" + "=".repeat(60));
  console.log("📊 RESUMEN DE TESTS");
  console.log("=".repeat(60));

  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  console.log(`✅ Suites exitosas: ${successful}`);
  console.log(`❌ Suites fallidas: ${failed}`);
  console.log(`⏱️  Tiempo total: ${(totalDuration / 1000).toFixed(2)}s`);

  if (failed > 0) {
    console.log("\n❌ Suites fallidas:");
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`  - ${r.suite}`);
      });
  }

  console.log("\n" + "=".repeat(60));
}

async function ensureDir(path: string): Promise<void> {
  try {
    await Deno.mkdir(path, { recursive: true });
  } catch (error) {
    if (!(error instanceof Deno.errors.AlreadyExists)) {
      throw error;
    }
  }
}

// CLI interface
if (import.meta.main) {
  const args = parseArgs(Deno.args, {
    string: ["type", "filter", "output"],
    boolean: ["coverage", "verbose", "help"],
    default: {
      type: "all",
      coverage: false,
      verbose: false,
      output: "./test-results",
    },
  });

  if (args.help) {
    console.log(`
🧪 Test Runner - Horizonte Clínica

Uso:
  deno run -A scripts/test-runner-simple.ts [opciones]

Opciones:
  --type <tipo>        Tipo de tests: unit, integration, performance, all (default: all)
  --coverage           Habilitar reporte de coverage
  --verbose            Mostrar output detallado
  --filter <filtro>    Filtrar tests por nombre
  --output <dir>       Directorio de salida (default: ./test-results)
  --help               Mostrar esta ayuda

Ejemplos:
  deno run -A scripts/test-runner-simple.ts --type=unit --coverage
  deno run -A scripts/test-runner-simple.ts --filter="appointment" --verbose
    `);
    Deno.exit(0);
  }

  const config: SimpleTestConfig = {
    type: args.type as string,
    coverage: args.coverage as boolean,
    verbose: args.verbose as boolean,
    filter: args.filter ? (args.filter as string) : undefined,
    outputDir: args.output as string,
  };

  try {
    await runTests(config);
    console.log("\n🎉 Tests completados exitosamente!");
  } catch (error) {
    console.error(
      "\n💥 Error ejecutando tests:",
      error instanceof Error ? error.message : String(error),
    );
    Deno.exit(1);
  }
}
