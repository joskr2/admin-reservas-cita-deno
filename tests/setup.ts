// tests/setup.ts - Configuración global para tests
import { beforeAll, afterAll } from "$std/testing/bdd.ts";
import { DatabaseConnection } from "../lib/database/connection.ts";
import type { User, Patient, Appointment, Room } from "../types/index.ts";

beforeAll(() => {
  console.log("🧪 Configurando entorno de testing...");
  // Configuración inicial si es necesaria
});

afterAll(() => {
  console.log("✅ Limpiando entorno de testing...");
  // Limpieza si es necesaria
});

// Utilidades para crear datos de prueba
export const testUtils = {
  createUser: (overrides: Partial<User> = {}): User => {
    const defaultUser: User = {
      id: crypto.randomUUID(),
      email: `test-${Date.now()}@example.com`,
      name: "Test User",
      role: "psychologist",
      passwordHash: "hashedpassword123",
      isActive: true,
      createdAt: new Date().toISOString(),
      // New fields for psychologists
      dni: "12345678",
      specialty: "Psicología Clínica",
      customSpecialty: undefined,
      licenseNumber: "PSI-001",
      phone: "+1234567890",
      education: "Universidad de Psicología, Licenciatura en Psicología Clínica",
      experienceYears: 5,
      bio: "Psicólogo clínico especializado en terapia cognitivo-conductual con 5 años de experiencia.",
    };

    return { ...defaultUser, ...overrides };
  },

  createPatient: (overrides: Partial<Patient> = {}): Patient => {
    const defaultPatient: Patient = {
      id: crypto.randomUUID(),
      name: "Test Patient",
      email: `patient-${Date.now()}@example.com`,
      phone: "123456789",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return { ...defaultPatient, ...overrides };
  },

  createAppointment: (overrides: Partial<Appointment> = {}): Appointment => {
    const defaultAppointment: Appointment = {
      id: crypto.randomUUID(),
      psychologistEmail: `psychologist-${Date.now()}@example.com`,
      patientName: "Test Patient",
      appointmentDate: new Date().toISOString().split("T")[0]!,
      appointmentTime: "10:00",
      roomId: "room-1",
      status: "scheduled",
      notes: "Test appointment",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return { ...defaultAppointment, ...overrides };
  },

  createRoom: (overrides: Partial<Room> = {}): Room => {
    const defaultRoom: Room = {
      id: crypto.randomUUID(),
      name: "Test Room",
      capacity: 2,
      isAvailable: true,
      equipment: ["projector", "whiteboard"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return { ...defaultRoom, ...overrides };
  },

  // Utilidades para limpiar datos de prueba
  async cleanupTestData(): Promise<void> {
    try {
      const connection = DatabaseConnection.getInstance();
      const kv = await connection.getInstance();

      // Limpiar datos de prueba
      const prefixes = [
        ["users"],
        ["patients"],
        ["appointments"],
        ["rooms"],
        ["sessions"],
      ];

      for (const prefix of prefixes) {
        const iter = kv.list({ prefix });
        for await (const entry of iter) {
          await kv.delete(entry.key);
        }
      }
    } catch (error) {
      console.warn("Error limpiando datos de prueba:", error);
    }
  },

  // Generar datos de prueba en lote
  generateTestUsers: (count: number): User[] => {
    return Array.from({ length: count }, (_, i) =>
      testUtils.createUser({
        email: `user${i}@test.com`,
        name: `Test User ${i}`,
      })
    );
  },

  generateTestPatients: (count: number): Patient[] => {
    return Array.from({ length: count }, (_, i) =>
      testUtils.createPatient({
        name: `Test Patient ${i}`,
        email: `patient${i}@test.com`,
      })
    );
  },
};

// Mock para Request en entorno de testing
export const mockRequest = (
  url: string,
  options: RequestInit = {}
): Request => {
  return new Request(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });
};

// Mock para Response en entorno de testing
export const mockResponse = (
  data: Record<string, unknown>,
  status = 200
): Response => {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
};

// Mock para Headers
export const mockHeaders = (headers: Record<string, string> = {}): Headers => {
  const h = new Headers();
  Object.entries(headers).forEach(([key, value]) => {
    h.set(key, value);
  });
  return h;
};

// Mock para URL
export const mockURL = (path: string, base = "http://localhost:8000"): URL => {
  return new URL(path, base);
};

// Mock para FormData
export const mockFormData = (data: Record<string, string> = {}): FormData => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, value);
  });
  return formData;
};

// Mock para URLSearchParams
export const mockSearchParams = (
  params: Record<string, string> = {}
): URLSearchParams => {
  return new URLSearchParams(params);
};

// Mock para Blob
export const mockBlob = (data: string, type = "application/json"): Blob => {
  return new Blob([data], { type });
};

// Mock para File
export const mockFile = (
  data: string,
  filename: string,
  type = "text/plain"
): File => {
  return new File([data], filename, { type });
};

// Mock para ReadableStream
export const mockReadableStream = (
  data: string
): ReadableStream<Uint8Array> => {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(data));
      controller.close();
    },
  });
};

// Mock para WritableStream
export const mockWritableStream = (): WritableStream<Uint8Array> => {
  return new WritableStream({
    write(_chunk) {
      // Mock implementation
    },
  });
};

// Mock para TransformStream
export const mockTransformStream = (): TransformStream<
  Uint8Array,
  Uint8Array
> => {
  return new TransformStream({
    transform(chunk, controller) {
      controller.enqueue(chunk);
    },
  });
};

// Mock para TextEncoder
export const mockTextEncoder = (): TextEncoder => {
  return new TextEncoder();
};

// Mock para TextDecoder
export const mockTextDecoder = (encoding = "utf-8"): TextDecoder => {
  return new TextDecoder(encoding);
};

// Mock para AbortController
export const mockAbortController = (): AbortController => {
  return new AbortController();
};

// Mock para AbortSignal
export const mockAbortSignal = (aborted = false): AbortSignal => {
  const controller = new AbortController();
  if (aborted) {
    controller.abort();
  }
  return controller.signal;
};

// Mock para EventTarget
export const mockEventTarget = (): EventTarget => {
  return new EventTarget();
};

// Mock para Event
export const mockEvent = (type: string, options: EventInit = {}): Event => {
  return new Event(type, options);
};

// Mock para CustomEvent
export const mockCustomEvent = <T>(
  type: string,
  options: CustomEventInit<T> = {}
): CustomEvent<T> => {
  return new CustomEvent(type, options);
};

// Mock para MessageEvent
export const mockMessageEvent = <T>(
  type: string,
  options: MessageEventInit<T> = {}
): MessageEvent<T> => {
  return new MessageEvent(type, options);
};

// Mock para ErrorEvent
export const mockErrorEvent = (
  type: string,
  options: ErrorEventInit = {}
): ErrorEvent => {
  return new ErrorEvent(type, options);
};

// Mock para ProgressEvent
export const mockProgressEvent = (
  type: string,
  options: ProgressEventInit = {}
): ProgressEvent => {
  return new ProgressEvent(type, options);
};

// Mock para CloseEvent
export const mockCloseEvent = (
  type: string,
  options: CloseEventInit = {}
): CloseEvent => {
  return new CloseEvent(type, options);
};

// Mock para MessagePort
export const mockMessagePort = (): MessagePort => {
  const channel = new MessageChannel();
  return channel.port1;
};

// Mock para MessageChannel
export const mockMessageChannel = (): MessageChannel => {
  return new MessageChannel();
};

// Mock para BroadcastChannel
export const mockBroadcastChannel = (name: string): BroadcastChannel => {
  return new BroadcastChannel(name);
};

// Mock para Worker
export const mockWorker = (scriptURL: string | URL): Worker => {
  return new Worker(scriptURL, { type: "module" });
};

// Mock para SharedWorker
export const mockSharedWorker = (scriptURL: string | URL): SharedWorker => {
  return new SharedWorker(scriptURL, { type: "module" });
};

// Mock para ServiceWorker
export const mockServiceWorker = (): ServiceWorker => {
  // ServiceWorker no se puede instanciar directamente
  return {} as ServiceWorker;
};

// Mock para Notification
export const mockNotification = (
  title: string,
  options: NotificationOptions = {}
): Notification => {
  return new Notification(title, options);
};

// Mock para EventSource
export const mockEventSource = (url: string | URL): EventSource => {
  return new EventSource(url);
};

// Mock para WebSocket
export const mockWebSocket = (url: string | URL): WebSocket => {
  return new WebSocket(url);
};

// Mock para XMLHttpRequest
export const mockXMLHttpRequest = (): XMLHttpRequest => {
  return new XMLHttpRequest();
};

// Mock para fetch
export const mockFetch = {
  fetch: (_url: string, _options?: RequestInit) => {
    return Promise.resolve(
      new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
  },
};

// Mock para localStorage
export const mockLocalStorage = {
  getItem: (_key: string) => null,
  setItem: (_key: string, _value: string) => {},
  removeItem: (_key: string) => {},
  clear: () => {},
  length: 0,
  key: (_index: number) => null,
};

// Mock para sessionStorage
export const mockSessionStorage = {
  getItem: (_key: string) => null,
  setItem: (_key: string, _value: string) => {},
  removeItem: (_key: string) => {},
  clear: () => {},
  length: 0,
  key: (_index: number) => null,
};

// Mock para indexedDB
export const mockIndexedDB = {
  open: (_name: string, _version?: number) => {
    return {} as IDBOpenDBRequest;
  },
  deleteDatabase: (_name: string) => {
    return {} as IDBOpenDBRequest;
  },
  cmp: (_first: unknown, _second: unknown) => 0,
};

// Mock para crypto
export const mockCrypto = {
  getRandomValues: <T extends ArrayBufferView | null>(array: T): T => {
    if (array) {
      const bytes = new Uint8Array(array.buffer);
      for (let i = 0; i < bytes.length; i++) {
        bytes[i] = Math.floor(Math.random() * 256);
      }
    }
    return array;
  },
  randomUUID: () => crypto.randomUUID(),
  subtle: crypto.subtle,
};

// Mock para performance
export const mockPerformance = {
  now: () => Date.now(),
  mark: (_markName: string) => {},
  measure: (_measureName: string, _startMark?: string, _endMark?: string) => {},
  clearMarks: (_markName?: string) => {},
  clearMeasures: (_measureName?: string) => {},
  getEntries: () => [],
  getEntriesByName: (_name: string, _entryType?: string) => [],
  getEntriesByType: (_entryType: string) => [],
};

// Mock para console
export const mockConsole = {
  log: (..._args: unknown[]) => {},
  error: (..._args: unknown[]) => {},
  warn: (..._args: unknown[]) => {},
  info: (..._args: unknown[]) => {},
  debug: (..._args: unknown[]) => {},
  trace: (..._args: unknown[]) => {},
  assert: (_condition?: boolean, ..._data: unknown[]) => {},
  clear: () => {},
  count: (_label?: string) => {},
  countReset: (_label?: string) => {},
  dir: (_item?: unknown, _options?: unknown) => {},
  dirxml: (..._data: unknown[]) => {},
  group: (..._data: unknown[]) => {},
  groupCollapsed: (..._data: unknown[]) => {},
  groupEnd: () => {},
  table: (_tabularData?: unknown, _properties?: string[]) => {},
  time: (_label?: string) => {},
  timeEnd: (_label?: string) => {},
  timeLog: (_label?: string, ..._data: unknown[]) => {},
  timeStamp: (_label?: string) => {},
  profile: (_reportName?: string) => {},
  profileEnd: (_reportName?: string) => {},
};

// Mock para navigator
export const mockNavigator = {
  userAgent: "Test User Agent",
  language: "en-US",
  languages: ["en-US", "en"],
  platform: "Test Platform",
  cookieEnabled: true,
  onLine: true,
  geolocation: {
    getCurrentPosition: (
      _success: PositionCallback,
      _error?: PositionErrorCallback,
      _options?: PositionOptions
    ) => {},
    watchPosition: (
      _success: PositionCallback,
      _error?: PositionErrorCallback,
      _options?: PositionOptions
    ) => 0,
    clearWatch: (_watchId: number) => {},
  },
  serviceWorker: {
    register: (_scriptURL: string | URL, _options?: RegistrationOptions) =>
      Promise.resolve({} as ServiceWorkerRegistration),
    getRegistration: (_clientURL?: string) => Promise.resolve(undefined),
    getRegistrations: () => Promise.resolve([]),
  },
  permissions: {
    query: (_permissionDesc: PermissionDescriptor) =>
      Promise.resolve({} as PermissionStatus),
  },
  clipboard: {
    readText: () => Promise.resolve(""),
    writeText: (_data: string) => Promise.resolve(),
  },
};

// Mock para location
export const mockLocation = {
  href: "http://localhost:8000/",
  origin: "http://localhost:8000",
  protocol: "http:",
  host: "localhost:8000",
  hostname: "localhost",
  port: "8000",
  pathname: "/",
  search: "",
  hash: "",
  assign: (_url: string | URL) => {},
  replace: (_url: string | URL) => {},
  reload: () => {},
  toString: () => "http://localhost:8000/",
};

// Mock para history
export const mockHistory = {
  length: 1,
  scrollRestoration: "auto" as ScrollRestoration,
  state: null,
  back: () => {},
  forward: () => {},
  go: (_delta?: number) => {},
  pushState: (
    _data: unknown,
    _unused: string,
    _url?: string | URL | null
  ) => {},
  replaceState: (
    _data: unknown,
    _unused: string,
    _url?: string | URL | null
  ) => {},
};

// Mock para screen
export const mockScreen = {
  width: 1920,
  height: 1080,
  availWidth: 1920,
  availHeight: 1040,
  colorDepth: 24,
  pixelDepth: 24,
  orientation: {
    angle: 0,
    type: "landscape-primary" as OrientationType,
    addEventListener: (
      _type: string,
      _listener: EventListenerOrEventListenerObject,
      _options?: boolean | AddEventListenerOptions
    ) => {},
    removeEventListener: (
      _type: string,
      _listener: EventListenerOrEventListenerObject,
      _options?: boolean | EventListenerOptions
    ) => {},
    dispatchEvent: (_event: Event) => true,
  },
};

// Mock para document
export const mockDocument = {
  createElement: (_tag: string) => ({
    tagName: _tag.toUpperCase(),
    innerHTML: "",
    textContent: "",
    style: {},
    classList: {
      add: (..._tokens: string[]) => {},
      remove: (..._tokens: string[]) => {},
      toggle: (_token: string, _force?: boolean) => false,
      contains: (_token: string) => false,
      replace: (_oldToken: string, _newToken: string) => {},
    },
    setAttribute: (_name: string, _value: string) => {},
    getAttribute: (_name: string) => null,
    removeAttribute: (_name: string) => {},
    addEventListener: (
      _type: string,
      _listener: EventListenerOrEventListenerObject,
      _options?: boolean | AddEventListenerOptions
    ) => {},
    removeEventListener: (
      _type: string,
      _listener: EventListenerOrEventListenerObject,
      _options?: boolean | EventListenerOptions
    ) => {},
    dispatchEvent: (_event: Event) => true,
    appendChild: (_node: Node) => _node,
    removeChild: (_node: Node) => _node,
    insertBefore: (_newNode: Node, _referenceNode: Node | null) => _newNode,
    replaceChild: (_newChild: Node, _oldChild: Node) => _oldChild,
    cloneNode: (_deep?: boolean) => ({} as Node),
    contains: (_other: Node | null) => false,
    querySelector: (_selectors: string) => null,
    querySelectorAll: (_selectors: string) =>
      [] as unknown as NodeListOf<Element>,
    getElementById: (_elementId: string) => null,
    getElementsByClassName: (_classNames: string) =>
      [] as unknown as HTMLCollectionOf<Element>,
    getElementsByTagName: (_qualifiedName: string) =>
      [] as unknown as HTMLCollectionOf<Element>,
  }),
  createTextNode: (_data: string) => ({
    nodeType: 3,
    nodeName: "#text",
    nodeValue: _data,
    textContent: _data,
  }),
  createDocumentFragment: () => ({
    nodeType: 11,
    nodeName: "#document-fragment",
  }),
  body: null,
  head: null,
  title: "",
  URL: "http://localhost:8000/",
  domain: "localhost",
  referrer: "",
  cookie: "",
  readyState: "complete" as DocumentReadyState,
  addEventListener: (
    _type: string,
    _listener: EventListenerOrEventListenerObject,
    _options?: boolean | AddEventListenerOptions
  ) => {},
  removeEventListener: (
    _type: string,
    _listener: EventListenerOrEventListenerObject,
    _options?: boolean | EventListenerOptions
  ) => {},
  dispatchEvent: (_event: Event) => true,
};

// Mock para window
export const mockWindow = {
  document: mockDocument,
  location: mockLocation,
  history: mockHistory,
  navigator: mockNavigator,
  screen: mockScreen,
  console: mockConsole,
  performance: mockPerformance,
  crypto: mockCrypto,
  localStorage: mockLocalStorage,
  sessionStorage: mockSessionStorage,
  indexedDB: mockIndexedDB,
  fetch: mockFetch.fetch,
  innerWidth: 1920,
  innerHeight: 1080,
  outerWidth: 1920,
  outerHeight: 1080,
  devicePixelRatio: 1,
  scrollX: 0,
  scrollY: 0,
  pageXOffset: 0,
  pageYOffset: 0,
  alert: (_message?: unknown) => {},
  confirm: (_message?: string) => false,
  prompt: (_message?: string, _defaultText?: string) => null,
  open: (_url?: string | URL, _target?: string, _features?: string) => null,
  close: () => {},
  focus: () => {},
  blur: () => {},
  print: () => {},
  stop: () => {},
  scroll: (_x: number, _y: number) => {},
  scrollTo: (_x: number, _y: number) => {},
  scrollBy: (_x: number, _y: number) => {},
  resizeTo: (_width: number, _height: number) => {},
  resizeBy: (_x: number, _y: number) => {},
  moveTo: (_x: number, _y: number) => {},
  moveBy: (_x: number, _y: number) => {},
  getComputedStyle: (_elt: Element, _pseudoElt?: string | null) =>
    ({} as CSSStyleDeclaration),
  getSelection: () => null,
  matchMedia: (_query: string) => ({
    matches: false,
    media: _query,
    addListener: (
      _listener:
        | ((this: MediaQueryList, ev: MediaQueryListEvent) => unknown)
        | null
    ) => {},
    removeListener: (
      _listener:
        | ((this: MediaQueryList, ev: MediaQueryListEvent) => unknown)
        | null
    ) => {},
    addEventListener: (
      _type: string,
      _listener: EventListenerOrEventListenerObject,
      _options?: boolean | AddEventListenerOptions
    ) => {},
    removeEventListener: (
      _type: string,
      _listener: EventListenerOrEventListenerObject,
      _options?: boolean | EventListenerOptions
    ) => {},
    dispatchEvent: (_event: Event) => true,
  }),
  requestAnimationFrame: (_callback: FrameRequestCallback) => 0,
  cancelAnimationFrame: (_handle: number) => {},
  setTimeout: (
    _handler: TimerHandler,
    _timeout?: number,
    ..._arguments: unknown[]
  ) => 0,
  clearTimeout: (_handle?: number) => {},
  setInterval: (
    _handler: TimerHandler,
    _timeout?: number,
    ..._arguments: unknown[]
  ) => 0,
  clearInterval: (_handle?: number) => {},
  addEventListener: (
    _type: string,
    _listener: EventListenerOrEventListenerObject,
    _options?: boolean | AddEventListenerOptions
  ) => {},
  removeEventListener: (
    _type: string,
    _listener: EventListenerOrEventListenerObject,
    _options?: boolean | EventListenerOptions
  ) => {},
  dispatchEvent: (_event: Event) => true,
};

// Contexto de testing global
interface TestContext {
  user?: User;
  patient?: Patient;
  appointment?: Appointment;
  room?: Room;
}

export function createTestContext(
  overrides: Partial<TestContext> = {}
): TestContext {
  return {
    user: overrides.user || testUtils.createUser(),
    patient: overrides.patient || testUtils.createPatient(),
    appointment: overrides.appointment || testUtils.createAppointment(),
    room: overrides.room || testUtils.createRoom(),
  };
}
