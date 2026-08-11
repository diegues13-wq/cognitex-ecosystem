/**
 * A narrow, hand-written view of the Google Maps JS SDK.
 *
 * `@types/google.maps` is ~9,000 lines describing an API surface this console
 * touches eight members of. Declaring those eight keeps the map fully typed
 * without a dependency whose only job is to describe someone else's library,
 * and it makes the coupling legible: everything below is what would have to
 * change if the map provider ever did.
 */

export interface LatLngLiteral {
    lat: number;
    lng: number;
}

interface MapOptions {
    center: LatLngLiteral;
    zoom: number;
    styles: unknown[];
    disableDefaultUI?: boolean;
    zoomControl?: boolean;
    mapTypeControl?: boolean;
    streetViewControl?: boolean;
    fullscreenControl?: boolean;
    scaleControl?: boolean;
    gestureHandling?: string;
    backgroundColor?: string;
}

export interface MapsMap {
    addListener(event: string, handler: () => void): void;
}

export interface MapsMarker {
    setPosition(position: LatLngLiteral): void;
    setIcon(icon: MarkerIcon): void;
    setMap(map: MapsMap | null): void;
    addListener(event: string, handler: () => void): void;
}

export interface MapsPolyline {
    setMap(map: MapsMap | null): void;
}

export interface MapsInfoWindow {
    setContent(content: Node | string): void;
    open(map: MapsMap, anchor: MapsMarker): void;
    close(): void;
}

export interface MarkerIcon {
    path: number;
    fillColor: string;
    fillOpacity: number;
    strokeColor: string;
    strokeWeight: number;
    scale: number;
}

export interface MapsApi {
    Map: new (container: HTMLElement, options: MapOptions) => MapsMap;
    Marker: new (options: {
        position: LatLngLiteral;
        map: MapsMap;
        icon: MarkerIcon;
        title: string;
        zIndex: number;
        optimized?: boolean;
    }) => MapsMarker;
    Polyline: new (options: {
        path: LatLngLiteral[];
        geodesic: boolean;
        strokeColor: string;
        strokeOpacity: number;
        strokeWeight: number;
        icons?: unknown[];
        map: MapsMap;
    }) => MapsPolyline;
    InfoWindow: new (options: { pixelOffset: unknown }) => MapsInfoWindow;
    Size: new (width: number, height: number) => unknown;
    SymbolPath: { CIRCLE: number };
}

/**
 * The SDK attaches itself to `window.google`, and it calls back through a
 * global name we pass in the script URL — so both have to be reachable on the
 * window object as arbitrary keys.
 */
interface MapsWindow {
    google?: { maps?: MapsApi };
    [callbackName: string]: unknown;
}

let pending: Promise<MapsApi> | null = null;

/**
 * Loads the SDK once per page, whatever asks for it.
 *
 * A failed load resets the cached promise so a later mount can retry — the
 * previous version kept the rejection forever, so one flaky network request
 * at boot meant no map until the operator reloaded the console.
 */
export function loadMaps(apiKey: string): Promise<MapsApi> {
    const scope = window as unknown as MapsWindow;

    const already = scope.google?.maps;
    if (already) return Promise.resolve(already);
    if (pending) return pending;

    pending = new Promise<MapsApi>((resolve, reject) => {
        const callbackName = `__cognitexMapsReady${Date.now()}`;

        scope[callbackName] = () => {
            delete scope[callbackName];
            const maps = scope.google?.maps;
            if (maps) resolve(maps);
            else reject(new Error('El SDK de mapas cargó sin exponer google.maps'));
        };

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
            apiKey
        )}&callback=${callbackName}`;
        script.async = true;
        script.defer = true;
        script.onerror = () => {
            pending = null;
            delete scope[callbackName];
            reject(new Error('No se pudo cargar el SDK de mapas'));
        };

        document.head.appendChild(script);
    });

    return pending;
}
