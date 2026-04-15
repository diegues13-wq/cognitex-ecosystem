const fs = require('fs');

let content = fs.readFileSync('src/pages/Landing.jsx', 'utf8');

// Section Herencia
content = content.replace(/>LATITUD</g, ">{t('heritage_ui.lat_label')}<");
content = content.replace(/'0°0\\'0\\"' \/ LATITUD/g, "'0°0\\'0\\"' / \" + t('heritage_ui.lat_label')"); // If any
content = content.replace(/LATITUD/g, "{t('heritage_ui.lat_label')}");
content = content.replace(/>Grano de Exportación</g, ">{t('heritage_ui.export_bean')}<");
content = content.replace(/>Café de <span/g, ">{t('heritage_ui.coffee_title')}<span");
content = content.replace(/>Gran Altura</g, ">{t('heritage_ui.coffee_hl')}<");
content = content.replace(/>Entorno</g, ">{t('heritage_ui.env')}<");
content = content.replace(/>Suelos Minerales</g, ">{t('heritage_ui.env_coffee')}<");
content = content.replace(/>Proceso</g, ">{t('heritage_ui.proc')}<");
content = content.replace(/>Recolección Selectiva</g, ">{t('heritage_ui.proc_coffee')}<");
content = content.replace(/>Maduración</g, ">{t('heritage_ui.maturation')}<");
content = content.replace(/>Lenta y Constante</g, ">{t('heritage_ui.maturation_coffee')}<");
content = content.replace(/>Perfil</g, ">{t('heritage_ui.profile')}<");
content = content.replace(/>Balance y Complejidad</g, ">{t('heritage_ui.profile_coffee')}<");
// We also have 'Fruto de Origen' and 'Cacao Fino de Aroma' in the code. Let's do exact replaces based on the previous view:
content = content.replace(/>Fruto de Origen</g, ">{t('heritage_ui.fruit_origin')}<");
content = content.replace(/>Cacao Fino <span/g, ">{t('heritage_ui.cacao_title')}<span");
content = content.replace(/>de Aroma</g, ">{t('heritage_ui.cacao_hl')}<");
content = content.replace(/>Bosque Tropical</g, ">{t('heritage_ui.env_cacao')}<");
content = content.replace(/>Clasificación</g, ">{t('heritage_ui.classi')}<");
content = content.replace(/>Premium de Aromas</g, ">{t('heritage_ui.classi_cacao')}<");
content = content.replace(/>Agricultura</g, ">{t('heritage_ui.agri')}<");
content = content.replace(/>En Sombra Natural</g, ">{t('heritage_ui.agri_cacao')}<");
content = content.replace(/>Artesanía</g, ">{t('heritage_ui.craft')}<");
content = content.replace(/>Fermentación Precisa</g, ">{t('heritage_ui.craft_cacao')}<");

// Atlas Section
content = content.replace(/Tracker ECU \/\/ Lat_0/g, "{t('atlas_ui.tracker')}");
content = content.replace(/>Costa \/ Litoral</g, ">{t('atlas_ui.costa')}<");
content = content.replace(/>Sierra \/ Andes</g, ">{t('atlas_ui.sierra')}<");
content = content.replace(/>Amazonía \/ Oriente</g, ">{t('atlas_ui.amazonia')}<");
content = content.replace(/>Mútiples Cepas</g, ">{t('atlas_ui.multiple_strains')}<"); // fixing spelling while we are at it, assuming original had it as 'Mútiples'
content = content.replace(/Variedad \{productIndex \+ 1\} de \{BOTANICAL_ATLAS\[activeRegion\]\.products\.length\}/g, "{t('atlas_ui.variety_prefix')}{productIndex + 1}{t('atlas_ui.variety_middle')}{BOTANICAL_ATLAS[activeRegion].products.length}");
content = content.replace(/> Origen Genético</g, "> {t('atlas_ui.genetic_origin')}<");
content = content.replace(/> Notas de Cultivo</g, "> {t('atlas_ui.crop_notes')}<");
content = content.replace(/> Perfil Sensorial Principal</g, "> {t('atlas_ui.sensory_profile')}<");
content = content.replace(/>\s*Descargar Catálogo Botánico\s*</g, ">{t('atlas_ui.download_catalog')}<");

// Tu Red de Exportacion
content = content.replace(/>Ecosistema Comercial</g, ">{t('network.ecosystem')}<");
content = content.replace(/>Tu Red de <span/g, ">{t('network.title1')}<span");
content = content.replace(/>Exportación</g, ">{t('network.title2')}<");
content = content.replace(/>Para Proveedores</g, ">{t('network.badge_supplier')}<");
content = content.replace(/>Vende tu <span/g, ">{t('network.sup_title1')}<span");
content = content.replace(/>Café y Cacao<\/span> al Mundo</g, ">{t('network.sup_title2')}</span>{t('network.sup_title3')}<");
content = content.replace(/>Conecta tu finca directamente con importadores premium en Europa, Rusia y Asia. Eliminamos intermediarios y maximizamos el valor de tu cosecha con precios justos y pagos seguros.</g, ">{t('network.sup_desc')}<");
content = content.replace(/>Precios Premium Garantizados</g, ">{t('network.sup_f1_t')}<");
content = content.replace(/>Accede a mercados B2B que pagan 30-60% más que el precio local.</g, ">{t('network.sup_f1_d')}<");
content = content.replace(/>Procesos Certificados EUDR</g, ">{t('network.sup_f2_t')}<");
content = content.replace(/>Te acompañamos en la documentación fitosanitaria y de trazabilidad.</g, ">{t('network.sup_f2_d')}<");
content = content.replace(/>Logística sin Complicaciones</g, ">{t('network.sup_f3_t')}<");
content = content.replace(/>Nosotros coordinamos el transporte desde tu finca hasta el puerto.</g, ">{t('network.sup_f3_d')}<");
content = content.replace(/>Mejora Continua de tu Finca</g, ">{t('network.sup_f4_t')}<");
content = content.replace(/>Feedback de compradores internacionales para optimizar tu producción.</g, ">{t('network.sup_f4_d')}<");
content = content.replace(/>Registrar mi Finca</g, ">{t('network.sup_cta')}<");

content = content.replace(/>Para Compradores</g, ">{t('network.badge_buyer')}<");
content = content.replace(/>Importa con <span/g, ">{t('network.buy_title1')}<span");
content = content.replace(/>Trazabilidad Total<\/span> del Origen</g, ">{t('network.buy_title2')}</span>{t('network.buy_title3')}<");
content = content.replace(/>Obtén cacao y café especial con certeza absoluta del origen. Accede a fichas técnicas por lote, coordenadas de finca y documentación completa EUDR desde el primer pedido.</g, ">{t('network.buy_desc')}<");
content = content.replace(/>Coordenadas GPS de cada Finca</g, ">{t('network.buy_f1_t')}<");
content = content.replace(/>Conoce exactamente de dónde proviene cada lote que adquieres.</g, ">{t('network.buy_f1_d')}<");
content = content.replace(/>Perfil Sensorial por Lote</g, ">{t('network.buy_f2_t')}<");
content = content.replace(/>Fichas técnicas completas: acidez, notas, variedad, altitud y proceso.</g, ">{t('network.buy_f2_d')}<");
content = content.replace(/>Volúmenes Flexibles</g, ">{t('network.buy_f3_t')}<");
content = content.replace(/>Desde muestras de 60 kg hasta contenedores FCL de 18 toneladas.</g, ">{t('network.buy_f3_d')}<");
content = content.replace(/>Cumplimiento EUDR desde Origen</g, ">{t('network.buy_f4_t')}<");
content = content.replace(/>Documentación lista para aduanas europeas. Cero fricciones legales.</g, ">{t('network.buy_f4_d')}<");
content = content.replace(/>Solicitar Catálogo</g, ">{t('network.buy_cta')}<");

// Contact
content = content.replace(/>Envíanos un Correo</g, ">{t('contact_ui.email_title')}<");
content = content.replace(/>Para solicitudes de proformas exclusivas y detalles del catálogo de exportación.</g, ">{t('contact_ui.email_desc')}<");
content = content.replace(/>Atención Directa</g, ">{t('contact_ui.wa_title')}<");
content = content.replace(/>Conéctate vía WhatsApp para respuestas ejecutivas inmediatas.</g, ">{t('contact_ui.wa_desc')}<");
content = content.replace(/>Iniciar Conversación</g, ">{t('contact_ui.wa_cta')}<");
content = content.replace(/placeholder="Correo Electrónico"/g, "placeholder={t('contact_ui.pl_email')}");
content = content.replace(/>Selecciona un Interés</g, ">{t('contact_ui.pl_interest')}<");
content = content.replace(/>Cacao Fino de Aroma</g, ">{t('contact_ui.pl_cacao')}<");
content = content.replace(/>Café de Gran Altura</g, ">{t('contact_ui.pl_coffee')}<");
content = content.replace(/>Ambos \/ Portafolio Completo</g, ">{t('contact_ui.pl_both')}<");
content = content.replace(/placeholder="¿Cómo podemos ayudarte\? Compártenos los detalles de tu consulta\.\.\."/g, "placeholder={t('contact_ui.pl_msg')}");


fs.writeFileSync('src/pages/Landing.jsx', content);

console.log("Replaced UI strings dynamically in Landing.jsx.");
