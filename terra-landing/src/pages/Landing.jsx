import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const BOTANICAL_ATLAS = {
  pichincha: {
    name: "Tierras Altas del Norte",
    province: "Pichincha e Imbabura",
    productType: "Café de Especialidad Extrema (Arábica)",
    coords: { top: "28%", left: "50%" },
    products: [
      {
        variedad: "Geisha",
        genetica: "Etiopía (Linaje Exótico)",
        sensorial: "Sabor floral delicado (jazmín), notas de frutas tropicales y acidez viva.",
        cultivo: "Variedad exótica de alto valor comercial; requiere altitudes extremas."
      },
      {
        variedad: "Sidra",
        genetica: "Ecuador (Híbrido Natural)",
        sensorial: "Perfil complejo, notas mentoladas, acidez tartárica, y frutos rojos.",
        cultivo: "Desarrollada genéticamente en Pichincha; favorita absoluta en campeonatos mundiales de barismo."
      },
      {
        variedad: "Typica Mejorado",
        genetica: "Ecuador (Cruce Bourbon x Variedad Etíope)",
        sensorial: "Dulzor refinado, acidez cítrica compleja, marcadas notas de frutas rojas.",
        cultivo: "Fenotipo muy resistente y biológicamente limpio en taza."
      }
    ]
  },
  manabi: {
    name: "Refugio del Cacao Ancestral",
    province: "Valle de Piedra de Plata, Manabí",
    productType: "Cacao Ancestral 100% Puro",
    coords: { top: "35%", left: "5%" },
    products: [
      {
        variedad: "Cacao Nacional Fino de Aroma",
        genetica: "Nacional / Complejo Nacional Puro",
        sensorial: "Perfil inmaculado: Floral, frutal, marcadas notas de nuez.",
        cultivo: "Mazorca amarilla en maduración. Fermentación corta (2-4 días). Destinado 100% a chocolatería gourmet y barras de origen. Precio Premium (High Grade)."
      }
    ]
  },
  losrios: {
    name: "Cuenca del Guayas & Los Ríos",
    province: "Los Ríos, Guayas, El Oro",
    productType: "Cacao Commodity & Fino de Aroma",
    coords: { top: "50%", left: "25%" },
    products: [
      {
        variedad: "Cacao Nacional Fino de Aroma",
        genetica: "Nacional / Complejo Nacional",
        sensorial: "Elevado nivel Floral, frutal, y notas de nuez.",
        cultivo: "Uso Principal: Chocolatería gourmet, barras de origen premium. Fermentación ágil de 2-4 días."
      },
      {
        variedad: "Cacao CCN-51 (Clon de Alta Eficiencia)",
        genetica: "Híbrido (Triploide)",
        sensorial: "Base de cacao fuerte, ácido, notas amargas persistentes.",
        cultivo: "Mazorca Roja/Púrpura. Exige fermentación larga (5-7 días). Uso principal: Manteca de cacao, polvos, manufactura industrial B2B. Precio referencial de Bolsa (Standard)."
      }
    ]
  },
  amazonia: {
    name: "La Frontera Oriental",
    province: "Napo & Orellana",
    productType: "Fine Robusta (Canephora)",
    coords: { top: "40%", left: "68%" },
    products: [
      {
        variedad: "Robusta Amazónico de Especialidad",
        genetica: "Coffea canephora (Adaptación Ecuatorial)",
        sensorial: "Ausencia de fenoles y caucho. Notas base a chocolate denso y nueces exóticas.",
        cultivo: "Resistencia biológica extrema a nivel del mar bajo denso dosel amazónico."
      }
    ]
  },
  loja: {
    name: "Tierras Altas del Sur",
    province: "Loja & Zamora",
    productType: "Café de Especialidad Clásico (Arábica)",
    coords: { top: "92%", left: "40%" },
    products: [
      {
        variedad: "Typica",
        genetica: "Etiopía (Ancestral Clásico)",
        sensorial: "Sabor suave, equilibrado, delicadas notas de nueces y cítricos, baja acidez.",
        cultivo: "Una de las genéticas orgánicas más antiguas del país; sensible a plagas pero ostenta monumental calidad."
      },
      {
        variedad: "Bourbon",
        genetica: "Isla de Reunión (Mutación de Typica)",
        sensorial: "Sabor contundentemente dulce, afrutado, notas profundas a caramelo y chocolate.",
        cultivo: "Enorme dominancia histórica por su dulzor inigualable en altas cordilleras del sur."
      },
      {
        variedad: "Caturra",
        genetica: "Brasil (Mutación de Bourbon)",
        sensorial: "Sabor dulce y de tacto suave, prevalencia de notas a frutas y caramelo tostado.",
        cultivo: "Asegura alta productividad comercial y resistencia; porte bajo que facilita la logística y cosecha."
      },
      {
        variedad: "Catuaí",
        genetica: "Cruce Científico Mundial (Mundo Novo x Caturra)",
        sensorial: "Taza de sabor equilibrado y dulce, notas marcadas a chocolate base y frutas.",
        cultivo: "Operatividad agronómica superior. Productiva y altamente resiliente a condiciones climáticas adversas o déficit hídrico."
      }
    ]
  }
};

const Landing = () => {
  const { t } = useTranslation();
  const [activeRegion, setActiveRegion] = useState("pichincha");
  const [productIndex, setProductIndex] = useState(0);

  const handleRegionChange = (key) => {
    setActiveRegion(key);
    setProductIndex(0);
  };

  return (
    <main>
      
      {/* Section 1: Hero Macro */}
      <section className="relative min-h-[921px] pt-32 flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: "url('/hero_split.png')" }}></div>
          {/* Subtle contrast preservation without obscuring the image */}
          <div className="absolute inset-0 bg-black/20 mix-blend-multiply"></div>
          {/* Gentle fade ONLY at the bottom to ensure text legibility */}
          <div className="absolute bottom-0 w-full h-1/3 bg-gradient-to-t from-[#1a1100]/90 to-transparent"></div>
        </div>
        
        <div className="relative z-10 max-w-screen-2xl mx-auto px-12 w-full h-full flex flex-col justify-end pb-32 md:pb-48">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-64 items-end">
            {/* Flanco Izquierdo: Título */}
            <div>
              <h1 className="font-headline text-5xl md:text-7xl lg:text-[5.5rem] text-surface-bright font-bold leading-none tracking-tighter drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]">
                {t('hero.title')}
              </h1>
            </div>
            
            {/* Flanco Derecho: Subtítulo (Anchor Gradient Proposal) */}
            <div className="flex flex-col items-start lg:items-end w-full">
              <div className="relative py-6 pr-8 border-r-4 border-secondary-fixed bg-gradient-to-l from-black/70 via-black/30 to-transparent max-w-lg lg:max-w-md">
                {/* Gran ícono decorativo flotante para enmarcar el texto tipo revista */}
                <span className="material-symbols-outlined absolute -top-6 right-2 text-secondary-fixed/10 text-[8rem] pointer-events-none -z-10">
                  public
                </span>
                <p className="font-headline text-xl md:text-2xl lg:text-3xl leading-relaxed text-surface-bright font-medium drop-shadow-md relative z-10 text-right">
                  {t('hero.subtitle')}
                </p>
              </div>
            </div>
          </div>
          
          {/* Botón Central Inferior */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-full flex justify-center z-20">
            <a href="#contact" className="bg-secondary-fixed/20 backdrop-blur-md border-0 text-secondary-fixed px-12 py-6 text-lg md:text-xl font-bold rounded shadow-[0_0_30px_rgba(253,195,77,0.2)] hover:shadow-[0_0_45px_rgba(253,195,77,0.4)] hover:bg-secondary-fixed/40 hover:-translate-y-1 transition-all uppercase tracking-[0.2em] inline-flex items-center gap-4">
              <span className="material-symbols-outlined text-3xl">local_cafe</span>
              {t('hero.cta_contact')}
            </a>
          </div>
        </div>
      </section>

      {/* Section 2: Gobernanza y Legitimidad (Estilo Certificado Oficial) */}
      <section className="bg-[#050505] text-white py-16 md:py-24 relative overflow-hidden flex justify-center border-t border-white/5">
        {/* Subtle Map Background preserved for global feel */}
        <div className="absolute inset-0 opacity-[0.03] mix-blend-screen" style={{ backgroundImage: "url('/world_map.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
        
        <div className="max-w-screen-xl mx-auto px-6 relative z-10 w-full">
          {/* Tarjeta de Certificado / Documento Legal */}
          <div className="relative bg-black/60 backdrop-blur-md border-[1px] border-secondary-fixed/30 rounded-2xl p-10 md:p-16 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden group">
            
            {/* Guilloche / Sello de Agua */}
            <span className="absolute -right-20 -top-20 material-symbols-outlined text-[24rem] text-secondary-fixed/5 -rotate-12 pointer-events-none group-hover:scale-105 transition-transform duration-1000">
              verified
            </span>
            <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-secondary-fixed/80 via-[#107049]/80 to-secondary-fixed/80"></div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
              
              {/* Textos Legales */}
              <div className="md:col-span-8">
                <div className="flex items-center gap-3 mb-6">
                  <span className="material-symbols-outlined text-secondary-fixed text-lg">gavel</span>
                  <span className="uppercase tracking-[0.3em] font-bold text-xs text-secondary-fixed-dim">Marco Legal Ecuatoriano</span>
                </div>
                <h2 className="font-headline text-4xl md:text-5xl lg:text-6xl text-white font-bold mb-6 tracking-tight">
                  {t('legitimacy.title')}
                </h2>
                <p className="font-body text-lg text-white/80 max-w-xl leading-relaxed mb-10 font-light">
                  {t('legitimacy.desc')}
                </p>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-3 bg-black/40 px-5 py-3 border border-secondary-fixed/20 rounded-md">
                    <span className="material-symbols-outlined text-secondary-fixed text-lg">check_circle</span>
                    <span className="text-sm font-label uppercase tracking-widest text-surface-bright/90">Registro Magap</span>
                  </div>
                  <div className="flex items-center gap-3 bg-black/40 px-5 py-3 border border-emerald-500/40 rounded-md">
                     <span className="material-symbols-outlined text-emerald-400 text-lg">verified_user</span>
                    <span className="text-sm font-label uppercase tracking-widest text-emerald-400">Fitosanitario</span>
                  </div>
                  <div className="flex items-center gap-3 bg-black/40 px-5 py-3 border border-secondary-fixed/20 rounded-md">
                     <span className="material-symbols-outlined text-secondary-fixed text-lg">account_balance</span>
                    <span className="text-sm font-label uppercase tracking-widest text-white/90">Aduana BCE</span>
                  </div>
                </div>
              </div>

              {/* Sello Principal tipo Notarial a la derecha */}
              <div className="md:col-span-4 flex justify-center md:justify-end">
                <div className="relative w-48 h-48 rounded-full border-[1px] border-dashed border-secondary-fixed/60 flex items-center justify-center p-2">
                  <div className="w-full h-full rounded-full border-2 border-secondary-fixed flex flex-col items-center justify-center bg-gradient-to-br from-[#1a1100] to-emerald-900/30 shadow-[0_0_30px_rgba(253,195,77,0.1)] relative">
                    {/* SVG Rotating Text */}
                    <svg className="absolute inset-0 w-full h-full p-2 origin-center animate-[spin_20s_linear_infinite] opacity-60" viewBox="0 0 100 100">
                      <path id="circlePath" d="M 50, 50 m -36, 0 a 36,36 0 1,1 72,0 a 36,36 0 1,1 -72,0" fill="none" />
                      <text className="font-label tracking-[0.25em] uppercase" style={{ fontSize: '9px', fill: '#fdc34d' }}>
                        <textPath href="#circlePath" startOffset="0%">
                          • Certificado de Origen • Exportación Autorizada
                        </textPath>
                      </text>
                    </svg>
                    <span className="material-symbols-outlined text-5xl text-secondary-fixed mb-1 relative z-10">workspace_premium</span>
                    <span className="font-headline font-bold text-lg text-white leading-none mt-1 relative z-10">100%</span>
                    <span className="font-label text-[10px] uppercase tracking-[0.3em] text-secondary-fixed mt-1 relative z-10">Auditado</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Herencia y Legado Asimétrico (Rediseño Latitud Cero) */}
      <section id="heritage" className="bg-[#050505] relative overflow-hidden flex flex-col pt-24 pb-0 md:pt-32">
        {/* Encabezado */}
        <div className="max-w-screen-2xl mx-auto px-6 md:px-12 w-full mb-16 md:mb-24 text-center relative z-10">
          <span className="font-label text-secondary-fixed font-bold tracking-[0.3em] uppercase text-sm border-b border-secondary-fixed/30 pb-2 inline-block mb-6">
            El Terroir Perfecto
          </span>
          <h2 className="font-headline text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            Origen y <span className="text-secondary-fixed italic">Mística</span>
          </h2>
          <p className="font-body text-lg text-white/80 leading-relaxed font-light max-w-3xl mx-auto">
            Ubicados en la mitad del mundo, nuestra latitud 0° combina radiación solar perpendicular con climas andinos extremos, creando perfiles botánicos que no existen en ninguna otra parte del planeta.
          </p>
        </div>

        {/* El Contenedor Base de 2 Columnas (Pantalla Completa) */}
        <div className="flex flex-col lg:flex-row w-full lg:h-[800px] relative">
          
          {/* Eje Central "Latitud Cero" (Visible en Desktop) */}
          <div className="hidden lg:flex absolute left-1/2 top-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-secondary-fixed to-transparent -translate-x-1/2 z-20 shadow-[0_0_15px_#fdc34d]"></div>
          
          {/* Sello Flotante Latitud Cero */}
          <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 bg-black border border-secondary-fixed/50 rounded-full w-32 h-32 flex-col items-center justify-center shadow-[0_0_40px_rgba(253,195,77,0.3)]">
             <span className="font-label text-secondary-fixed tracking-[0.2em] text-[10px]">LATITUD</span>
             <span className="font-headline text-white font-bold text-3xl">0°0'0"</span>
          </div>

          {/* COLUMNA IZQUIERDA: CAFE ANDINO */}
          <div className="w-full lg:w-1/2 relative group overflow-hidden flex flex-col justify-end p-8 xl:p-20 lg:p-12 min-h-[600px] lg:min-h-full">
             {/* Imagen de fondo / Filtro oscuro-sepia */}
             <div className="absolute inset-0 bg-black z-0">
               <div className="absolute inset-0 bg-[url('/bg_coffee_legend.png')] bg-cover bg-center mix-blend-luminosity opacity-40 group-hover:scale-105 transition-transform duration-1000"></div>
               <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent"></div>
               {/* Acento rojizo/sepia volcánico - Tierra Token */}
               <div className="absolute inset-0 bg-amber-600/30 mix-blend-multiply"></div>
             </div>
             
             {/* Contenido Café */}
             <div className="relative z-10 w-full max-w-xl xl:pl-8">
               <div className="mb-6 inline-flex items-center gap-3">
                 <span className="w-8 h-px bg-white/50"></span>
                 <span className="font-label text-white/70 tracking-[0.3em] uppercase text-xs">Grano de Exportación</span>
               </div>
               <h3 className="font-headline text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
                 Café de<br/><span className="italic text-amber-500 font-light">Gran Altura</span>
               </h3>
               <p className="font-body text-lg text-white/80 leading-relaxed font-light mb-10">
                 Nutrido por tierras ricas en minerales a gran elevación, nuestro café andino madura de manera extraordinariamente lenta. Este microclima privilegiado moldea una acidez equilibrada y un aroma denso y sofisticado, altamente codiciado en el mercado global por satisfacer los más estrictos paladares premium.
               </p>
               
               {/* Ficha Técnica */}
               <ul className="grid grid-cols-2 gap-4 text-sm font-label uppercase tracking-wider text-white/60">
                 <li className="border-l border-amber-600/50 pl-4 py-1">
                   <span className="block text-white mb-1 font-bold">Entorno</span>
                   Suelos Minerales
                 </li>
                 <li className="border-l border-amber-600/50 pl-4 py-1">
                   <span className="block text-white mb-1 font-bold">Proceso</span>
                   Recolección Selectiva
                 </li>
                 <li className="border-l border-amber-600/50 pl-4 py-1 drop-shadow-md mt-4">
                   <span className="block text-white mb-1 font-bold">Maduración</span>
                   Lenta y Constante
                 </li>
                 <li className="border-l border-amber-600/50 pl-4 py-1 drop-shadow-md mt-4">
                   <span className="block text-white mb-1 font-bold">Perfil</span>
                   Balance y Complejidad
                 </li>
               </ul>
             </div>
          </div>

          {/* COLUMNA DERECHA: CACAO ARRIBA */}
          <div className="w-full lg:w-1/2 relative group overflow-hidden flex flex-col justify-end p-8 xl:p-20 lg:p-12 min-h-[600px] border-t lg:border-t-0 border-white/10 lg:border-l">
             {/* Imagen de fondo / Filtro esmeralda oscuro */}
             <div className="absolute inset-0 bg-black z-0">
               <div className="absolute inset-0 bg-[url('/bg_cacao_legend.png')] bg-cover bg-center mix-blend-luminosity opacity-40 group-hover:scale-105 transition-transform duration-1000"></div>
               <div className="absolute inset-0 bg-gradient-to-t from-[#010a05] via-[#021f0f]/90 to-transparent"></div>
               {/* Acento esmeralda profundo - Esmeralda Token */}
               <div className="absolute inset-0 bg-emerald-500/20 mix-blend-color"></div>
             </div>
             
             {/* Contenido Cacao */}
             <div className="relative z-10 w-full max-w-xl self-end lg:text-right xl:pr-8">
               <div className="mb-6 inline-flex items-center gap-3 lg:justify-end w-full">
                 <span className="hidden lg:inline-block font-label text-emerald-200/70 tracking-[0.3em] uppercase text-xs">Fruto de Origen</span>
                 <span className="hidden lg:inline-block w-8 h-px bg-emerald-200/50"></span>
                 
                 <span className="lg:hidden w-8 h-px bg-emerald-200/50"></span>
                 <span className="lg:hidden font-label text-emerald-200/70 tracking-[0.3em] uppercase text-xs">Fruto de Origen</span>
               </div>
               <h3 className="font-headline text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
                 Cacao Fino<br/><span className="text-emerald-400 italic font-light">de Aroma</span>
               </h3>
               <p className="font-body text-lg text-white/80 leading-relaxed font-light mb-10">
                 Un icono botánico venerado globalmente. Gracias a la rica biodiversidad tropical y la ubicación geográfica privilegiada, nuestro cacao posee características intrínsecas inigualables. Su perfil exótico, suavidad y notas fragantes son la base fundamental exigida por la más alta chocolatería europea y rusa.
               </p>
               
               {/* Ficha Técnica */}
               <ul className="grid grid-cols-2 gap-4 text-sm font-label uppercase tracking-wider text-emerald-100/60 lg:text-right">
                 <li className="border-l lg:border-l-0 lg:border-r border-emerald-500/50 pl-4 lg:pl-0 lg:pr-4 py-1">
                   <span className="block text-white mb-1 font-bold">Entorno</span>
                   Bosque Tropical
                 </li>
                 <li className="border-l lg:border-l-0 lg:border-r border-emerald-500/50 pl-4 lg:pl-0 lg:pr-4 py-1">
                   <span className="block text-white mb-1 font-bold">Clasificación</span>
                   Premium de Aromas
                 </li>
                 <li className="border-l lg:border-l-0 lg:border-r border-emerald-500/50 pl-4 lg:pl-0 lg:pr-4 py-1 mt-4">
                   <span className="block text-white mb-1 font-bold">Agricultura</span>
                   En Sombra Natural
                 </li>
                 <li className="border-l lg:border-l-0 lg:border-r border-emerald-500/50 pl-4 lg:pl-0 lg:pr-4 py-1 mt-4">
                   <span className="block text-white mb-1 font-bold">Artesanía</span>
                   Fermentación Precisa
                 </li>
               </ul>
             </div>
          </div>

        </div>
      </section>

      {/* Section 4: Atlas Botánico Interactivo */}
      <section id="products" className="py-12 md:py-20 w-full bg-[#050505] overflow-hidden border-y border-white/5">
        <div className="mb-10 lg:mb-16 text-center max-w-screen-2xl mx-auto px-6 md:px-12 relative z-20">
          <span className="font-label text-secondary-fixed font-bold tracking-[0.2em] uppercase text-sm">Nuestro Portafolio</span>
          <h2 className="font-headline text-4xl md:text-6xl font-bold text-white mt-4 mb-6">Origen del <span className="text-secondary-fixed italic">Producto</span></h2>

        </div>

        {/* Contenedor Full-Width Sin Bordes */}
        <div className="grid grid-cols-1 lg:grid-cols-12 w-full lg:min-h-[600px] bg-black/40 backdrop-blur-md relative z-10">
          
          {/* MAPA CARTOGRÁFICO REAL (Izquierda 1/3) */}
          <div className="lg:col-span-4 relative bg-black overflow-hidden flex flex-col items-center justify-center min-h-[500px]">
            {/* Mapa de Ecuador Cartográfico (Bono: Auras de Color Regionales) */}
            <div className="absolute inset-0 opacity-[0.85] mix-blend-screen pointer-events-none z-10" style={{ backgroundImage: "url('/ecuador_radar.png')", backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}></div>
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:3rem_3rem] z-0"></div>
            
            {/* Auras Cartográficas de Zonas (Costa, Sierra, Amazonía) */}
            <div className="absolute inset-0 z-0 opacity-70 mix-blend-screen pointer-events-none">
               {/* Litoral / Costa (Tierra) */}
               <div className="absolute top-[25%] left-[10%] w-[40%] h-[50%] bg-amber-600/20 blur-[60px] rounded-full transform -rotate-12"></div>
               {/* Andes / Sierra (Oro) */}
               <div className="absolute top-[10%] left-[35%] w-[30%] h-[80%] bg-secondary-fixed/20 blur-[50px] rounded-full"></div>
               {/* Oriente / Amazonía (Esmeralda) */}
               <div className="absolute top-[30%] right-[10%] w-[40%] h-[60%] bg-emerald-500/20 blur-[70px] rounded-full"></div>
            </div>

            {/* Etiquetas HUD B2B Regionales */}
            <div className="absolute top-[35%] left-[2%] flex items-center gap-2 z-10 pointer-events-none opacity-80 hidden lg:flex">
               <span className="w-6 h-[1px] bg-amber-600/70"></span>
               <span className="font-mono text-[9px] text-amber-500 uppercase tracking-[0.2em] bg-black/80 px-2 py-1 rounded border border-amber-600/30">Costa / Litoral</span>
            </div>
            
            <div className="absolute top-[15%] left-[45%] flex flex-col items-center gap-2 z-10 pointer-events-none opacity-90 hidden lg:flex">
               <span className="font-mono text-[9px] text-secondary-fixed uppercase tracking-[0.2em] bg-black/80 px-2 py-1 rounded border border-secondary-fixed/30 shadow-[0_0_10px_rgba(253,195,77,0.2)]">Sierra / Andes</span>
               <span className="w-[1px] h-6 bg-secondary-fixed/70"></span>
            </div>

            <div className="absolute bottom-[30%] right-[2%] flex items-center gap-2 z-10 pointer-events-none opacity-80 hidden lg:flex">
               <span className="font-mono text-[9px] text-emerald-400 uppercase tracking-[0.2em] bg-black/80 px-2 py-1 rounded border border-emerald-400/30">Amazonía / Oriente</span>
               <span className="w-6 h-[1px] bg-emerald-400/70"></span>
            </div>

            <div className="absolute top-8 left-8 text-[10px] text-white/30 uppercase tracking-widest font-mono z-10 hidden md:block">Tracker ECU // Lat_0</div>
            
            {/* Contenedor relativo exacto para mapear los puntos sobre la imagen central */}
            <div className="relative w-full max-w-[400px] aspect-square flex items-center justify-center scale-90 md:scale-100">
               
               {/* Puntos Mapeados */}
               {Object.keys(BOTANICAL_ATLAS).map((key) => {
                 const isActive = activeRegion === key;
                 return (
                   <button
                     key={key}
                     onClick={() => handleRegionChange(key)}
                     className="absolute w-12 h-12 -ml-6 -mt-6 rounded-full flex items-center justify-center group focus:outline-none z-20 transition-all hover:z-30 hover:scale-110"
                     style={{ top: BOTANICAL_ATLAS[key].coords.top, left: BOTANICAL_ATLAS[key].coords.left }}
                     aria-label={`Seleccionar ${BOTANICAL_ATLAS[key].name}`}
                   >
                     {/* Círculo Interactivo */}
                     <div className={`relative w-4 h-4 rounded-full flex items-center justify-center transition-all duration-300 ${isActive ? 'bg-secondary-fixed shadow-[0_0_25px_rgba(253,195,77,1)]' : 'bg-emerald-500/80 group-hover:bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.8)]'}`}>
                        {isActive && <div className="absolute w-12 h-12 rounded-full border border-secondary-fixed animate-ping opacity-70"></div>}
                        {!isActive && <div className="absolute w-8 h-8 rounded-full border border-emerald-500/50 group-hover:border-emerald-400 scale-0 group-hover:scale-100 transition-transform duration-300"></div>}
                     </div>
                     {/* Etiqueta Flotante */}
                     <span className={`absolute left-8 whitespace-nowrap px-3 py-1.5 bg-black/90 backdrop-blur-md border border-white/20 text-[10px] uppercase font-mono tracking-widest rounded shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none ${isActive ? 'text-secondary-fixed opacity-100 translate-x-1 border-secondary-fixed/50' : 'text-white'}`}>
                       {key.toUpperCase()}
                     </span>
                   </button>
                 );
               })}
            </div>
          </div>

          {/* TERMINAL DE TELEMETRÍA DINÁMICA (Derecha 2/3) */}
          <div className="lg:col-span-8 flex flex-col items-start justify-center p-6 md:p-8 lg:px-16 lg:py-12 relative bg-gradient-to-l from-[#050505] to-[#0a0a0a] min-h-[500px] border-l border-white/5">
             
             <div className="mb-10 w-full transition-opacity duration-300 flex-shrink-0" style={{ animation: 'none' }}>
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 border-b border-white/10 pb-8">
                  <div>
                    <h3 className="font-headline text-3xl md:text-4xl lg:text-5xl text-white font-bold leading-tight">{BOTANICAL_ATLAS[activeRegion].province}</h3>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl px-5 py-3 self-start flex items-center gap-3 backdrop-blur-sm shadow-xl mt-2 xl:mt-0">
                    <span className="material-symbols-outlined text-secondary-fixed text-xl">location_on</span>
                    <span className="font-label text-sm uppercase tracking-wider text-white">{BOTANICAL_ATLAS[activeRegion].name}</span>
                  </div>
                </div>
             </div>

             {/* Selector Explicito de Variedades (Elimina la ambigüedad de los botones Anterior/Siguiente) */}
             {BOTANICAL_ATLAS[activeRegion].products.length > 1 && (
               <div className="flex flex-col gap-3 mb-6 w-full">
                 <div className="w-full flex items-center justify-between pl-2">
                   <span className="font-mono text-[10px] text-white/40 uppercase tracking-widest">Múltiples Cepas Disponibles</span>
                   <span className="font-mono text-[10px] text-secondary-fixed uppercase tracking-widest font-bold bg-secondary-fixed/10 px-2 py-1 rounded">Variedad {productIndex + 1} de {BOTANICAL_ATLAS[activeRegion].products.length}</span>
                 </div>
                 <div className="flex flex-wrap gap-2">
                   {BOTANICAL_ATLAS[activeRegion].products.map((p, idx) => (
                     <button 
                       key={idx}
                       onClick={() => setProductIndex(idx)}
                       className={`px-4 py-2 rounded-full font-mono text-xs font-bold transition-all border ${idx === productIndex ? 'bg-secondary-fixed text-black border-secondary-fixed shadow-[0_0_15px_rgba(253,195,77,0.3)]' : 'bg-transparent text-white/40 border-white/10 hover:border-white/30 hover:text-white'}`}>
                        {p.variedad}
                     </button>
                   ))}
                 </div>
               </div>
             )}

             {/* Contenedor Mega-Carrusel (Muestra 1 sola variedad) */}
             <div className="w-full relative mt-2">
               {(() => {
                 const currentProduct = BOTANICAL_ATLAS[activeRegion].products[productIndex];
                 return (
                   <div className="bg-black/40 border border-white/5 rounded-2xl p-8 md:p-10 shadow-2xl relative overflow-hidden group">
                      {/* Efectos Glow Superiores */}
                      <div className="absolute left-0 top-0 w-1.5 h-full bg-secondary-fixed shadow-[0_0_15px_rgba(253,195,77,0.5)]"></div>
                      <div className="absolute inset-0 bg-emerald-500/5 opacity-100 pointer-events-none"></div>
                      
                      <div className="flex flex-col sm:flex-row justify-between mb-8 relative z-10 gap-4 border-b border-white/5 pb-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                             <span className="material-symbols-outlined text-xl">psychiatry</span>
                          </div>
                          <h4 className="font-bold text-white text-2xl md:text-3xl">{currentProduct.variedad}</h4>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10 mb-8">
                         <div className="space-y-3">
                           <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-emerald-400"><span className="w-1 h-1 bg-emerald-400 rounded-full"></span> Origen Genético</span>
                           <p className="font-light text-white/90 text-base md:text-lg leading-relaxed tracking-wide">{currentProduct.genetica}</p>
                         </div>
                         <div className="space-y-3">
                           <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-white/40"><span className="w-1 h-1 bg-white/40 rounded-full"></span> Notas de Cultivo</span>
                           <p className="font-light text-white/60 text-base md:text-lg leading-relaxed tracking-wide">{currentProduct.cultivo}</p>
                         </div>
                      </div>

                      <div className="bg-white/10 border border-white/10 rounded-xl p-6 relative z-10 backdrop-blur-sm">
                         <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-secondary-fixed mb-3"><span className="w-1.5 h-1.5 bg-secondary-fixed rounded-full shadow-[0_0_10px_rgba(253,195,77,0.8)] animate-pulse"></span> Perfil Sensorial Principal</span>
                         <p className="font-light text-white/90 text-lg md:text-2xl italic max-w-2xl leading-relaxed">"{currentProduct.sensorial}"</p>
                      </div>

                   </div>
                 );
               })()}
             </div>
          </div>
        </div>

        {/* Botón Central Descargar Catálogo Global */}
        <div className="w-full flex justify-center mt-16 md:mt-24 pb-8 relative z-20">
           <button className="flex items-center gap-4 bg-transparent border-2 border-secondary-fixed text-secondary-fixed px-12 py-5 rounded-full font-label font-bold uppercase tracking-[0.2em] hover:bg-secondary-fixed hover:text-black transition-all shadow-[0_0_20px_rgba(253,195,77,0.15)] hover:shadow-[0_0_30px_rgba(253,195,77,0.4)] group focus:outline-none">
             <span className="material-symbols-outlined group-hover:animate-bounce">download</span>
             Descargar Catálogo Botánico
           </button>
        </div>
      </section>

      {/* Section 5: Logística Ecuador Express */}
      <section className="py-24 md:py-32 bg-[#050505] text-white relative overflow-hidden border-t border-white/5">
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-[0.03] pointer-events-none">
          <span className="material-symbols-outlined text-[40rem] text-primary-fixed/20">public</span>
        </div>
        <div className="absolute inset-0 blueprint-pattern opacity-[0.05]"></div>
        <div className="max-w-screen-xl mx-auto px-12 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
            <div>
              <span className="font-label text-secondary-fixed font-bold tracking-[0.2em] uppercase text-sm">{t('logistics.label')}</span>
              <h2 className="font-headline text-4xl md:text-5xl lg:text-6xl font-bold text-white mt-4 mb-6">{t('logistics.title')}</h2>
              <p className="font-body text-lg text-white/80 leading-relaxed font-light mb-10">
                {t('logistics.desc')}
              </p>
              <div className="space-y-6">
                <div className="flex items-start gap-4 p-4 border-l-2 border-emerald-500 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 flex-shrink-0">
                    <span className="material-symbols-outlined">sailing</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-white">{t('logistics.feature1_title')}</h4>
                    <p className="text-white/60 text-sm">{t('logistics.feature1_desc')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 border-l-2 border-emerald-500 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 flex-shrink-0">
                    <span className="material-symbols-outlined">ac_unit</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-white">{t('logistics.feature2_title')}</h4>
                    <p className="text-white/60 text-sm">{t('logistics.feature2_desc')}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="glass-card p-2 border-0 rounded-2xl overflow-hidden shadow-2xl relative">
              <div className="bg-on-secondary-fixed h-96 rounded-xl relative overflow-hidden">
                <img className="w-full h-full object-cover opacity-80 mix-blend-luminosity" src="/world_map.jpg" alt="Map"/>
                <div className="absolute inset-0 technical-overlay opacity-30"></div>
                <div className="absolute top-1/2 left-1/4 w-3 h-3 bg-secondary-container rounded-full animate-ping"></div>
                <div className="absolute top-1/4 right-1/4 w-3 h-3 bg-secondary-container rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 6: EUDR Trazabilidad */}
      <section id="sustainability" className="py-32 px-12 max-w-screen-xl mx-auto relative">
        <div className="absolute top-0 left-0 w-32 h-32 opacity-[0.05]">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <path d="M0 0 L100 100 M0 100 L100 0" stroke="currentColor" strokeWidth="0.5"></path>
          </svg>
        </div>
        <div className="flex flex-col items-center text-center mb-16">
          <h2 className="font-headline text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-2">{t('eudr.title')}</h2>
          <p className="font-headline text-2xl italic text-emerald-400 mb-6">{t('eudr.subtitle')}</p>
          <div className="font-body text-lg text-white/80 leading-relaxed font-light max-w-2xl text-center mx-auto">
            {t('eudr.desc')}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
          <div className="bg-black/40 p-10 rounded-xl hover:bg-black/60 transition-colors border-t-2 border-white/5 hover:border-emerald-500 shadow-xl">
            <span className="material-symbols-outlined text-emerald-400 text-4xl mb-6">location_on</span>
            <h4 className="font-bold text-white text-xl mb-4">{t('eudr.card1_title')}</h4>
            <p className="text-sm text-white/60 leading-relaxed">{t('eudr.card1_desc')}</p>
          </div>
          <div className="bg-black/40 p-10 rounded-xl hover:bg-black/60 transition-colors border-t-2 border-white/5 hover:border-emerald-500 shadow-xl">
            <span className="material-symbols-outlined text-emerald-400 text-4xl mb-6">history_edu</span>
            <h4 className="font-bold text-white text-xl mb-4">{t('eudr.card2_title')}</h4>
            <p className="text-sm text-white/60 leading-relaxed">{t('eudr.card2_desc')}</p>
          </div>
          <div className="bg-black/40 p-10 rounded-xl hover:bg-black/60 transition-colors border-t-2 border-white/5 hover:border-emerald-500 shadow-xl">
            <span className="material-symbols-outlined text-emerald-400 text-4xl mb-6">nature_people</span>
            <h4 className="font-bold text-white text-xl mb-4">{t('eudr.card3_title')}</h4>
            <p className="text-sm text-white/60 leading-relaxed">{t('eudr.card3_desc')}</p>
          </div>
        </div>
      </section>

      {/* Section 7: Modelo Transparente */}
      <section className="py-32 bg-on-secondary-fixed/30 blueprint-pattern">
        <div className="max-w-screen-xl mx-auto px-12">
          <div className="flex flex-col md:flex-row gap-20">
            <div className="md:w-1/3">
              <h2 className="font-headline text-4xl font-bold text-secondary-fixed-dim sticky top-32">{t('model.title')}</h2>
              <div className="mt-8 flex items-center gap-4 text-secondary-fixed-dim font-label font-bold bg-[#1a1100] border border-primary-container p-6 rounded shadow-sm">
                <span className="text-5xl">04</span>
                <span className="uppercase tracking-widest text-xs whitespace-pre-line">{t('model.label').replace(' ', '\n')}</span>
              </div>
            </div>
            <div className="md:w-2/3 space-y-24">
              <div className="relative pl-12 border-l border-outline-variant/30">
                <div className="absolute -left-3 top-0 w-6 h-6 rounded-full bg-secondary-fixed flex items-center justify-center text-[10px] text-on-secondary-fixed font-bold">1</div>
                <h3 className="font-headline text-2xl font-bold mb-4 text-surface-bright">{t('model.step1_title')}</h3>
                <p className="text-lg opacity-70">{t('model.step1_desc')}</p>
              </div>
              <div className="relative pl-12 border-l border-outline-variant/30">
                <div className="absolute -left-3 top-0 w-6 h-6 rounded-full bg-secondary-fixed flex items-center justify-center text-[10px] text-on-secondary-fixed font-bold">2</div>
                <h3 className="font-headline text-2xl font-bold mb-4 text-surface-bright">{t('model.step2_title')}</h3>
                <p className="text-lg opacity-70">{t('model.step2_desc')}</p>
              </div>
              <div className="relative pl-12 border-l border-outline-variant/30">
                <div className="absolute -left-3 top-0 w-6 h-6 rounded-full bg-secondary-fixed flex items-center justify-center text-[10px] text-on-secondary-fixed font-bold">3</div>
                <h3 className="font-headline text-2xl font-bold mb-4 text-surface-bright">{t('model.step3_title')}</h3>
                <p className="text-lg opacity-70">{t('model.step3_desc')}</p>
              </div>
              <div className="relative pl-12 border-l border-outline-variant/30">
                <div className="absolute -left-3 top-0 w-6 h-6 rounded-full bg-secondary-fixed flex items-center justify-center text-[10px] text-on-secondary-fixed font-bold">4</div>
                <h3 className="font-headline text-2xl font-bold mb-4 text-surface-bright">{t('model.step4_title')}</h3>
                <p className="text-lg opacity-70">{t('model.step4_desc')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 8: Beneficios CTAs */}
      <section className="py-24 bg-gradient-to-br from-[#1a1100] to-on-secondary-fixed text-surface-bright relative border-y border-secondary-fixed/10">
        <div className="absolute inset-0 technical-overlay opacity-20 pointer-events-none"></div>
        <div className="max-w-screen-xl mx-auto px-12 text-center relative z-10">
          <h2 className="font-headline text-4xl md:text-5xl font-bold mb-12 text-secondary-fixed-dim">{t('benefits.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="border border-secondary-fixed/20 p-12 rounded-xl backdrop-blur-sm group hover:border-primary-container hover:bg-black/20 transition-colors">
              <span className="material-symbols-outlined text-secondary-container text-5xl mb-6 group-hover:scale-110 transition-transform">handshake</span>
              <h4 className="font-headline text-2xl font-bold mb-4">{t('benefits.card1_title')}</h4>
              <p className="opacity-80">{t('benefits.card1_desc')}</p>
            </div>
            <div className="border border-secondary-fixed/20 p-12 rounded-xl backdrop-blur-sm group hover:border-primary-container hover:bg-black/20 transition-colors">
              <span className="material-symbols-outlined text-secondary-container text-5xl mb-6 group-hover:scale-110 transition-transform">trending_up</span>
              <h4 className="font-headline text-2xl font-bold mb-4">{t('benefits.card2_title')}</h4>
              <p className="opacity-80">{t('benefits.card2_desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 9: Resumen de Contacto Amigable y Atractivo */}
      <section id="contact" className="py-24 md:py-32 bg-[#0a0a0a] relative overflow-hidden">
        {/* Fondo visual Atractivo - Gradientes suaves */}
        <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-secondary-fixed/5 rounded-full blur-[150px] pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-screen-xl mx-auto px-6 md:px-12 relative z-10 w-full">
          
          <div className="text-center md:mb-20 mb-12">
             <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-secondary-fixed/30 bg-secondary-fixed/10 font-label text-xs tracking-widest text-secondary-fixed uppercase mb-4">
                Comencemos
             </span>
             <h2 className="font-headline text-5xl md:text-6xl font-bold text-white mb-6">Contáctanos</h2>
             <p className="font-body text-xl text-white/60 font-light max-w-2xl mx-auto">
               Descubre cómo nuestros productos botánicos ecuatorianos pueden elevar tu portafolio internacional. Estamos listos para conversar.
             </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-10 gap-12 lg:gap-20 items-start">
            
            {/* IZQUIERDA: Canales Limpios */}
            <div className="lg:col-span-4 flex flex-col gap-6">
               
               <div className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:bg-white/10 hover:border-secondary-fixed/30 transition-all group">
                 <div className="w-14 h-14 rounded-full bg-secondary-fixed/20 flex items-center justify-center mb-6 text-secondary-fixed group-hover:scale-110 transition-transform">
                   <span className="material-symbols-outlined text-2xl">mail</span>
                 </div>
                 <h4 className="font-bold text-white text-xl mb-2">Envíanos un Correo</h4>
                 <p className="text-white/60 mb-4 font-light leading-relaxed">Para solicitudes de proformas exclusivas y detalles del catálogo de exportación.</p>
                 <a href="mailto:export@terralatitude.com" className="text-secondary-fixed font-bold hover:underline">export@terralatitude.com</a>
               </div>

               <div className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:bg-white/10 hover:border-[#25D366]/30 transition-all group">
                 <div className="w-14 h-14 rounded-full bg-[#25D366]/20 flex items-center justify-center mb-6 text-[#25D366] group-hover:scale-110 transition-transform">
                   <span className="material-symbols-outlined text-2xl animate-pulse">sms</span>
                 </div>
                 <h4 className="font-bold text-white text-xl mb-2">Atención Directa</h4>
                 <p className="text-white/60 mb-6 font-light leading-relaxed">Conéctate vía WhatsApp para respuestas ejecutivas inmediatas.</p>
                 <a href="#wa" className="inline-flex items-center gap-2 bg-[#25D366] text-white px-8 py-4 rounded-full font-bold hover:shadow-[0_0_20px_rgba(37,211,102,0.4)] transition-all">
                   Iniciar Conversación
                   <span className="material-symbols-outlined text-lg">open_in_new</span>
                 </a>
               </div>
            </div>

            {/* DERECHA: Formulario Glassmorphism Fluidos */}
            <div className="lg:col-span-6 bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-xl">
               <h3 className="font-headline text-3xl font-bold text-white mb-8">Envíanos un Mensaje</h3>
               <form className="space-y-6">
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="relative group">
                     <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-secondary-fixed transition-colors pointer-events-none">person</span>
                     <input type="text" placeholder="Tu Nombre Completo" className="w-full bg-black/30 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-secondary-fixed focus:bg-black/50 transition-all placeholder-white/40" />
                   </div>
                   <div className="relative group">
                     <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-secondary-fixed transition-colors pointer-events-none">business</span>
                     <input type="text" placeholder="Nombre de tu Empresa" className="w-full bg-black/30 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-secondary-fixed focus:bg-black/50 transition-all placeholder-white/40" />
                   </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="relative group">
                     <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-secondary-fixed transition-colors pointer-events-none">alternate_email</span>
                     <input type="email" placeholder="Correo Electrónico" className="w-full bg-black/30 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-secondary-fixed focus:bg-black/50 transition-all placeholder-white/40" />
                   </div>
                   <div className="relative group">
                     <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-secondary-fixed transition-colors pointer-events-none">inbox</span>
                     <select className="w-full bg-black/30 border border-white/10 rounded-xl py-4 pl-12 pr-10 text-white/70 focus:outline-none focus:border-secondary-fixed focus:bg-black/50 transition-all appearance-none cursor-pointer hover:text-white" defaultValue="">
                        <option value="" disabled className="text-black bg-white">Selecciona un Interés</option>
                        <option value="cacao" className="text-black bg-white">Cacao Fino de Aroma</option>
                        <option value="cafe" className="text-black bg-white">Café de Gran Altura</option>
                        <option value="ambos" className="text-black bg-white">Ambos / Portafolio Completo</option>
                     </select>
                     <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none">expand_more</span>
                   </div>
                 </div>

                 <div className="relative group">
                   <span className="material-symbols-outlined absolute left-4 top-5 text-white/30 group-focus-within:text-secondary-fixed transition-colors pointer-events-none">chat_bubble</span>
                   <textarea rows="4" placeholder="¿Cómo podemos ayudarte? Compártenos los detalles de tu consulta..." className="w-full bg-black/30 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-secondary-fixed focus:bg-black/50 transition-all placeholder-white/40 resize-none"></textarea>
                 </div>

                 <button className="w-full bg-secondary-fixed text-on-secondary-fixed py-4 rounded-xl font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(253,195,77,0.2)] hover:bg-white hover:shadow-[0_0_35px_rgba(253,195,77,0.5)] transition-all flex justify-center items-center gap-3">
                   Enviar Solicitud
                   <span className="material-symbols-outlined text-xl">send</span>
                 </button>
                 
               </form>
            </div>

          </div>
        </div>
      </section>
    </main>
  );
};

export default Landing;
