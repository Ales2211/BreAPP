export type Unit = 'Kg' | 'g' | 'Lt' | 'pcs';

export interface Location {
    id: string;
    name: string;
    // Fix: Updated Location type to use specific keys to avoid translation conflicts.
    type: 'Tank' | 'LocationType_Warehouse' | 'LocationType_Other';
}

export interface Supplier {
    id: string;
    name: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    address?: string;
    website?: string;
    notes?: string;
}

export interface Customer {
    id: string;
    name: string;
    vatNumber?: string;
    address?: string;
    email?: string;
    phone?: string;
    notes?: string;
}

export interface OrderItem {
    id: string;
    masterItemId: string; // Finished good master item
    quantity: number;
    pricePerUnit: number; // Price at the time of order
}

export interface Order {
    id: string;
    customerId: string;
    orderNumber: string;
    orderDate: string;
    requiredDate: string;
    status: 'Draft' | 'Confirmed' | 'Shipped' | 'Completed' | 'Canceled';
    items: OrderItem[];
    notes?: string;
}


export interface Category {
    id: string;
    name: string;
    parentCategoryId?: string;
}

export interface MasterItem {
    id: string;
    name: string;
    categoryId: string;
    unit: Unit;
    format?: number;
    defaultSupplierId?: string;
    purchaseCost?: number; // Cost per unit for raw materials
    salePrice?: number;    // Price per unit for finished goods
    reorderPoint?: number;
}

export interface WarehouseItem {
    id: string;
    masterItemId: string;
    lotNumber: string;
    quantity: number;
    locationId: string;
    expiryDate: string;
    documentNumber: string;
    arrivalDate: string;
}

export interface Ingredient {
    id: string;
    masterItemId: string;
    quantity: number;
}

export interface BoilWhirlpoolIngredient extends Ingredient {
    type: 'Boil' | 'Whirlpool';
    timing: number; // minutes
    temperature?: number; // celsius, for whirlpool
}

export interface TankIngredient extends Ingredient {
    day: number;
}

export interface MashStep {
    id: string;
    type: 'Infusion' | 'Decoction' | 'Temperature';
    temperature: number;
    duration: number;
}

export interface FermentationStep {
    id: string;
    description: string;
    temperature: number;
    pressure: number;
    days: number;
}

export interface PackagedItemLink {
    id:string;
    masterItemId: string; // Finished good master item
}

export interface PackagedItemActual extends PackagedItemLink {
    formatLiters?: number;
    quantityUsed?: number;
    quantityGood?: number;
}


// --- Quality Control Types ---
export interface QualityControlValueSpec {
    target: number;
    min?: number;
    max?: number;
}

export interface QualityControlSpecification {
    og: QualityControlValueSpec;
    fg: QualityControlValueSpec;
    abv: QualityControlValueSpec;
    ibu: QualityControlValueSpec;
    liters: QualityControlValueSpec;
    finalPh?: QualityControlValueSpec;
    preFermentationPh?: QualityControlValueSpec;
}

export interface SensoryPanelLog {
    id: string;
    date: string;
    panelistName: string;
    aromaNotes?: string;
    flavorNotes?: string;
    appearanceScore?: number; // e.g., 1-5
    aromaScore?: number;
    flavorScore?: number;
    mouthfeelScore?: number;
    overallScore?: number;
    notes?: string;
}

export interface LabAnalysisLog {
    id: string;
    date: string;
    diacetylPpb?: number;
    vdkPpb?: number;
    microbiologyTestResult?: 'Pass' | 'Fail' | 'Pending';
    notes?: string;
}

export interface QualityControlLog {
    sensoryPanelLogs: SensoryPanelLog[];
    labAnalysisLogs: LabAnalysisLog[];
}


export interface Recipe {
    id: string;
    name: string;
    style: string;
    shelfLifeDays?: number;
    qualityControlSpec: QualityControlSpecification;
    mashIngredients: Ingredient[];
    boilWhirlpoolIngredients: BoilWhirlpoolIngredient[];
    tankIngredients: TankIngredient[];
    mashSteps: MashStep[];
    fermentationSteps: FermentationStep[];
    packagedItems: PackagedItemLink[];
    processParameters: ProcessParameters;
    notes?: string;
}

export interface ProcessParameters {
    mashWaterMainsL: number;
    mashWaterMainsMicroSiemens: number;
    mashWaterRoL: number;
    mashWaterRoMicroSiemens: number;
    spargeWaterL: number;
    spargeWaterMicroSiemens: number;
    spargeWaterPh: number;
    maltMilling: number;
    expectedMashPh: number;
    expectedIodineTime: number;
    transferDuration: number;
    recirculationDuration: number;
    filtrationDuration: number;
    firstWortPlato: number;
    firstWortPh: number;
    lastWortPlato: number;
    lastWortPh: number;
    preBoilLiters: number;
    preBoilPlato: number;
    preBoilPh: number;
    postBoilLiters: number;
    postBoilPlato: number;
    postBoilPh: number;
    boilDuration: number;
    whirlpoolDuration: number;
    whirlpoolRestDuration: number;
    coolingDuration: number;
}


// Interfaces for BrewSheet actual logs
export interface ActualIngredient {
    id: string;
    masterItemId: string;
    quantity?: number;
    lotNumber?: string;
}

export interface ActualBoilWhirlpoolIngredient extends ActualIngredient {
    type: 'Boil' | 'Whirlpool';
    timing: number;
    temperature?: number;
}

export interface ActualTankIngredient extends ActualIngredient {
    day: number;
}


export interface LogEntry {
    id: string;
    timestamp: string;
    temperature?: number;
    gravity?: number;
    ph?: number;
    notes?: string;
}

export interface BrewSheet {
    id: string;
    recipeId: string;
    beerName: string;
    lot: string;
    cookNumber: number;
    cookDate: string;
    fermenterId: string;
    status: 'Planned' | 'In Progress' | 'Fermenting' | 'Packaged' | 'Completed';
    mashLog: {
        expected: {
            ingredients: Ingredient[];
            steps: MashStep[];
            mashPh?: number;
            expectedIodineTime?: number;
        };
        actual: {
            ingredients: ActualIngredient[];
            steps: MashStep[];
            mashPh?: number;
            iodineTime?: number;
        };
    };
    lauterLog: {
        expected: {
            transferDuration?: number;
            recirculationDuration?: number;
            filtrationDuration?: number;
            firstWortPlato?: number;
            firstWortPh?: number;
            lastWortPlato?: number;
            lastWortPh?: number;
        };
        actual: {
            transferDuration?: number;
            recirculationDuration?: number;
            filtrationDuration?: number;
            firstWortPlato?: number;
            firstWortPh?: number;
            lastWortPlato?: number;
            lastWortPh?: number;
        };
    };
    boilLog: {
        expected: {
            ingredients: BoilWhirlpoolIngredient[];
            preBoilLiters?: number;
            preBoilPlato?: number;
            preBoilPh?: number;
            boilDuration?: number;
            postBoilLiters?: number;
            postBoilPlato?: number;
            postBoilPh?: number;
            whirlpoolDuration?: number;
            whirlpoolRestDuration?: number;
            coolingDuration?: number;
        };
        actual: {
            ingredients: ActualBoilWhirlpoolIngredient[];
            preBoilLiters?: number;
            preBoilPlato?: number;
            preBoilPh?: number;
            boilStartTime?: string;
            boilEndTime?: string;
            postBoilLiters?: number;
            postBoilPlato?: number;
            postBoilPh?: number;
            whirlpoolDuration?: number;
            whirlpoolRestDuration?: number;
            coolingDuration?: number;
            coolingWashingCounterStart?: number;
            coolingWashingCounterEnd?: number;
            coolingWortCounterStart?: number;
            coolingWortCounterEnd?: number;
        };
    };
    fermentationLog: {
        expected: {
            steps: FermentationStep[];
            additions: TankIngredient[];
        };
        actual: {
            additions: ActualTankIngredient[];
            logEntries: LogEntry[];
        };
    };
    packagingLog: {
        packagingDate?: string;
        bestBeforeDate?: string;
        tankPressure?: number;
        saturation?: string;
        packagedItems: PackagedItemActual[];
        summaryExpectedLiters?: number;
        notes?: string;
        packagingLoadedToWarehouse: boolean;
    };
    qualityControlLog?: QualityControlLog;
}

export enum Page {
    Dashboard = 'Dashboard',
    Batches = 'Batches',
    Calendar = 'Calendar',
    Recipes = 'Recipes',
    Warehouse = 'Warehouse',
    WarehouseFinishedGoods = 'WarehouseFinishedGoods',
    Items = 'Items',
    Suppliers = 'Suppliers',
    Locations = 'Locations',
    ProductionPlan = 'ProductionPlan',
    Analysis = 'Analysis',
    Tools = 'Tools',
    Settings = 'Settings',
    Orders = 'Orders',
    Customers = 'Customers',
    QualityControl = 'QualityControl',
}