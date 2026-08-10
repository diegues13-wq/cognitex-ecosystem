/**
 * Spanish content — the primary locale. `en.ts` mirrors this shape exactly;
 * the `Dictionary` type is inferred from this file, so any key added here
 * becomes a compile error in en.ts until it is translated.
 *
 * Voice: engineer to engineer. No superlative without a figure behind it.
 */
export const es = {
    meta: {
        locale: 'es',
        htmlLang: 'es-EC',
        ogLocale: 'es_EC',
    },

    nav: {
        engines: 'Motores',
        energia: 'Energía',
        agentes: 'Agentes',
        flotas: 'Flotas',
        demo: 'Demo viva',
        casos: 'Casos',
        nosotros: 'Nosotros',
        contacto: 'Contacto',
        cta: 'Hablar con el agente',
        openMenu: 'Abrir menú de navegación',
        closeMenu: 'Cerrar menú de navegación',
        switchLang: 'Ver este sitio en inglés',
        skipToContent: 'Saltar al contenido',
    },

    home: {
        seo: {
            title: 'Cognitex Industrial · Ingeniería que se paga sola',
            description:
                'Reducimos su planilla eléctrica, su consumo de combustible y sus ventas perdidas por no contestar. Diagnóstico con garantía 3× en una semana. Quito, Ecuador.',
        },

        hero: {
            eyebrow: 'Quito · Ecuador',
            title: 'Su operación pierde dinero en tres lugares.',
            titleAccent: 'Se lo demostramos en una semana — o no nos paga.',
            lead: 'Energía, atención al cliente y combustible. Medimos los tres con instrumentos, no con opiniones, y le entregamos la cifra en dólares antes de que firme nada.',
            ctaPrimary: 'Hablar con el agente',
            ctaSecondary: 'Ver la demo viva',
            counters: {
                power: { label: 'kW de nuestra oficina', unit: 'kW' },
                distance: { label: 'km de nuestro vehículo hoy', unit: 'km' },
                queries: { label: 'consultas que atendió el agente esta semana', unit: '' },
            },
            liveNote: 'Datos de nuestra propia operación, ahora mismo.',
        },

        pain: {
            kicker: 'Los tres lugares',
            title: '¿Dónde se está yendo su dinero?',
            description:
                'Cada tarjeta es un problema medible con un número del país detrás. Elija el suyo y le mostramos el cálculo.',
            cards: {
                energia: {
                    title: 'Energía',
                    stat: '8–12 %',
                    statLabel: 'de la planilla eléctrica industrial es recuperable',
                    body: 'Factor de potencia penalizado, demanda mal gestionada y generadores encendidos cuando no hacen falta. Se mide con un analizador de red, no con la factura.',
                    cta: 'Calcular mi ahorro eléctrico',
                },
                agentes: {
                    title: 'Agentes',
                    stat: '1 de 3',
                    statLabel: 'consultas de WhatsApp queda sin respuesta en pymes',
                    body: 'La venta no se pierde por precio: se pierde porque nadie contestó a las 21h00 de un sábado. Un agente que responde siempre, con el catálogo y el precio correctos.',
                    cta: 'Calcular mis ventas perdidas',
                },
                flotas: {
                    title: 'Flotas',
                    stat: '8–12 %',
                    statLabel: 'del gasto en combustible es fuga corregible',
                    body: 'Ralentí prolongado, rutas subóptimas y consumos que nadie concilia con los galones facturados. GPS más conciliación de tanqueadas.',
                    cta: 'Calcular mi fuga de combustible',
                },
            },
        },

        demo: {
            kicker: 'Transparencia',
            title: 'La demo viva',
            description:
                'Datos reales de nuestra operación, ahora mismo — así de transparente será la suya.',
            power: { title: 'Potencia de la oficina', subtitle: 'Últimas 24 horas' },
            vehicle: { title: 'Vehículo', subtitle: 'Recorrido de hoy' },
            cta: 'Ver la demo completa',
        },

        process: {
            kicker: 'Cómo trabajamos',
            title: 'Tres pasos, sin sorpresas',
            steps: [
                {
                    n: '01',
                    title: 'Diagnóstico con garantía 3×',
                    body: 'Instrumentamos su operación una semana. Si el ahorro anual que encontramos no triplica lo que cuesta el diagnóstico, no lo cobramos.',
                },
                {
                    n: '02',
                    title: 'Sistema con 50 % de anticipo',
                    body: 'Recién cuando usted vio la cifra decidimos si hay proyecto. La mitad al arrancar, la mitad contra entrega funcionando.',
                },
                {
                    n: '03',
                    title: 'Informe mensual en dólares',
                    body: 'Cada mes recibe cuánto ahorró, medido contra la línea base. En dólares, no en porcentajes bonitos.',
                },
            ],
        },

        why: {
            kicker: 'Por qué Cognitex',
            title: 'Ingeniería de campo, no diapositivas',
            cards: {
                metro: {
                    title: 'Metro de Quito',
                    body: 'Operación y mantenimiento de un sistema de USD 2 000 millones. Ahí se aprende que un sensor mal puesto cuesta más que el sensor.',
                },
                cross: {
                    title: 'OT + IT + IA',
                    body: 'La mayoría sabe de automatización o de software. El dinero aparece en el cruce: PLC que habla con la nube y una IA que decide sobre datos limpios.',
                },
                agents: {
                    title: 'Doce agentes internos',
                    body: 'Corremos nuestra propia empresa con los agentes que vendemos. Si no nos sirven a nosotros, no se los ofrecemos a usted.',
                },
                guarantee: {
                    title: 'Garantías por escrito',
                    body: 'Diagnóstico 3× o gratis. Ahorro medido contra línea base. Sin permanencia obligatoria.',
                },
            },
        },

        coverage: {
            kicker: 'Cobertura',
            title: '¿Atendemos su zona?',
            description:
                'Pichincha con respuesta en sitio el mismo día. Guayas dentro de 48 horas. El resto del país, remoto más visitas programadas.',
            placeholder: '¿Dónde está su planta o su flota?',
            answerYes: 'Atendemos su zona',
            answerRemote: 'Su zona se atiende en modo remoto y con visitas programadas',
            cta: 'Coordinar una visita',
        },

        cases: {
            kicker: 'Casos',
            title: 'Primeros casos en curso',
            body: 'Preferimos no inventar logos. Los primeros proyectos están corriendo y publicaremos las cifras cuando tengamos doce meses medidos. Mientras tanto, la demo viva muestra nuestra propia operación en tiempo real.',
            cta: 'Ver la demo viva',
        },

        faq: {
            kicker: 'Preguntas',
            title: 'Lo que todos preguntan',
            items: [
                {
                    q: '¿Cuánto cuesta?',
                    a: 'El diagnóstico se cotiza según el tamaño de la operación y viene con la garantía 3×: si el ahorro anual detectado no triplica su costo, no lo cobramos. Los agentes de atención parten en USD 490 al mes. Los sistemas de energía y flotas se cotizan por proyecto, con 50 % de anticipo.',
                },
                {
                    q: '¿Cuánto se demora?',
                    a: 'El diagnóstico toma una semana de instrumentación más unos días de análisis. Un agente de atención entra en producción en dos a tres semanas. Un sistema de monitoreo energético, entre cuatro y ocho semanas según cuántos puntos de medición haya.',
                },
                {
                    q: '¿Y si no funciona?',
                    a: 'Por eso el diagnóstico va primero y con garantía. Medimos su línea base antes de tocar nada, y el informe mensual compara contra esa línea. Si el ahorro no aparece, usted tiene el número que lo prueba y nosotros tenemos un problema que resolver.',
                },
                {
                    q: '¿Qué pasa con mis datos?',
                    a: 'Sus datos son suyos. Operamos bajo la Ley Orgánica de Protección de Datos Personales del Ecuador: finalidad declarada, mínimo dato necesario y derecho de supresión efectivo. La telemetría vive en infraestructura de Google Cloud con acceso segmentado por cliente. No entrenamos modelos con la información de un cliente para otro.',
                },
                {
                    q: '¿Hay que firmar permanencia?',
                    a: 'No. Los servicios mensuales se cancelan con treinta días de aviso. Los proyectos de implementación tienen su propio contrato de obra, con entregables y aceptación.',
                },
                {
                    q: '¿Cómo es el soporte?',
                    a: 'Canal directo de WhatsApp con un ingeniero, no un ticket en cola. Atención en sitio el mismo día en Pichincha, dentro de 48 horas en Guayas. Los sistemas se monitorean solos y nos avisan antes que usted lo note.',
                },
            ],
        },

        finalCta: {
            title: 'Empiece por el número, no por la propuesta',
            body: 'Escríbanos por WhatsApp con el tamaño de su operación. En la misma conversación le decimos cuál de los tres motores le conviene medir primero.',
            cta: 'Hablar con el agente',
            secondary: 'Escribir un correo',
        },
    },

    engines: {
        energia: {
            seo: {
                title: 'Energy Sentinel · Reduzca su planilla eléctrica | Cognitex',
                description:
                    'Factor de potencia, demanda y generadores. Calcule cuánto puede recuperar de su planilla eléctrica industrial. Diagnóstico con garantía 3×.',
            },
            hero: {
                eyebrow: 'Motor A · Energía',
                title: 'Su planilla eléctrica tiene entre 8 % y 12 % de grasa',
                lead: 'Penalización por factor de potencia, picos de demanda que nadie vigila y generadores encendidos por costumbre. Se corrige midiendo, y se paga solo.',
            },
            calc: {
                title: 'Calculadora de ahorro eléctrico',
                subtitle: 'Tres datos de su última planilla bastan.',
                fields: {
                    bill: { label: 'Planilla eléctrica mensual', unit: 'USD/mes', help: 'El total que paga, no solo el consumo.' },
                    pf: { label: '¿Le penalizan el factor de potencia?', help: 'Aparece en la planilla como "penalización FP" o "bajo factor".' },
                    pfPct: { label: 'Penalización mensual', unit: 'USD/mes', help: 'Si no la tiene a mano, deje el estimado.' },
                    genset: { label: 'Horas de generador al mes', unit: 'h/mes', help: 'Diésel quemado por cortes o por picos de demanda.' },
                },
                pfOptions: { yes: 'Sí', no: 'No', unknown: 'No sé' },
                results: {
                    monthly: 'Ahorro mensual estimado',
                    annual: 'Ahorro anual estimado',
                    payback: 'Retorno del sistema de monitoreo',
                    paybackUnit: 'meses',
                    band: 'Rango conservador — optimista',
                },
                cta: 'Recibir este cálculo por WhatsApp',
                disclaimer:
                    'Estimación basada en rangos típicos de la industria ecuatoriana. La cifra real sale del diagnóstico con instrumentos.',
            },
            includes: {
                title: 'Qué incluye',
                items: [
                    'Analizador de red en los puntos críticos durante el diagnóstico',
                    'Medición permanente por tablero, no solo en la acometida',
                    'Alertas de factor de potencia y de acercamiento a la demanda contratada',
                    'Informe mensual en dólares contra su línea base',
                    'Dimensionamiento de banco de capacitores si hace falta',
                ],
            },
        },

        agentes: {
            seo: {
                title: 'Agentes de atención · Deje de perder ventas por no contestar | Cognitex',
                description:
                    'Un agente que responde WhatsApp siempre, con su catálogo y sus precios. Calcule cuánta venta está perdiendo por no contestar a tiempo.',
            },
            hero: {
                eyebrow: 'Motor B · Agentes',
                title: 'La venta no se pierde por precio. Se pierde porque nadie contestó.',
                lead: 'Un agente que atiende cada consulta en segundos, con su catálogo y sus precios reales, y le pasa el cliente caliente a una persona cuando toca cerrar.',
            },
            calc: {
                title: 'Calculadora de venta recuperable',
                subtitle: 'Cuatro números que usted ya conoce.',
                fields: {
                    chats: { label: 'Consultas por semana', unit: 'chats/sem', help: 'WhatsApp, Instagram y web sumados.' },
                    unanswered: { label: 'Porcentaje sin responder o respondido tarde', unit: '%', help: 'Fuera de horario, feriados, o simplemente se pasó.' },
                    ticket: { label: 'Ticket promedio', unit: 'USD', help: 'Cuánto factura una venta típica.' },
                    closeRate: { label: 'Tasa de cierre cuando sí contestan', unit: '%', help: 'De cada 100 consultas atendidas, cuántas compran.' },
                },
                results: {
                    monthly: 'Venta recuperable al mes',
                    annual: 'Venta recuperable al año',
                    net: 'Neto tras el costo del agente',
                    cost: 'Costo del agente',
                    band: 'Rango conservador — optimista',
                },
                cta: 'Recibir este cálculo por WhatsApp',
                disclaimer:
                    'Asume que el agente recupera entre el 60 % y el 85 % de las consultas hoy desatendidas. No toda consulta atendida se convierte en venta.',
            },
            includes: {
                title: 'Qué incluye',
                items: [
                    'Agente en WhatsApp Business con su catálogo y precios cargados',
                    'Respuesta en segundos, 24 horas, incluidos feriados',
                    'Entrega a una persona cuando el cliente pide cerrar o se sale del guion',
                    'Guardarraíles: no inventa precios ni promete plazos que usted no autorizó',
                    'Transcripción de notas de voz y registro de cada conversación',
                    'Informe semanal de consultas, temas y ventas atribuidas',
                ],
            },
        },

        flotas: {
            seo: {
                title: 'Fleet Sentinel · Recupere el 8–12 % de su combustible | Cognitex',
                description:
                    'Ralentí, rutas y tanqueadas sin conciliar. Calcule cuánto combustible está perdiendo su flota cada mes. Diagnóstico con garantía 3×.',
            },
            hero: {
                eyebrow: 'Motor C · Flotas',
                title: 'Entre 8 % y 12 % de su combustible se va en cosas que se corrigen',
                lead: 'Ralentí prolongado, rutas que nadie optimiza y galones facturados que no cuadran con los kilómetros recorridos. Se ve cuando se mide.',
            },
            calc: {
                title: 'Calculadora de fuga de combustible',
                subtitle: 'Tres datos de su operación.',
                fields: {
                    vehicles: { label: 'Vehículos en la flota', unit: 'unidades', help: 'Los que consumen combustible de la empresa.' },
                    gallons: { label: 'Galones al mes', unit: 'gal/mes', help: 'Total facturado por la flota completa.' },
                    price: { label: 'Precio por galón', unit: 'USD/gal', help: 'Diésel o gasolina, el que predomine.' },
                },
                results: {
                    monthly: 'Recuperable al mes',
                    annual: 'Recuperable al año',
                    net: 'Neto tras la mensualidad',
                    cost: 'Mensualidad estimada',
                    perVehicle: 'Por vehículo al mes',
                    band: 'Rango conservador — optimista',
                },
                cta: 'Recibir este cálculo por WhatsApp',
                disclaimer:
                    'Rango típico de flotas sin telemetría previa. El diagnóstico mide su caso con GPS y conciliación de tanqueadas.',
            },
            includes: {
                title: 'Qué incluye',
                items: [
                    'GPS con reporte de ralentí, velocidad y rutas por vehículo',
                    'Conciliación de galones facturados contra consumo real',
                    'Alertas de tanqueada fuera de ruta o fuera de horario',
                    'Ranking de conductores por consumo comparable',
                    'Informe mensual en dólares contra su línea base',
                ],
            },
        },
    },

    common: {
        pricingFrom: 'Desde',
        perMonth: 'al mes',
        guarantee: 'Garantía 3× en el diagnóstico',
        guaranteeBody:
            'Si el ahorro anual que encontramos no triplica lo que cuesta el diagnóstico, no se lo cobramos.',
        calcInvalid: 'Complete los campos para ver el cálculo.',
        calcError: 'Revise los valores: deben ser números positivos.',
        mobileCta: 'Hablar con el agente',
        backHome: 'Volver al inicio',
    },

    demoPage: {
        seo: {
            title: 'Demo viva · Nuestra operación en tiempo real | Cognitex',
            description:
                'Consumo eléctrico de nuestra oficina y recorrido de nuestro vehículo, en vivo. Así de transparente será su tablero.',
        },
        title: 'Nuestra operación, en vivo',
        lead: 'Antes de pedirle que nos confíe sus datos, le mostramos los nuestros. Esto es lo mismo que verá de su planta o su flota.',
        note: 'Los datos se actualizan cada 30 segundos.',
    },

    casesPage: {
        seo: {
            title: 'Casos · Cognitex Industrial',
            description: 'Proyectos en curso y resultados medidos de Cognitex Industrial.',
        },
        title: 'Casos',
        lead: 'Publicamos cifras, no logos. Estos son los proyectos corriendo hoy.',
    },

    aboutPage: {
        seo: {
            title: 'Nosotros · Cognitex Industrial',
            description:
                'Ingeniería de operación y mantenimiento aplicada a energía, atención y flotas. Quito, Ecuador.',
        },
        title: 'De ingeniero a ingeniero',
        lead: 'Cognitex nació de operar infraestructura crítica, no de una presentación de ventas.',
        body: [
            'Venimos de la operación y el mantenimiento del Metro de Quito, un sistema de USD 2 000 millones donde una falla no es un ticket: es una estación llena de gente esperando. Ahí se aprende a desconfiar de los tableros bonitos y a exigir que cada número tenga un instrumento detrás.',
            'La mayoría de proveedores sabe de automatización industrial o sabe de software. El dinero aparece en el cruce de los dos, cuando un PLC entrega datos limpios a una nube que una inteligencia artificial puede usar para decidir. Ese cruce es lo que hacemos.',
            'Corremos nuestra propia empresa con los mismos agentes que vendemos y monitoreamos nuestra oficina y nuestro vehículo con los mismos sistemas. Lo que ve en la demo viva es nuestra operación, no una simulación.',
        ],
    },

    contactPage: {
        seo: {
            title: 'Contacto · Cognitex Industrial',
            description:
                'Hable con un ingeniero de Cognitex Industrial. WhatsApp, correo o agende una llamada.',
        },
        title: 'Hablemos de números',
        lead: 'Cuéntenos el tamaño de su operación y le decimos cuál de los tres motores conviene medir primero.',
        form: {
            name: 'Nombre',
            company: 'Empresa',
            phone: 'Teléfono',
            email: 'Correo',
            engine: 'Motor de interés',
            enginePlaceholder: 'Seleccione uno',
            engineOptions: {
                energia: 'Energía',
                agentes: 'Agentes de atención',
                flotas: 'Flotas',
                other: 'Todavía no sé',
            },
            message: 'Mensaje',
            submit: 'Enviar',
            sending: 'Enviando…',
            success: 'Recibido. Le respondemos dentro de un día hábil.',
            error: 'No pudimos enviar el formulario. Escríbanos por WhatsApp y lo resolvemos ahí.',
            required: 'Campo obligatorio',
            invalidEmail: 'Correo no válido',
        },
        alt: {
            title: 'O más rápido todavía',
            whatsapp: 'WhatsApp directo con un ingeniero',
            email: 'Correo',
        },
    },

    legalPage: {
        seo: {
            title: 'Política de privacidad · Cognitex Industrial',
            description:
                'Cómo Cognitex Industrial trata los datos personales bajo la LOPDP del Ecuador.',
        },
        title: 'Política de privacidad',
        updated: 'Última actualización',
    },

    footer: {
        tagline: 'Ingeniería que se paga sola.',
        engines: 'Motores',
        platforms: 'Plataformas',
        company: 'Empresa',
        legal: 'Legal',
        privacy: 'Política de privacidad',
        rights: 'Todos los derechos reservados.',
        lopdp: 'Tratamos datos personales conforme a la LOPDP del Ecuador.',
        location: 'Quito, Ecuador',
    },

    cookies: {
        title: 'Analítica',
        body: 'Usamos analítica para saber qué secciones sirven y cuáles no. Nada de publicidad ni venta de datos.',
        accept: 'Aceptar',
        reject: 'Rechazar',
        more: 'Más información',
    },
} as const;

export type Dictionary = typeof es;
