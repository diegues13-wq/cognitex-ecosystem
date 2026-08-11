import { idToken } from './session';

/**
 * The assistant transport.
 *
 * `POST /api/ai/chat` streams server-sent events from Vertex AI. Two things
 * changed here versus the previous version:
 *
 *  · the request carries the operator's Firebase ID token, because the
 *    endpoint spends money and the service is deployed
 *    `--allow-unauthenticated`;
 *  · failures arrive as a short code, not as the provider's raw message. The
 *    old client pattern-matched on substrings of the upstream error and
 *    rendered, to the operator, a `gcloud projects add-iam-policy-binding`
 *    command containing the project id and the service-account e-mail. That
 *    is an internal identifier disclosure, and it is also useless: an
 *    operator in a control room cannot run it and should not have to.
 */

export type ChatFailure =
    | 'unauthenticated'
    | 'rate_limited'
    | 'permission_denied'
    | 'quota'
    | 'unavailable'
    | 'model_error'
    | 'network';

export class ChatError extends Error {
    readonly failure: ChatFailure;

    constructor(failure: ChatFailure) {
        super(failure);
        this.name = 'ChatError';
        this.failure = failure;
    }
}

/**
 * What the operator is told, and what they can do about it.
 *
 * Every one of these names an action available to the person reading it:
 * retry, wait, or escalate to a named owner. None of them names a cloud
 * resource.
 */
export const CHAT_FAILURE_MESSAGE: Record<ChatFailure, string> = {
    unauthenticated:
        'Su sesión no está verificada. Cierre sesión y vuelva a entrar; si persiste, avise a soporte de plataforma.',
    rate_limited:
        'Demasiadas consultas seguidas. Espere un minuto antes de volver a preguntar.',
    permission_denied:
        'El asistente no está habilitado en este entorno. Avise a soporte de plataforma indicando la hora del intento; es una configuración del servicio, no de su equipo.',
    quota: 'El asistente agotó su cuota diaria. Vuelve a estar disponible mañana, o antes si soporte de plataforma amplía el límite.',
    unavailable:
        'El asistente no está disponible en este momento. El resto de la consola sigue operativa.',
    model_error:
        'El asistente no pudo completar la respuesta. Reformule la pregunta o inténtelo de nuevo.',
    network: 'Sin conexión con el servidor del CCO. Se reintenta al recuperar la red.',
};

const FAILURES: readonly ChatFailure[] = [
    'unauthenticated',
    'rate_limited',
    'permission_denied',
    'quota',
    'unavailable',
    'model_error',
    'network',
];

function toFailure(value: unknown, fallback: ChatFailure): ChatFailure {
    return typeof value === 'string' && FAILURES.includes(value as ChatFailure)
        ? (value as ChatFailure)
        : fallback;
}

const STATUS_FAILURE: Record<number, ChatFailure> = {
    401: 'unauthenticated',
    403: 'permission_denied',
    429: 'rate_limited',
    503: 'unavailable',
};

export interface ChatRequest {
    prompt: string;
    systemInstruction: string;
    /** Called with the full text so far, every time more arrives. */
    onText: (text: string) => void;
    signal?: AbortSignal;
}

export async function streamChat({
    prompt,
    systemInstruction,
    onText,
    signal,
}: ChatRequest): Promise<void> {
    const token = await idToken();
    if (!token) throw new ChatError('unauthenticated');

    let response: Response;
    try {
        response = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ prompt, systemInstruction }),
            signal,
        });
    } catch {
        throw new ChatError('network');
    }

    if (!response.ok || !response.body) {
        const body: unknown = await response.json().catch(() => null);
        const code =
            typeof body === 'object' && body !== null
                ? (body as { code?: unknown }).code
                : undefined;
        throw new ChatError(toFailure(code, STATUS_FAILURE[response.status] ?? 'unavailable'));
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let text = '';

    for (;;) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        // The last element is whatever arrived after the final newline, which
        // may be half an event.
        buffer = lines.pop() ?? '';

        for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const payload = line.slice(6).trim();
            if (payload === '[DONE]') return;

            let event: { text?: unknown; code?: unknown };
            try {
                event = JSON.parse(payload) as typeof event;
            } catch {
                continue;
            }

            if (event.code !== undefined) throw new ChatError(toFailure(event.code, 'model_error'));
            if (typeof event.text === 'string') {
                text += event.text;
                onText(text);
            }
        }
    }
}
