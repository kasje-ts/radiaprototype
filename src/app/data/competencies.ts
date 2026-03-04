export type Role = 'junior' | 'medior' | 'senior';

export const roleLabels: Record<Role, string> = {
  junior: 'Junior Product Owner',
  medior: 'Medior Product Owner',
  senior: 'Senior Product Owner',
};

export type CategoryId = 'product_execution' | 'customer_insight' | 'product_strategy' | 'influencing_people';
export type CompetencyId =
  | 'product_delivery' | 'analytisch_vermogen' | 'procesbeheer'
  | 'klantempathie' | 'marktonderzoek' | 'ownership_executie'
  | 'strategisch_denken' | 'bedrijfsstrategie' | 'roadmapping'
  | 'communicatie' | 'stakeholdermanagement' | 'leiderschap';

export interface Category {
  id: CategoryId;
  name: string;
  color: string;
  competencies: CompetencyId[];
}

export interface Competency {
  id: CompetencyId;
  name: string;
  categoryId: CategoryId;
}

export const categories: Category[] = [
  {
    id: 'product_execution',
    name: 'Product Execution',
    color: '#6366f1',
    competencies: ['product_delivery', 'analytisch_vermogen', 'procesbeheer'],
  },
  {
    id: 'customer_insight',
    name: 'Customer Insight',
    color: '#ec4899',
    competencies: ['klantempathie', 'marktonderzoek', 'ownership_executie'],
  },
  {
    id: 'product_strategy',
    name: 'Product Strategy',
    color: '#f59e0b',
    competencies: ['strategisch_denken', 'bedrijfsstrategie', 'roadmapping'],
  },
  {
    id: 'influencing_people',
    name: 'Influencing People',
    color: '#10b981',
    competencies: ['communicatie', 'stakeholdermanagement', 'leiderschap'],
  },
];

export const competencies: Competency[] = [
  { id: 'product_delivery', name: 'Product Delivery', categoryId: 'product_execution' },
  { id: 'analytisch_vermogen', name: 'Analytisch vermogen', categoryId: 'product_execution' },
  { id: 'procesbeheer', name: 'Procesbeheer', categoryId: 'product_execution' },
  { id: 'klantempathie', name: 'Klantempathie', categoryId: 'customer_insight' },
  { id: 'marktonderzoek', name: 'Marktonderzoek', categoryId: 'customer_insight' },
  { id: 'ownership_executie', name: 'Ownership & Executie', categoryId: 'customer_insight' },
  { id: 'strategisch_denken', name: 'Strategisch denken', categoryId: 'product_strategy' },
  { id: 'bedrijfsstrategie', name: 'Bedrijfsstrategie', categoryId: 'product_strategy' },
  { id: 'roadmapping', name: 'Roadmapping', categoryId: 'product_strategy' },
  { id: 'communicatie', name: 'Communicatie', categoryId: 'influencing_people' },
  { id: 'stakeholdermanagement', name: 'Stakeholdermanagement', categoryId: 'influencing_people' },
  { id: 'leiderschap', name: 'Leiderschap', categoryId: 'influencing_people' },
];

export const expectations: Record<Role, Record<CompetencyId, string>> = {
  junior: {
    product_delivery: 'Je begrijpt de basis van productontwikkeling en kunt onder begeleiding klantproblemen analyseren en vertalen naar backlog items. Je ondersteunt bij experimenten en werkt samen met design en development om oplossingen te realiseren. Feedback gebruik je om iteraties te verbeteren.',
    analytisch_vermogen: 'Je begrijpt basisgegevens en kunt onder begeleiding informatie verzamelen en interpreteren. Je herkent patronen in data en ondersteunt bij het opstellen van eenvoudige analyses of rapportages. Feedback gebruik je om je inzichten te verbeteren en nauwkeuriger conclusies te trekken.',
    procesbeheer: 'Je volgt bestaande processen nauwkeurig en voert taken onder begeleiding uit. Je signaleert eenvoudig knelpunten en documenteert werkzaamheden correct. Feedback gebruik je om je procesinzicht en nauwkeurigheid te verbeteren.',
    klantempathie: 'Je begrijpt de basisbehoeften van klanten en observeert onder begeleiding hoe klanten interactie hebben met producten of diensten. Je verzamelt feedback en signalen en helpt bij het vertalen van deze input naar verbeterpunten. Je gebruikt feedback om je begrip van klantbehoeften te vergroten.',
    marktonderzoek: 'Je ondersteunt bij het verzamelen en organiseren van marktinformatie onder begeleiding. Je voert eenvoudige analyses uit en helpt bij het opstellen van rapportages. Feedback gebruik je om je methodes en interpretaties te verbeteren.',
    ownership_executie: 'Je pakt taken proactief op en zorgt dat afgesproken werkzaamheden tijdig worden uitgevoerd. Je bewaakt de kwaliteit van je werk en zoekt actief feedback om je prestaties te verbeteren. Je neemt verantwoordelijkheid voor je bijdrage aan teamdoelstellingen.',
    strategisch_denken: 'Je begrijpt de basisdoelen van het team en de organisatie en kunt onder begeleiding verbanden leggen tussen acties en resultaten. Je ondersteunt bij het verzamelen van informatie en helpt bij eenvoudige analyses van trends en prioriteiten.',
    bedrijfsstrategie: 'Je begrijpt de kern van de organisatiedoelen en -strategie en volgt onder begeleiding hoe beslissingen en activiteiten bijdragen aan deze doelen. Je ondersteunt bij het verzamelen van relevante informatie en observeert trends en initiatieven binnen de organisatie.',
    roadmapping: 'Je begrijpt de basisprincipes van een product- of projectroadmap en ondersteunt onder begeleiding bij het bijhouden en documenteren van planning en prioriteiten. Je helpt bij het verzamelen van input van stakeholders en gebruikt feedback om de roadmap-inzichten te verbeteren.',
    communicatie: 'Je deelt informatie duidelijk en correct binnen het team en volgt onder begeleiding richtlijnen voor interne en externe communicatie. Je luistert actief en gebruikt feedback om je communicatie te verbeteren.',
    stakeholdermanagement: 'Je ondersteunt bij het in kaart brengen van relevante stakeholders en hun behoeften. Onder begeleiding onderhoud je basiscontact en communiceer je helder over voortgang of vragen. Je gebruikt feedback om je inzicht in belangen en relaties te vergroten.',
    leiderschap: 'Je toont initiatief binnen je eigen taken en ondersteunt collega\'s waar nodig. Je volgt leiding en instructies nauwkeurig en gebruikt feedback om je eigen effectiviteit en samenwerking te verbeteren.',
  },
  medior: {
    product_delivery: 'Je identificeert en prioriteert zelfstandig klantproblemen en begeleidt experimenten om oplossingen te valideren. Je neemt beslissingen op basis van data en impact, met oog voor zowel gebruikersbehoeften als technische haalbaarheid. Je werkt actief samen met stakeholders en verbetert productontwikkelprocessen binnen het team.',
    analytisch_vermogen: 'Je analyseert zelfstandig complexe datasets en identificeert relevante patronen of trends. Je trekt gefundeerde conclusies en onderbouwt aanbevelingen met data. Je combineert kwalitatieve en kwantitatieve informatie en adviseert stakeholders op basis van je analyses, waarbij je kritisch blijft op aannames en betrouwbaarheid van bronnen.',
    procesbeheer: 'Je beheert processen zelfstandig en identificeert efficiënt knelpunten of verbeterkansen. Je analyseert de impact van proceswijzigingen, implementeert verbeteringen en werkt actief samen met stakeholders om processen soepel en efficiënt te laten verlopen.',
    klantempathie: 'Je identificeert zelfstandig klantbehoeften en pijnpunten door gesprekken, observaties en data. Je analyseert deze inzichten en vertaalt ze naar acties of verbeteringen. Je adviseert stakeholders over klantgerichte oplossingen en weegt daarbij prioriteiten en impact af.',
    marktonderzoek: 'Je voert zelfstandig marktonderzoeken uit en identificeert trends, kansen en risico\'s. Je analyseert data uit verschillende bronnen en vertaalt deze naar concrete aanbevelingen voor product- of strategieontwikkeling. Je adviseert stakeholders en bewaakt de kwaliteit en betrouwbaarheid van de onderzoeksresultaten.',
    ownership_executie: 'Je neemt eigenaarschap over productinitiatieven en zorgt voor tijdige en kwalitatieve oplevering van features. Je signaleert risico\'s en onderneemt actie om voortgang te waarborgen. Je zorgt voor duidelijke prioriteiten en bewaakt de realisatie van afgesproken doelen.',
    strategisch_denken: 'Je identificeert zelfstandig kansen en risico\'s op basis van data, marktinformatie en interne inzichten. Je vertaalt inzichten naar concrete acties en adviseert stakeholders over de langetermijnimpact van beslissingen. Je houdt rekening met zowel organisatorische doelstellingen als externe ontwikkelingen.',
    bedrijfsstrategie: 'Je analyseert zelfstandig bedrijfsdoelen, marktontwikkelingen en concurrentie en vertaalt deze naar acties of aanbevelingen. Je draagt bij aan het opstellen van plannen en adviseert stakeholders over mogelijke strategische keuzes, waarbij je rekening houdt met zowel korte- als langetermijnimpact.',
    roadmapping: 'Je ontwikkelt zelfstandig roadmaps, waarbij je prioriteiten stelt op basis van klantbehoeften, impact en haalbaarheid. Je communiceert duidelijk over planning en afhankelijkheden, stemt af met stakeholders en gebruikt data en inzichten om beslissingen in de roadmap te onderbouwen.',
    communicatie: 'Je communiceert zelfstandig en effectief met verschillende stakeholders, zowel schriftelijk als mondeling. Je past je boodschap aan de doelgroep aan, presenteert informatie helder en overtuigend, en faciliteert constructieve discussies. Je gebruikt communicatie als middel om samenwerking en begrip te versterken.',
    stakeholdermanagement: 'Je onderhoudt zelfstandig relaties met stakeholders en begrijpt hun belangen en verwachtingen. Je stemt af over prioriteiten, communiceert proactief over beslissingen en ontwikkelingen, en lost conflicten of misverstanden op een constructieve manier op. Je adviseert stakeholders op basis van data en impact.',
    leiderschap: 'Je geeft richting en begeleiding aan collega\'s bij projecten of processen. Je stimuleert samenwerking, neemt verantwoordelijkheid voor resultaten en beïnvloedt op een constructieve manier teamgedrag en prestaties. Je inspireert anderen door voorbeeldgedrag en draagt bij aan een positieve en productieve werkomgeving.',
  },
  senior: {
    product_delivery: 'Je definieert de productontwikkelstrategie en stuurt op validatie van problemen en kansen. Je introduceert en verbetert processen voor experimentatie, neemt beslissingen bij complexe afwegingen en verbindt productontwikkeling aan organisatiedoelen. Daarnaast coach je collega\'s en stimuleer je een cultuur van iteratief en datagedreven werken.',
    analytisch_vermogen: 'Je definieert strategische analyses en vertaalt complexe vraagstukken naar duidelijke datagedreven inzichten. Je leidt datagedreven besluitvorming en coacht collega\'s in analytisch denken. Je verbetert analytische processen binnen het team en stimuleert een cultuur van kritisch, systematisch en evidence-based werken, waarbij data direct gekoppeld wordt aan organisatiedoelen.',
    procesbeheer: 'Je definieert en optimaliseert strategische processen op team- of organisatieniveau. Je bewaakt kwaliteit, compliance en efficiency, neemt beslissingen bij complexe procesvraagstukken, coacht collega\'s in procesdenken en stimuleert een cultuur van continue procesverbetering die bijdraagt aan organisatiedoelen.',
    klantempathie: 'Je definieert een klantgerichte strategie en stimuleert een cultuur waarin klantbehoeften centraal staan. Je verbindt klantinzichten aan product- en organisatiedoelen en coacht collega\'s in het systematisch en empathisch begrijpen van klanten. Je benut complexe klantdata en trends om strategische keuzes te onderbouwen en kansen te creëren.',
    marktonderzoek: 'Je definieert strategische onderzoeksagenda\'s en benut marktonderzoek om beslissingen op organisatieniveau te ondersteunen. Je koppelt inzichten aan productontwikkeling en businessdoelen, coacht collega\'s in onderzoeksvaardigheden en stimuleert een cultuur van evidence-based besluitvorming. Je introduceert nieuwe methoden en processen om marktonderzoek effectiever en impactvoller te maken.',
    ownership_executie: 'Je draagt end-to-end verantwoordelijkheid voor complexe productinitiatieven en stuurt op het behalen van organisatiedoelstellingen. Je neemt beslissingen in onzekere situaties en zorgt dat teams effectief kunnen leveren. Je creëert randvoorwaarden voor succesvolle executie en continu verbeteren.',
    strategisch_denken: 'Je definieert en communiceert de strategische richting van producten, teams of de organisatie. Je neemt complexe beslissingen met een langetermijnvisie, koppelt acties aan organisatiedoelen en coacht collega\'s in strategisch denken. Je stimuleert een cultuur waarin plannen, keuzes en prioriteiten systematisch worden afgestemd op zowel interne als externe ontwikkelingen.',
    bedrijfsstrategie: 'Je definieert de strategische koers van de organisatie en neemt beslissingen op basis van complexe analyses van interne en externe factoren. Je koppelt bedrijfsdoelen aan product- en marktstrategieën, coacht collega\'s in strategisch denken en stimuleert een organisatiebrede cultuur van langetermijnvisie en evidence-based besluitvorming.',
    roadmapping: 'Je definieert de strategische roadmap op team- of organisatieniveau en koppelt deze aan bedrijfsdoelen. Je neemt complexe afwegingen tussen prioriteiten en resources, faciliteert alignment tussen stakeholders en coacht collega\'s in roadmapontwikkeling. Je stimuleert een cultuur van transparantie, iteratie en datagedreven planning.',
    communicatie: 'Je definieert communicatiestrategieën voor team- of organisatieniveau en verbindt boodschappen aan strategische doelen. Je coacht collega\'s in effectieve communicatie, zorgt voor transparantie en alignment tussen stakeholders, en bevordert een cultuur van open, duidelijke en impactvolle communicatie.',
    stakeholdermanagement: 'Je definieert de strategie voor stakeholdermanagement op team- of organisatieniveau en faciliteert alignment tussen verschillende belangen. Je coacht collega\'s in effectief stakeholderbeheer, neemt beslissingen bij complexe afwegingen, en stimuleert een cultuur van transparante, betrouwbare en strategische samenwerking.',
    leiderschap: 'Je definieert de visie en richting voor teams of de organisatie en neemt verantwoordelijkheid voor strategische en operationele resultaten. Je coacht en ontwikkelt collega\'s, faciliteert alignment en samenwerking over afdelingen heen, en stimuleert een cultuur van verantwoordelijkheid, innovatie en continue verbetering. Je neemt beslissingen bij complexe vraagstukken en balanceert korte- en langetermijnbelangen.',
  },
};

export type AssessmentScore = 1 | 2 | 3 | 4 | 5;

export const scoreLabels: Record<AssessmentScore, string> = {
  1: 'Veel minder',
  2: 'Minder',
  3: 'Volgens verwachting',
  4: 'Beter',
  5: 'Veel beter',
};

export const scoreColors: Record<AssessmentScore, string> = {
  1: '#ef4444',
  2: '#f97316',
  3: '#eab308',
  4: '#22c55e',
  5: '#6366f1',
};

export function getCategoryForCompetency(compId: CompetencyId): Category {
  return categories.find(c => c.competencies.includes(compId))!;
}

export function getCompetency(compId: CompetencyId): Competency {
  return competencies.find(c => c.id === compId)!;
}