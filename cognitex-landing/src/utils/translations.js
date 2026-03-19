export const translations = {
    es: {
        nav: {
            about: 'QUIÉNES SOMOS',
            ecosystem: 'CICLO DEL DATO',
            solutions: 'SERVICIOS',
            platforms: 'PRODUCTOS',
            contact: 'CONTACTO',
        },
        hero: {
            status: 'SISTEMA ONLINE • V4.0.1 ALPHA',
            titleLine1: 'Inteligencia Artificial',
            titleLine2: 'Aplicada a la Industria',
            subtitle: 'El Cerebro Digital de tu Industria. Decisiones en Tiempo Real, Resultados Reales.',
            slogan: 'Tu industria en la palma de tu mano',
            cta: 'CUÉNTANOS TU DESAFÍO INDUSTRIAL',
            description: 'Cognitex Industrial es una empresa de ingeniería y desarrollo tecnológico enfocada en Industria 4.0. Integramos analítica avanzada e IA para optimizar procesos.'
        },
        about: {
            title: 'QUIÉNES SOMOS',
            subtitle: 'INGENIERÍA ECUATORIANA DE CLASE MUNDIAL',
            description: 'En Cognitex Industrial, somos una empresa 100% ecuatoriana dedicada a transformar la industria nacional. Más que proveedores, somos tu socio estratégico para el desarrollo de proyectos de automatización industrial a todo nivel dentro del Ecuador. Nuestro compromiso es potenciar las capacidades operativas de tu empresa, optimizando recursos y maximizando tus ganancias. Construimos el cerebro digital de tu planta para que domines la Industria 4.0 sin detener tu operación.',
            slogan: 'Transformamos hardware tradicional en activos inteligentes que multiplican tu rentabilidad.'
        },
        services: {
            title: 'SERVICIOS',
            subtitle: 'Soluciones de ingeniería para la Industria 4.0',
            items: [
                {
                    title: 'Business Intelligence & AI',
                    desc: 'Tus datos tienen voz. Nosotros les damos el micrófono. Dashboards inteligentes y modelos predictivos para decisiones estratégicas.',
                    icon: 'BrainCircuit'
                },
                {
                    title: 'Supervisión de Procesos',
                    desc: 'Omnisciencia Operativa. Todo tu proceso, un solo vistazo. Monitoreo en tiempo real de líneas de producción.',
                    icon: 'Activity'
                },
                {
                    title: 'Automatización a Medida',
                    desc: 'Hardware que piensa. Software que actúa. Diseño e implementación de soluciones bajo estándares industriales.',
                    icon: 'Cpu'
                },
                {
                    title: 'Consultoría de Eficiencia',
                    desc: 'Eficiencia Matemática. Eliminamos la incertidumbre. Optimización de OEE y reducción de desperdicios.',
                    icon: 'Factory'
                }
            ]
        },
        ecosystem: {
            title: 'EL MOTOR COGNITEX',
            subtitle: 'CICLO DE VIDA DEL DATO',
            description: 'Unificamos hardware, nube e inteligencia artificial en un flujo de valor continuo. Selecciona cada fase para descubrir cómo transformamos tu industria.',
            phases: [
                {
                    id: 'fase0',
                    tab: 'Gestión de Proyectos',
                    name: 'Ingeniería & Consultoría 4.0',
                    icon: 'Briefcase',
                    technologies: ['Consultoría de Eficiencia', 'Gestión Ágil (Scrum/Kanban)', 'Implementación Llave en Mano'],
                    benefit: 'Auditoría detallada con ROI proyectado y ejecución impecable bajo estándares industriales.',
                    color: 'text-amber-400',
                    border: 'border-amber-500',
                    bg: 'bg-amber-500/20'
                },
                {
                    id: 'fase1',
                    tab: 'Captura',
                    name: 'Hardware Edge & Sensórica',
                    icon: 'Factory',
                    technologies: ['IIoT (Internet Industrial)', 'Retrofitting de Maquinaria', 'Integración PLC & SCADA'],
                    benefit: 'Descubrimiento de datos ocultos y visibilidad operativa en tiempo real.',
                    color: 'text-gray-300',
                    border: 'border-gray-500',
                    bg: 'bg-gray-500/20'
                },
                {
                    id: 'fase2',
                    tab: 'Procesamiento',
                    name: 'Cloud Computing & Seguridad',
                    icon: 'CloudLightning',
                    technologies: ['Infraestructura Serverless', 'Ciberseguridad Industrial', 'Data Lakes & Pipelines'],
                    benefit: 'Infraestructura resiliente, escalable y protegida contra ciberamenazas.',
                    color: 'text-neon-cyan',
                    border: 'border-neon-cyan',
                    bg: 'bg-neon-cyan/20'
                },
                {
                    id: 'fase3',
                    tab: 'Analítica',
                    name: 'Visualización & BI',
                    icon: 'LayoutDashboard',
                    technologies: ['Big Data & Análisis Crítico', 'Dashboards Dinámicos', 'Digital Twins (Simulación)'],
                    benefit: 'Toma de decisiones ágil y control milimétrico de mermas y OEE.',
                    color: 'text-neon-green',
                    border: 'border-neon-green',
                    bg: 'bg-neon-green/20'
                },
                {
                    id: 'fase4',
                    tab: 'Autonomía',
                    name: 'IA & Sistemas Expertos',
                    icon: 'BrainCircuit',
                    technologies: ['Machine Learning', 'Sistemas IA expertos en su Proceso', 'Sistemas Expertos de Control'],
                    benefit: 'Operación autónoma, predicción de fallos mecánicos y máximo ROI.',
                    color: 'text-neon-purple',
                    border: 'border-neon-purple',
                    bg: 'bg-neon-purple/20'
                }
            ]
        },
        agroSentinel: {
            title: 'AGRO-SENTINEL',
            subtitle: 'Agricultura de Precisión 4.0',
            description: 'Plataforma IoT integral para el monitoreo de invernaderos. Fusionamos Edge Computing y Cloud AI para maximizar el rendimiento de sus cultivos.',
            architecture: [
                { title: 'Edge (Gateway)', desc: 'Raspberry Pi industrial. Captura térmica y telemetría Modbus en tiempo real.' },
                { title: 'Cloud (GCP)', desc: 'Serverless backend. Procesamiento de alarmas y almacenamiento en BigQuery.' },
                { title: 'Web Dashboard', desc: 'Visualización React. Chat con IA para consultar el estado del cultivo.' }
            ],
            features: [
                { title: 'Análisis Térmico', desc: 'Detección temprana de plagas mediante visión por computador (Vertex AI).' },
                { title: 'Chat con tus Datos', desc: 'Pregunta a la IA: "¿Cómo está la humedad?" y recibe respuestas naturales.' },
                { title: 'Alertas en Vivo', desc: 'Notificaciones instantáneas vía WhatsApp/Email ante anomalías.' }
            ],
            cta: 'INICIAR CONSOLA'
        },
        leadership: {
            title: 'LIDERAZGO',
            role: 'CEO & Founder',
            education: [
                'Ingeniero en Mecatrónica (ESPE - Ecuador)',
                'Máster en Sistemas Automáticos y Electrónica Industrial (UPC - España)',
                'Especialista en Sistemas avanzados de manufactura (UPC - España)'
            ]
        },
        platforms: {
            title: 'PRODUCTOS',
            subtitle: 'Ecosistema Sentinel',
            launch: 'INICIAR CONSOLA',
            items: {
                agro: {
                    title: 'Agro-Sentinel',
                    subtitle: 'Agricultura de Precisión',
                    description: 'Monitoreo de salud de cultivos, predicción de plagas y control ambiental impulsado por IA.'
                },
                industry: {
                    title: 'Industry-Sentinel',
                    subtitle: 'Manufactura 4.0',
                    description: 'Seguimiento OEE en tiempo real, mantenimiento predictivo (RUL) y automatización de procesos.'
                },
                personal: {
                    title: 'Personal-Sentinel',
                    subtitle: 'Seguridad EHS',
                    description: 'Monitoreo biométrico de seguridad, predicción de fatiga y gestión inteligente de la fuerza laboral.'
                }
            }
        },
        contact: {
            title: 'Cuéntanos tu Desafío Industrial',
            modalTitle: 'Cuéntanos tu Desafío Industrial',
            subtitle: 'Nuestro equipo de ingeniería analizará tu requerimiento y se pondrá en contacto.',
            name: 'NOMBRE COMPLETO',
            email: 'EMAIL CORPORATIVO',
            message: 'DETALLES DEL REQUERIMIENTO',
            send: 'ENVIAR REQUERIMIENTO',
            whatsapp: 'Contactar por WhatsApp'
        }
    },
    en: {
        nav: {
            about: 'WHO WE ARE',
            ecosystem: 'THE ENGINE',
            solutions: 'SERVICES',
            platforms: 'PRODUCTS',
            contact: 'CONTACT',
        },
        hero: {
            status: 'SYSTEM ONLINE • V4.0.1 ALPHA',
            titleLine1: 'Artificial Intelligence',
            titleLine2: 'Applied to Industry',
            subtitle: 'The Digital Brain of Your Industry. Real-Time Decisions, Tangible Results.',
            slogan: 'Your industry in the palm of your hand',
            cta: 'TELL US YOUR INDUSTRIAL CHALLENGE',
            description: 'Cognitex Industrial is an engineering and technology development firm focused on Industry 4.0. We integrate advanced analytics and AI to optimize processes.'
        },
        about: {
            title: 'WHO WE ARE',
            subtitle: 'WORLD-CLASS ECUADORIAN ENGINEERING',
            description: 'At Cognitex Industrial, we are a 100% Ecuadorian company dedicated to transforming the national industry. More than just providers, we are your strategic partner for developing industrial automation projects at all levels within Ecuador. Our commitment is to boost your company\'s operational capabilities, optimizing resources and maximizing your profits. We build the digital brain of your plant so you can master Industry 4.0 without halting your operations.',
            slogan: 'We transform traditional hardware into intelligent assets that multiply your profitability.'
        },
        services: {
            title: 'SERVICES',
            subtitle: 'Engineering solutions for Industry 4.0',
            items: [
                {
                    title: 'Business Intelligence & AI',
                    desc: 'Your data has a voice. We hand it the microphone. Strategic decision-making based on intelligent dashboards.',
                    icon: 'BrainCircuit'
                },
                {
                    title: 'Process Supervision',
                    desc: 'Operational Omniscience. Your entire process, one glance. Real-time monitoring of production lines.',
                    icon: 'Activity'
                },
                {
                    title: 'Custom Automation',
                    desc: 'Hardware that thinks. Software that acts. Design and implementation of solutions under industrial standards.',
                    icon: 'Cpu'
                },
                {
                    title: 'Efficiency Consulting',
                    desc: 'Mathematical Efficiency. We eliminate uncertainty. OEE optimization and waste reduction.',
                    icon: 'Factory'
                }
            ]
        },
        ecosystem: {
            title: 'THE COGNITEX ENGINE',
            subtitle: 'THE DATA LIFECYCLE',
            description: 'We unify hardware, cloud, and artificial intelligence into a continuous value stream. Select each phase to discover how we transform your industry.',
            phases: [
                {
                    id: 'fase0',
                    tab: 'Project Management',
                    name: 'Engineering & Consulting 4.0',
                    icon: 'Briefcase',
                    technologies: ['Efficiency Consulting', 'Agile Management (Scrum/Kanban)', 'Turnkey Implementation'],
                    benefit: 'Detailed audit with projected ROI and flawless execution under industrial standards.',
                    color: 'text-amber-400',
                    border: 'border-amber-500',
                    bg: 'bg-amber-500/20'
                },
                {
                    id: 'fase1',
                    tab: 'Capture',
                    name: 'Hardware Edge & Sensorics',
                    icon: 'Factory',
                    technologies: ['IIoT (Industrial Internet)', 'Machinery Retrofitting', 'PLC & SCADA Integration'],
                    benefit: 'Discovery of hidden data and real-time operational visibility.',
                    color: 'text-gray-300',
                    border: 'border-gray-500',
                    bg: 'bg-gray-500/20'
                },
                {
                    id: 'fase2',
                    tab: 'Processing',
                    name: 'Cloud Computing & Security',
                    icon: 'CloudLightning',
                    technologies: ['Serverless Infrastructure', 'Industrial Cybersecurity', 'Data Lakes & Pipelines'],
                    benefit: 'Resilient, scalable infrastructure protected against cyber threats.',
                    color: 'text-neon-cyan',
                    border: 'border-neon-cyan',
                    bg: 'bg-neon-cyan/20'
                },
                {
                    id: 'fase3',
                    tab: 'Analytics',
                    name: 'Visualization & BI',
                    icon: 'LayoutDashboard',
                    technologies: ['Big Data & Critical Analysis', 'Dynamic Dashboards', 'Digital Twins (Simulation)'],
                    benefit: 'Agile decision making and millimeter control of waste and OEE.',
                    color: 'text-neon-green',
                    border: 'border-neon-green',
                    bg: 'bg-neon-green/20'
                },
                {
                    id: 'fase4',
                    tab: 'Autonomy',
                    name: 'AI & Expert Systems',
                    icon: 'BrainCircuit',
                    technologies: ['Machine Learning', 'Process Expert AI Systems', 'Expert Control Systems'],
                    benefit: 'Autonomous operation, mechanical failure prediction and maximum ROI.',
                    color: 'text-neon-purple',
                    border: 'border-neon-purple',
                    bg: 'bg-neon-purple/20'
                }
            ]
        },
        agroSentinel: {
            title: 'AGRO-SENTINEL',
            subtitle: 'Precision Agriculture 4.0',
            description: 'Comprehensive IoT platform for greenhouse monitoring. We fuse Edge Computing and Cloud AI to maximize your crop yields.',
            architecture: [
                { title: 'Edge (Gateway)', desc: 'Industrial Raspberry Pi. Real-time thermal capture and Modbus telemetry.' },
                { title: 'Cloud (GCP)', desc: 'Serverless backend. Alarm processing and BigQuery warehousing.' },
                { title: 'Web Dashboard', desc: 'React visualization. Chat with AI to query crop status.' }
            ],
            features: [
                { title: 'Thermal Analysis', desc: 'Early pest detection using Computer Vision (Vertex AI).' },
                { title: 'Chat with Data', desc: 'Ask AI: "How is the humidity?" and get natural responses.' },
                { title: 'Live Alerts', desc: 'Instant notifications via WhatsApp/Email on anomalies.' }
            ],
            cta: 'LAUNCH CONSOLE'
        },
        leadership: {
            title: 'LEADERSHIP',
            role: 'CEO & Founder',
            education: [
                'Mechatronics Engineer (ESPE - Ecuador)',
                'Master in Automatic Systems and Industrial Electronics (UPC - Spain)',
                'Specialist in Advanced Manufacturing Systems (UPC - Spain)'
            ]
        },
        platforms: {
            title: 'PRODUCTS',
            subtitle: 'Sentinel Ecosystem',
            launch: 'LAUNCH CONSOLE',
            items: {
                agro: {
                    title: 'Agro-Sentinel',
                    subtitle: 'Precision Agriculture',
                    description: 'AI-driven monitoring for crop health, pest prediction, and environmental control.'
                },
                industry: {
                    title: 'Industry-Sentinel',
                    subtitle: 'Manufacturing 4.0',
                    description: 'Real-time OEE tracking, predictive maintenance (RUL), and process automation.'
                },
                personal: {
                    title: 'Personal-Sentinel',
                    subtitle: 'Workforce EHS',
                    description: 'Biometric safety monitoring, fatigue prediction, and smart workforce allocation.'
                }
            }
        },
        contact: {
            title: 'Tell Us Your Industrial Challenge',
            modalTitle: 'Tell Us Your Industrial Challenge',
            subtitle: 'Our engineering team will analyze your requirement and get in touch.',
            name: 'FULL NAME',
            email: 'WORK EMAIL',
            message: 'REQUIREMENT DETAILS',
            send: 'SUBMIT REQUIREMENT',
            whatsapp: 'Contact via WhatsApp'
        }
    }
};
