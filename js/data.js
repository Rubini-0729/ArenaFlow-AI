/* Static Data & State Definitions */

const STADIUM_NAME = "MetLife Arena (New York/New Jersey)";

const GATES_DATA = {
  "Gate A": { name: "Gate A (East)", status: "Busy", scanRate: 42, crowdLevel: 85, access: "Standard & Wheelchair", coordinate: { x: 420, y: 250 } },
  "Gate B": { name: "Gate B (North)", status: "Optimal", scanRate: 15, crowdLevel: 30, access: "Standard & Wheelchair", coordinate: { x: 250, y: 80 } },
  "Gate C": { name: "Gate C (West)", status: "Busy", scanRate: 35, crowdLevel: 75, access: "Standard Only", coordinate: { x: 80, y: 250 } },
  "Gate D": { name: "Gate D (South)", status: "Optimal", scanRate: 10, crowdLevel: 25, access: "Standard, Wheelchair & Sensory", coordinate: { x: 250, y: 420 } }
};

const CONCESSIONS_DATA = [
  { id: "c1", name: "Star Spangled Grill", section: 105, type: "Burgers & Fries", waitTime: 12, vegan: false, coordinates: { x: 380, y: 180 } },
  { id: "c2", name: "Verde Taqueria", section: 118, type: "Tacos & Bowls", waitTime: 6, vegan: true, coordinates: { x: 150, y: 320 } },
  { id: "c3", name: "Green Field Salads", section: 130, type: "Salads & Smoothies", waitTime: 3, vegan: true, coordinates: { x: 220, y: 150 } },
  { id: "c4", name: "Halal Cart Express", section: 142, type: "Gyro & Rice", waitTime: 18, vegan: true, coordinates: { x: 320, y: 320 } }
];

const RESTROOMS_DATA = [
  { id: "r1", section: 102, type: "Men & Women", waitTime: 8, accessible: true, family: false, coordinates: { x: 330, y: 130 } },
  { id: "r2", section: 115, type: "All-Gender & Family", waitTime: 3, accessible: true, family: true, coordinates: { x: 130, y: 220 } },
  { id: "r3", section: 128, type: "Men & Women", waitTime: 11, accessible: true, family: false, coordinates: { x: 180, y: 360 } },
  { id: "r4", section: 139, type: "All-Gender", waitTime: 2, accessible: true, family: true, coordinates: { x: 350, y: 280 } }
];

const TRANSPORT_DATA = {
  shuttles: [
    { id: "s1", route: "Red Line (Express to Train Station)", status: "Active", frequency: "5 mins", waitTime: 4 },
    { id: "s2", route: "Blue Line (Park & Ride Lots)", status: "Delayed", frequency: "12 mins", waitTime: 15 },
    { id: "s3", route: "Green Line (Rideshare Hub)", status: "Active", frequency: "8 mins", waitTime: 6 }
  ],
  parking: {
    "Lot A (VIP/Press)": { capacity: 95, spacesLeft: 20 },
    "Lot B (General)": { capacity: 78, spacesLeft: 350 },
    "Lot C (General)": { capacity: 88, spacesLeft: 120 }
  },
  rideshare: {
    status: "Busy",
    pickupZone: "Zone B (West Lot)",
    avgWaitTime: "22 mins"
  }
};

const SUSTAINABILITY_TELEMETRY = {
  solarGeneration: 345, // kW
  waterSaved: 14520, // Gallons today
  wasteDiverted: 82.4, // % diverted from landfill
  energySaved: 1240, // kWh saved
  carbonFootprintOffset: 412 // kg CO2 offset
};

// Preset incidents for operations scenario triggering
const PRESET_INCIDENTS = {
  "bottleneck_gate_a": {
    id: "INC-101",
    title: "Crowd Bottleneck at Gate A",
    type: "Crowd Management",
    severity: "High",
    location: "Gate A (East Entrance)",
    details: "Wait time has exceeded 35 minutes due to ticket scanner network drop. High crowd accumulation in the outer Plaza.",
    impact: { gate: "Gate A", crowdLevel: 95, status: "Critical" }
  },
  "elevator_outage": {
    id: "INC-102",
    title: "Elevator Outage - North Stand",
    type: "Accessibility",
    severity: "Medium",
    location: "Section 202 Lift Hub",
    details: "Elevator #3 reporting mechanical malfunction. Elevator #4 is functional but experiencing high load. Wheelchair users stranded on Level 2.",
    impact: { section: 202, accessibilityRoute: "Blocked" }
  },
  "severe_weather": {
    id: "INC-103",
    title: "Severe Weather Warning",
    type: "Safety",
    severity: "High",
    location: "Entire Arena & Open Plazas",
    details: "Lightning alert active. Storm front arriving in 15 minutes. Heavy rainfall and strong winds expected for the next 45 minutes.",
    impact: { outdoorPlazas: "Evacuate", canopyStatus: "Closed" }
  },
  "shuttle_delay": {
    id: "INC-104",
    title: "Major Traffic Delay: Rideshare Hub Shuttle",
    type: "Transportation",
    severity: "Medium",
    location: "External Ring Road & Lot C Entrance",
    details: "Accident on Route 120 has blocked the primary shuttle lane. Shuttle frequency increased from 8 to 25 minutes. Crowds building up at Transit Hub.",
    impact: { rideshareWait: "45 mins", shuttleStatus: "Delayed" }
  }
};

// Multilingual translations database for fan portal and operations broadcasts
const MULTILINGUAL_DATABASE = {
  en: {
    welcome: "Welcome to MetLife Arena! I am your AI Tournament Assistant. How can I help you today?",
    nav_to_seat: "To find your seat in Section {section}, enter via Gate {gate} and take the nearest escalator to Level {level}.",
    food_vegan: "Here are the vegan-friendly concession stands near Section {section}: Verde Taqueria (Section 118) and Green Field Salads (Section 130).",
    transit_info: "Shuttles to the Main Train Station leave every 5 minutes. The Rideshare Pickup is located in Zone B (West Lot) with a 22-minute wait time.",
    restroom_closest: "The closest accessible restroom is at Section {section}. It supports all-gender and family amenities.",
    sustainability: "MetLife Arena uses 100% renewable energy. Please help by depositing recyclables in the blue bins located at every corridor.",
    accessibility_guide: "Wheelchair assistance and sensory room access are available at Gate D. Elevator hubs are active near Sections 105, 122, and 202.",
    broadcast_template: "ATTENTION ALL FANS: [Msg]"
  },
  es: {
    welcome: "¡Bienvenido a MetLife Arena! Soy su Asistente de Torneo con IA. ¿Cómo puedo ayudarle hoy?",
    nav_to_seat: "Para encontrar su asiento en la Sección {section}, ingrese por la Puerta {gate} y tome la escalera mecánica más cercana al Nivel {level}.",
    food_vegan: "Puestos de comida aptos para veganos cerca de la Sección {section}: Verde Taqueria (Sección 118) y Green Field Salads (Sección 130).",
    transit_info: "Los autobuses a la estación principal de trenes salen cada 5 minutos. La zona de recogida de viajes compartidos está en la Zona B (Lote Oeste).",
    restroom_closest: "El baño accesible más cercano está en la Sección {section}, con instalaciones para todos los géneros y familias.",
    sustainability: "MetLife Arena utiliza energía 100% renovable. Ayude depositando los materiales reciclables en los contenedores azules.",
    accessibility_guide: "Asistencia para sillas de ruedas y salas sensoriales en la Puerta D. Los ascensores están cerca de las Secciones 105, 122 y 202.",
    broadcast_template: "ATENCIÓN A TODOS LOS AFICIONADOS: [Msg]"
  },
  fr: {
    welcome: "Bienvenue à la MetLife Arena ! Je suis votre assistant de tournoi IA. Comment puis-je vous aider aujourd'hui ?",
    nav_to_seat: "Pour trouver votre siège en Section {section}, entrez par la Porte {gate} et prenez l'escalator le plus proche vers le Niveau {level}.",
    food_vegan: "Points de restauration végétaliens près de la Section {section} : Verde Taqueria (Section 118) et Green Field Salads (Section 130).",
    transit_info: "Les navettes pour la gare principale partent toutes les 5 minutes. Le dépôt Rideshare est en Zone B (Parking Ouest).",
    restroom_closest: "Les toilettes accessibles les plus proches sont à la Section {section}, avec espaces tous genres et familles.",
    sustainability: "La MetLife Arena utilise 100% d'énergie renouvelable. Veuillez jeter les recyclables dans les bacs bleus.",
    accessibility_guide: "Assistance fauteuil roulant et salles sensorielles à la Porte D. Ascenseurs actifs près des Sections 105, 122 et 202.",
    broadcast_template: "ATTENTION À TOUS LES SUPPORTERS : [Msg]"
  },
  pt: {
    welcome: "Bem-vindo à MetLife Arena! Sou o seu Assistente de IA do Torneio. Como posso ajudar você hoje?",
    nav_to_seat: "Para encontrar seu assento na Seção {section}, entre pelo Portão {gate} e pegue a escada rolante mais próxima para o Nível {level}.",
    food_vegan: "Opções veganas perto da Seção {section}: Verde Taqueria (Seção 118) e Green Field Salads (Seção 130).",
    transit_info: "Os ônibus de traslado para a Estação de Trem saem a cada 5 minutos. O embarque de carros está na Zona B (Estacionamento Oeste).",
    restroom_closest: "O banheiro acessível mais próximo fica na Seção {section}, com suporte para todos os gêneros e famílias.",
    sustainability: "A MetLife Arena usa energia 100% renovável. Por favor, descarte materiais recicláveis nas lixeiras azuis.",
    accessibility_guide: "Assistência para cadeiras de rodas e salas sensoriais no Portão D. Elevadores ativos nas Seções 105, 122 e 202.",
    broadcast_template: "ATENÇÃO A TODOS OS TORCEDORES: [Msg]"
  },
  ar: {
    welcome: "مرحباً بكم في ميتلايف أرينا! أنا مساعد البطولة الذكي الخاص بكم. كيف يمكنني مساعدتكم اليوم؟",
    nav_to_seat: "للعثور على مقعدك في القسم {section}، ادخل عبر البوابة {gate} واستقل أقرب سلم كهربائي إلى المستوى {level}.",
    food_vegan: "خيارات الطعام النباتي القريبة من القسم {section}: فيردي تاكيريا (القسم 118) وسلطات غرين فيلد (القسم 130).",
    transit_info: "تنطلق الحافلات المكوكية إلى محطة القطار الرئيسية كل 5 دقائق. منطقة النقل التشاركي تقع في المنطقة B (الموقف الغربي).",
    restroom_closest: "أقرب دورة مياه مجهزة لذوي الاحتياجات الخاصة تقع في القسم {section}، وتدعم خيارات العائلات ولكلا الجنسين.",
    sustainability: "تستخدم ميتلايف أرينا طاقة متجددة بنسبة 100%. يرجى المساعدة بوضع المواد القابلة لإعادة التدوير في الصناديق الزرقاء.",
    accessibility_guide: "تتوفر مساعدة الكراسي المتحركة وغرفة التهدئة الحسية عند البوابة D. تتوفر المصاعد بالقرب من الأقسام 105 و122 و202.",
    broadcast_template: "تنبيه لجميع المشجعين: [Msg]"
  }
};

// Export definitions for browser loading or module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    STADIUM_NAME,
    GATES_DATA,
    CONCESSIONS_DATA,
    RESTROOMS_DATA,
    TRANSPORT_DATA,
    SUSTAINABILITY_TELEMETRY,
    PRESET_INCIDENTS,
    MULTILINGUAL_DATABASE
  };
}
