import type { Dictionary } from './es';

/**
 * English translation. Mirrors es.ts exactly — the `Dictionary` type makes
 * a missing key a compile error.
 *
 * `Dictionary` is inferred from an `as const` object, so every leaf is a
 * Spanish *string literal* type and no English text could ever satisfy it.
 * `Translated<Dictionary>` widens the leaves to `string` while preserving
 * keys, nesting and tuple lengths: a missing key, an extra key or an array
 * of the wrong length all still fail to compile.
 */
type Translated<T> = T extends string ? string : { readonly [K in keyof T]: Translated<T[K]> };

export const en: Translated<Dictionary> = {
    meta: {
        locale: 'en',
        htmlLang: 'en',
        ogLocale: 'en_US',
    },

    nav: {
        engines: 'Engines',
        energia: 'Energy',
        agentes: 'Agents',
        flotas: 'Fleets',
        demo: 'Live demo',
        casos: 'Cases',
        nosotros: 'About',
        contacto: 'Contact',
        cta: 'Talk to the agent',
        openMenu: 'Open navigation menu',
        closeMenu: 'Close navigation menu',
        switchLang: 'View this site in Spanish',
        skipToContent: 'Skip to content',
    },

    home: {
        seo: {
            title: 'Cognitex Industrial · Engineering that pays for itself',
            description:
                'We cut your electricity bill, your fuel spend and the sales you lose by not answering. Diagnostic with a 3× guarantee in one week. Quito, Ecuador.',
        },

        hero: {
            status: 'COGNITEX AI NETWORK · ONLINE',
            title: 'Artificial intelligence',
            titleAccent: 'applied to industry',
            subtitle: 'The digital brain of your operation.',
            lead: 'We bring together edge hardware, real-time analytics and expert AI so your plant, your fleet and your customer service stop reacting and start anticipating.',
            slogan: 'From raw data to operational command.',
            ctaPrimary: 'Tell us your challenge',
            ctaSecondary: 'See how it works',
            scrollCue: 'The data cycle',
        },

        /* The hook. Opens in the reader's world, not in our credentials. */
        tension: {
            kicker: 'The starting point',
            title: 'Your operation is already talking.',
            titleAccent: 'Nobody is listening.',
            body: [
                'The motor that has been vibrating differently since Tuesday. The fuel-up that does not square with the kilometers. The message that came in at 9pm on a Saturday and nobody answered.',
                'Those are signals. They exist today, inside your operation, and they are lost because nothing is capturing them. The distance between a plant that reacts and one that anticipates is not more technology: it is listening to what is already there.',
            ],
        },

        identity: {
            kicker: 'Who we are',
            title: 'We are not a technology vendor. We are the digital brain of your operation.',
            body: [
                'We integrate edge hardware, cloud computing and expert AI systems to turn industrial infrastructure into intelligent assets: machines that warn before they fail, fleets that explain their own consumption, processes that correct themselves.',
                'We come from maintaining critical infrastructure, where a failure is not a ticket in a queue: it is a stopped operation and people waiting. That is where you learn to distrust pretty dashboards and to demand an instrument behind every number.',
            ],
            pillars: {
                edge: {
                    title: 'Edge hardware',
                    body: 'Sensors, PLCs and gateways that capture the physical reality of your plant and deliver it clean, without depending on someone writing it down.',
                },
                cloud: {
                    title: 'Cloud and analytics',
                    body: 'Telemetry that persists, correlates and can be queried. Real history to measure every improvement we promise against.',
                },
                ai: {
                    title: 'Expert AI',
                    body: 'Models that catch the anomaly before the operator does, and agents that answer with the right catalogue and the right price.',
                },
            },
            commitment:
                'Our commitment is measurable: zero unplanned downtime, maximum efficiency, and autonomous decisions backed by data you can audit.',
        },

        /*
         * The centerpiece. Everything Cognitex sells is one of these five
         * stages; the products further down are this cycle applied to a
         * domain. It is the spine of the story, so it gets the most room.
         */
        cycle: {
            kicker: 'How it works',
            title: 'The data cycle',
            lead: 'A data point that never closes the loop is a cost. This is the full path, from the physical signal to the decision that makes itself — and where we come in depends on where your operation stands today.',
            phaseLabel: 'Phase',
            phases: [
                {
                    id: 'consultoria',
                    n: '01',
                    name: 'Consulting',
                    headline: 'First we find out what hurts',
                    body: 'Before we install a single sensor, we walk your operation and measure the baseline. Without it, any improvement we promise you later is an opinion.',
                    detail: 'Instrumented diagnostic · Measured baseline · 3× guarantee',
                },
                {
                    id: 'captura',
                    n: '02',
                    name: 'Capture',
                    headline: 'We instrument physical reality',
                    body: 'Sensors, PLCs and gateways that read what the machine does, not what the shift reports. The signal leaves the plant floor without depending on someone writing it down.',
                    detail: 'Industrial sensing · Modbus and OPC-UA · Edge gateways',
                },
                {
                    id: 'procesamiento',
                    n: '03',
                    name: 'Processing',
                    headline: 'We clean, correlate, persist',
                    body: 'Raw data lies: it cuts out, it duplicates, it arrives late. We normalize it and store it with its context, so that two years from now it still means the same thing.',
                    detail: 'Real-time ingestion · Time series · Traceability',
                },
                {
                    id: 'analitica',
                    n: '04',
                    name: 'Analytics',
                    headline: 'We find the pattern before the operator does',
                    body: 'Models that learn the normal behavior of each asset and speak up when it drifts. The alert arrives while it is still maintenance, not once it is already downtime.',
                    detail: 'Anomaly detection · Predictive maintenance · Live dashboards',
                },
                {
                    id: 'autonomia',
                    n: '05',
                    name: 'Autonomy',
                    headline: 'The system decides and you supervise',
                    body: 'Agents that answer, adjust and escalate on their own, inside the limits you set. Your people stop watching screens and go back to doing engineering.',
                    detail: 'AI agents · Guardrailed rules · Monthly report in USD',
                },
            ],
        },

        pain: {
            kicker: 'The three places',
            title: 'Where is your money going?',
            description:
                'Each card is a measurable problem with a hard number from Ecuador behind it. Pick yours and we show you the math.',
            cards: {
                energia: {
                    title: 'Energy',
                    stat: '8–12%',
                    statLabel: 'of an industrial electricity bill is recoverable',
                    body: 'Penalized power factor, mismanaged demand and generators running when nothing needs them. You measure that with a power analyzer, not with the bill.',
                    cta: 'Calculate my electricity savings',
                },
                agentes: {
                    title: 'Agents',
                    stat: '1 in 3',
                    statLabel: 'WhatsApp queries goes unanswered at small and mid-sized firms',
                    body: "You don't lose the sale on price: you lose it because nobody answered at 9pm on a Saturday. An agent that always replies, with the right catalog and the right price.",
                    cta: 'Calculate my lost sales',
                },
                flotas: {
                    title: 'Fleets',
                    stat: '8–12%',
                    statLabel: 'of fuel spend is a leak you can fix',
                    body: 'Long idling, suboptimal routes and consumption nobody reconciles against the gallons invoiced. GPS plus fuel-up reconciliation.',
                    cta: 'Calculate my fuel leak',
                },
            },
        },

        demo: {
            statusLive: 'Live measurement',
            statusSimulated: 'No signal · simulated curve',
            statusHelp:
                'The sensor has not reported in the last hour. What you see is a reference curve, not a measurement.',
            kicker: 'Transparency',
            title: 'The live demo',
            description:
                'Our office and our vehicle, measured and published here. When a sensor stops reporting we say so on screen instead of filling the gap — which is exactly what we will do with your operation.',
            power: { title: 'Office power', subtitle: 'Last 24 hours' },
            vehicle: { title: 'Vehicle', subtitle: "Today's route" },
            cta: 'See the full demo',
        },

        process: {
            kicker: 'How we work',
            title: 'Three steps, no surprises',
            steps: [
                {
                    n: '01',
                    title: 'Diagnostic with a 3× guarantee',
                    body: "We instrument your operation for a week. If the annual savings we find don't triple what the diagnostic costs, we don't charge for it.",
                },
                {
                    n: '02',
                    title: 'System with 50% up front',
                    body: 'Only once you have seen the figure do we decide whether there is a project. Half at kick-off, half on delivery of a working system.',
                },
                {
                    n: '03',
                    title: 'Monthly report in dollars',
                    body: 'Every month you get how much you saved, measured against the baseline. In dollars, not in pretty percentages.',
                },
            ],
        },

        why: {
            kicker: 'Why Cognitex',
            title: 'Field engineering, not slide decks',
            cards: {
                metro: {
                    title: 'Critical infrastructure',
                    body: 'We come from running systems where a failure stops the service and people notice. That is where you learn that a badly placed sensor costs more than the sensor.',
                },
                cross: {
                    title: 'OT + IT + AI',
                    body: 'Most vendors know automation or they know software. The money shows up at the intersection: a PLC that talks to the cloud and an AI that decides on clean data.',
                },
                agents: {
                    title: 'Twelve in-house agents',
                    body: 'We run our own company on the agents we sell. If they are not good enough for us, we do not offer them to you.',
                },
                guarantee: {
                    title: 'Guarantees in writing',
                    body: '3× on the diagnostic or it is free. Savings measured against a baseline. No mandatory lock-in.',
                },
            },
        },

        coverage: {
            kicker: 'Coverage',
            title: 'Do we cover your area?',
            description:
                'Pichincha with same-day on-site response. Guayas within 48 hours. The rest of the country, remote plus scheduled visits.',
            placeholder: 'Where is your plant or your fleet?',
            answerYes: 'We cover your area',
            answerRemote: 'Your area is covered remotely and with scheduled visits',
            cta: 'Schedule a visit',
        },

        platforms: {
            kicker: 'Platforms',
            title: 'The consoles already running',
            description:
                'Every engine ships its own dashboard. These are the same platforms we run ourselves, not sales mockups.',
            statusLive: 'Online',
            statusSoon: 'In preparation',
            open: 'Open console',
            soonNote: 'No public access yet',
            items: {
                industry: {
                    name: 'Industry Sentinel',
                    body: 'Plant and production line: OEE, availability, downtime and predictive maintenance.',
                },
                personal: {
                    name: 'Personal Sentinel',
                    body: 'Workforce safety: presence by zone, PPE compliance and incident reporting.',
                },
                agro: {
                    name: 'Agro Sentinel',
                    body: 'Greenhouse: climate sensors, thermal image analysis and natural-language queries.',
                },
                transport: {
                    name: 'Transport Sentinel',
                    body: 'Railway operations: live fleet, punctuality, maintenance orders and RAMS metrics.',
                },
                productivity: {
                    name: 'Productivity Sentinel',
                    body: 'Site productivity: constraint board, weekly plan compliance and Pareto of causes.',
                },
                cash: {
                    name: 'Cash Sentinel',
                    body: 'Currency and remittances: transfer calculations at live exchange rates, in three languages.',
                },
            },
        },

        cases: {
            kicker: 'Cases',
            title: 'First projects under way',
            body: 'We would rather not invent logos. The first projects are running and we will publish the figures once we have twelve months measured. In the meantime, the live demo shows our own operation in real time.',
            cta: 'See the live demo',
        },

        faq: {
            kicker: 'Questions',
            title: 'What everyone asks',
            items: [
                {
                    q: 'How much does it cost?',
                    a: 'The diagnostic is quoted against the size of the operation and comes with the 3× guarantee: if the annual savings we find do not triple its cost, we do not charge for it. Customer-service agents start at USD 490 a month. Energy and fleet systems are quoted per project, with 50% up front.',
                },
                {
                    q: 'How long does it take?',
                    a: 'The diagnostic takes a week of instrumentation plus a few days of analysis. A customer-service agent goes into production in two to three weeks. An energy monitoring system, four to eight weeks depending on how many measurement points there are.',
                },
                {
                    q: 'What if it does not work?',
                    a: 'That is why the diagnostic comes first, and with a guarantee. We measure your baseline before touching anything, and the monthly report compares against that baseline. If the savings do not show up, you have the number that proves it and we have a problem to solve.',
                },
                {
                    q: 'What happens to my data?',
                    a: "Your data is yours. We operate under Ecuador's Personal Data Protection Law (LOPDP): declared purpose, minimum necessary data and an effective right to erasure. Telemetry lives on Google Cloud infrastructure with access segmented per client. We do not train models on one client's information for another.",
                },
                {
                    q: 'Do I have to sign a lock-in?',
                    a: "No. Monthly services are canceled with thirty days' notice. Implementation projects have their own works contract, with deliverables and acceptance.",
                },
                {
                    q: 'What is support like?',
                    a: 'A direct WhatsApp channel with an engineer, not a ticket in a queue. Same-day on-site response in Pichincha, within 48 hours in Guayas. The systems monitor themselves and alert us before you notice.',
                },
            ],
        },

        finalCta: {
            title: 'Start with the number, not the proposal',
            body: 'Message us on WhatsApp with the size of your operation. In that same conversation we tell you which of the three engines to measure first.',
            cta: 'Talk to the agent',
            secondary: 'Send an email',
        },
    },

    engines: {
        energia: {
            seo: {
                title: 'Energy Sentinel · Cut your electricity bill | Cognitex',
                description:
                    'Power factor, demand and generators. Calculate how much of your industrial electricity bill you can recover. Diagnostic with a 3× guarantee.',
            },
            hero: {
                eyebrow: 'Engine A · Energy',
                title: 'Your electricity bill has 8% to 12% of fat in it',
                lead: 'Power factor penalties, demand peaks nobody watches and generators running out of habit. You fix it by measuring, and it pays for itself.',
            },
            calc: {
                title: 'Electricity savings calculator',
                subtitle: 'Three numbers from your last bill are enough.',
                fields: {
                    bill: { label: 'Monthly electricity bill', unit: 'USD/mo', help: 'The total you pay, not just the consumption.' },
                    pf: { label: 'Are you penalized for power factor?', help: 'It shows on the bill as "PF penalty" or "low power factor".' },
                    pfPct: { label: 'Monthly penalty', unit: 'USD/mo', help: 'If you do not have it to hand, leave the estimate.' },
                    genset: { label: 'Generator hours per month', unit: 'hrs/mo', help: 'Diesel burned during outages or demand peaks.' },
                },
                pfOptions: { yes: 'Yes', no: 'No', unknown: 'Not sure' },
                results: {
                    monthly: 'Estimated monthly savings',
                    annual: 'Estimated annual savings',
                    payback: 'Payback on the monitoring system',
                    paybackUnit: 'months',
                    band: 'Conservative — optimistic range',
                },
                cta: 'Get this calculation on WhatsApp',
                disclaimer:
                    'Estimate based on typical ranges in Ecuadorian industry. The real figure comes out of the instrumented diagnostic.',
            },
            includes: {
                title: 'What it includes',
                items: [
                    'Power analyzer on the critical points during the diagnostic',
                    'Permanent metering per switchboard, not only at the service entrance',
                    'Alerts for power factor and for closing in on contracted demand',
                    'Monthly report in dollars against your baseline',
                    'Capacitor bank sizing if one is needed',
                ],
            },
        },

        agentes: {
            seo: {
                title: 'Support agents · Stop losing sales to silence | Cognitex',
                description:
                    'An agent that always answers WhatsApp, with your catalog and your prices. Calculate how much sale you are losing by not replying in time.',
            },
            hero: {
                eyebrow: 'Engine B · Agents',
                title: "You don't lose the sale on price. You lose it because nobody answered.",
                lead: 'An agent that handles every query in seconds, with your real catalog and prices, and hands the warm lead to a person when it is time to close.',
            },
            calc: {
                title: 'Recoverable sales calculator',
                subtitle: 'Four numbers you already know.',
                fields: {
                    chats: { label: 'Queries per week', unit: 'chats/wk', help: 'WhatsApp, Instagram and web combined.' },
                    unanswered: { label: 'Percentage unanswered or answered late', unit: '%', help: 'After hours, holidays, or it simply slipped through.' },
                    ticket: { label: 'Average ticket', unit: 'USD', help: 'What a typical sale invoices.' },
                    closeRate: { label: 'Close rate when you do answer', unit: '%', help: 'Out of every 100 queries handled, how many buy.' },
                },
                results: {
                    monthly: 'Recoverable sales per month',
                    annual: 'Recoverable sales per year',
                    net: 'Net after the cost of the agent',
                    cost: 'Cost of the agent',
                    band: 'Conservative — optimistic range',
                },
                cta: 'Get this calculation on WhatsApp',
                disclaimer:
                    'Assumes the agent recovers between 60% and 85% of the queries that go unattended today. Not every query handled turns into a sale.',
            },
            includes: {
                title: 'What it includes',
                items: [
                    'An agent on WhatsApp Business with your catalog and prices loaded',
                    'Replies in seconds, 24 hours a day, holidays included',
                    'Handover to a person when the customer asks to close or goes off script',
                    'Guardrails: it does not invent prices or promise deadlines you did not authorize',
                    'Voice-note transcription and a record of every conversation',
                    'Weekly report of queries, topics and attributed sales',
                ],
            },
        },

        flotas: {
            seo: {
                title: 'Fleet Sentinel · Recover 8–12% of your fuel | Cognitex',
                description:
                    'Idling, routes and unreconciled fuel-ups. Calculate how much fuel your fleet is losing every month. Diagnostic with a 3× guarantee.',
            },
            hero: {
                eyebrow: 'Engine C · Fleets',
                title: 'Between 8% and 12% of your fuel goes on things you can fix',
                lead: 'Long idling, routes nobody optimizes and invoiced gallons that do not square with the kilometers driven. It shows up when you measure it.',
            },
            calc: {
                title: 'Fuel leak calculator',
                subtitle: 'Three numbers from your operation.',
                fields: {
                    vehicles: { label: 'Vehicles in the fleet', unit: 'units', help: 'The ones burning company fuel.' },
                    gallons: { label: 'Gallons per month', unit: 'gal/mo', help: 'Total invoiced across the whole fleet.' },
                    price: { label: 'Price per gallon', unit: 'USD/gal', help: 'Diesel or gasoline, whichever dominates.' },
                },
                results: {
                    monthly: 'Recoverable per month',
                    annual: 'Recoverable per year',
                    net: 'Net after the monthly fee',
                    cost: 'Estimated monthly fee',
                    perVehicle: 'Per vehicle per month',
                    band: 'Conservative — optimistic range',
                },
                cta: 'Get this calculation on WhatsApp',
                disclaimer:
                    'Typical range for fleets with no prior telemetry. The diagnostic measures your case with GPS and fuel-up reconciliation.',
            },
            includes: {
                title: 'What it includes',
                items: [
                    'GPS reporting idling, speed and routes per vehicle',
                    'Reconciliation of invoiced gallons against actual consumption',
                    'Alerts for fuel-ups off route or outside working hours',
                    'Driver ranking by comparable consumption',
                    'Monthly report in dollars against your baseline',
                ],
            },
        },
    },

    common: {
        pricingFrom: 'From',
        perMonth: 'per month',
        guarantee: '3× guarantee on the diagnostic',
        guaranteeBody:
            'If the annual savings we find do not triple what the diagnostic costs, we do not charge you for it.',
        calcInvalid: 'Fill in the fields to see the calculation.',
        calcError: 'Check the values: they must be positive numbers.',
        mobileCta: 'Talk to the agent',
        backHome: 'Back to home',
    },

    demoPage: {
        seo: {
            title: 'Live demo · Our operation in real time | Cognitex',
            description:
                'Our office electricity use and our vehicle route, live. Your dashboard will be exactly this transparent.',
        },
        title: 'Our operation, live',
        lead: 'Before we ask you to trust us with your data, we show you ours. This is the same thing you will see of your plant or your fleet.',
        note: 'The data refreshes every 30 seconds.',
    },

    casesPage: {
        seo: {
            title: 'Cases · Cognitex Industrial',
            description: 'Projects under way and measured results from Cognitex Industrial.',
        },
        title: 'Cases',
        lead: 'We publish figures, not logos. These are the projects running today.',
    },

    aboutPage: {
        seo: {
            title: 'About · Cognitex Industrial',
            description:
                'Operations and maintenance engineering applied to energy, customer service and fleets. Quito, Ecuador.',
        },
        title: 'Engineer to engineer',
        lead: 'Cognitex came out of operating critical infrastructure, not out of a sales deck.',
        body: [
            'We come from operating and maintaining critical infrastructure, where a failure is not a ticket in a queue: it is a stopped service and people waiting. That is where you learn to distrust pretty dashboards and to demand an instrument behind every number.',
            'Most suppliers know industrial automation or they know software. The money shows up at the intersection of the two, when a PLC hands clean data to a cloud that an artificial intelligence can use to decide. That intersection is what we do.',
            'We run our own company on the same agents we sell, and we monitor our office and our vehicle with the same systems. What you see in the live demo is our operation, not a simulation.',
        ],
    },

    contactPage: {
        seo: {
            title: 'Contact · Cognitex Industrial',
            description:
                'Talk to a Cognitex Industrial engineer. WhatsApp, email or book a call.',
        },
        title: "Let's talk numbers",
        lead: 'Tell us the size of your operation and we tell you which of the three engines is worth measuring first.',
        form: {
            name: 'Name',
            company: 'Company',
            phone: 'Phone',
            email: 'Email',
            engine: 'Engine of interest',
            enginePlaceholder: 'Select one',
            engineOptions: {
                energia: 'Energy',
                agentes: 'Support agents',
                flotas: 'Fleets',
                other: 'Not sure yet',
            },
            message: 'Message',
            submit: 'Send',
            sending: 'Sending…',
            success: 'Received. We reply within one business day.',
            error: 'We could not send the form. Message us on WhatsApp and we will sort it out there.',
            required: 'Required field',
            invalidEmail: 'Invalid email',
        },
        alt: {
            title: 'Or faster still',
            whatsapp: 'WhatsApp direct with an engineer',
            email: 'Email',
        },
    },

    legalPage: {
        seo: {
            title: 'Privacy policy · Cognitex Industrial',
            description:
                "How Cognitex Industrial handles personal data under Ecuador's Personal Data Protection Law (LOPDP).",
        },
        title: 'Privacy policy',
        updated: 'Last updated',
    },

    footer: {
        tagline: 'Engineering that pays for itself.',
        engines: 'Engines',
        platforms: 'Platforms',
        company: 'Company',
        legal: 'Legal',
        privacy: 'Privacy policy',
        rights: 'All rights reserved.',
        lopdp: "We process personal data in line with Ecuador's Personal Data Protection Law (LOPDP).",
        location: 'Quito, Ecuador',
    },

    cookies: {
        title: 'Analytics',
        body: 'We use analytics to know which sections work and which do not. No advertising, no selling data.',
        accept: 'Accept',
        reject: 'Reject',
        more: 'Learn more',
    },
};
