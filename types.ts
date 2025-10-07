import React from 'react';

export enum Page {
    Dashboard = 'Dashboard',
    Batches = 'Batches',
    Calendar = 'Calendar',
    QualityControl = 'QualityControl',
    Recipes = 'Recipes',
    Warehouse = 'Warehouse',
    WarehouseFinishedGoods = 'WarehouseFinishedGoods',
    Items = 'Items',
    Suppliers = 'Suppliers',
    Locations = 'Locations',
    Analysis = 'Analysis',
    ProductionPlan = 'ProductionPlan',
    Tools = 'Tools',
    Settings = 'Settings',
    Orders = 'Orders',
    Customers = 'Customers',
}

export type Unit = 'Kg' | 'g' | 'Lt' | 'pcs';

export interface Category {
    id: string;
    name: string;
    parentCategoryId?: string;
}

export interface Location {
    id: string;
    name: string;
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

export interface MasterItem {
    id: string;
    name: string;
    categoryId: string;
    unit: Unit;
    format?: number; // e.g., 25 for a 25Kg sack
    containerVolumeL?: number; // For finished goods, e.g., 0.44 for a can
    defaultSupplierId?: string;
    purchaseCost?: number; // Cost per unit
    salePrice?: number; // Price per unit
    reorderPoint?: number;
}

export interface WarehouseItem {
    id: string;
    masterItemId: string;
    lotNumber: string;
    quantity: number;
    locationId: string;
    arrivalDate: string; // YYYY-MM-DD
    expiryDate?: string; // YYYY-MM-DD
    documentNumber?: string; // e.g., DDT or invoice number
}

// --- Recipe-related types ---

export interface Ingredient {
    id: string;
    masterItemId: string;
    quantity: number;
}

export interface BoilWhirlpoolIngredient extends Ingredient {
    type: 'Boil' | 'Whirlpool';
    timing: number; // minutes from start of boil
    temperature?: number; // for whirlpool
}

export interface TankIngredient extends Ingredient {
    day: number; // day of fermentation to add
}

export interface MashStep {
    id: string;
    temperature: number;
    duration: number;
    type: 'Infusion' | 'Decoction' | 'Temperature';
}

export interface FermentationStep {
    id: string;
    description: string;
    temperature: number;
    pressure: number;
    days: number;
}

export interface PackagedItemLink {
    id: string;
    masterItemId: string;
}

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
    preFermentationPh?: QualityControlValueSpec;
    finalPh?: QualityControlValueSpec;
}

export interface Recipe {
    id: string;
    name: string;
    style: string;
    shelfLifeDays: number;
    qualityControlSpec: QualityControlSpecification;
    mashIngredients: Ingredient[];
    boilWhirlpoolIngredients: BoilWhirlpoolIngredient[];
    tankIngredients: TankIngredient[];
    mashSteps: MashStep[];
    fermentationSteps: FermentationStep[];
    packagedItems: PackagedItemLink[];
    processParameters: {
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
    };
    notes?: string;
}

// --- Brew Sheet (Batch) related types ---

export interface LotAssignment {
    id: string;
    lotNumber: string;
    quantity: number;
}

export interface ActualIngredient {
    id: string;
    masterItemId: string;
    lotAssignments: LotAssignment[];
}
export interface ActualBoilWhirlpoolIngredient extends BoilWhirlpoolIngredient {
    lotAssignments: LotAssignment[];
}
export interface ActualTankIngredient extends TankIngredient {
    lotAssignments: LotAssignment[];
}

export interface ActualMashStep extends MashStep {
    actualStartTime?: string;
    actualEndTime?: string;
    actualTemperature?: number;
}

export interface LogEntry {
    id: string;
    timestamp: string; // ISO string
    temperature: number;
    gravity: number;
    ph: number;
    notes: string;
}

export interface PackagedItemActual extends PackagedItemLink {
    quantityGood?: number;
}

export interface BrewSheet {
    id: string;
    recipeId: string;
    beerName: string;
    lot: string;
    cookNumber: number;
    cookDate: string; // YYYY-MM-DD
    fermenterId: string;
    status: 'Planned' | 'In Progress' | 'Fermenting' | 'Packaged' | 'Completed';
    unloadStatus: {
        mash: boolean;
        boil: boolean;
        fermentation: boolean;
    };

    mashLog: {
        expected: {
            ingredients: Ingredient[];
            steps: MashStep[];
            mashPh: number;
            expectedIodineTime: number;
            mashWaterMainsL: number;
            mashWaterMainsMicroSiemens: number;
            mashWaterRoL: number;
            mashWaterRoMicroSiemens: number;
            maltMilling: number;
        };
        actual: {
            ingredients: ActualIngredient[];
            steps: ActualMashStep[]; 
            mashPh?: number;
            iodineTime?: number;
            mashWaterMainsL?: number;
            mashWaterMainsMicroSiemens?: number;
            mashWaterRoL?: number;
            mashWaterRoMicroSiemens?: number;
            maltMilling?: number;
        };
    };

    lauterLog: {
        expected: {
            transferDuration: number;
            recirculationDuration: number;
            filtrationDuration: number;
            firstWortPlato: number;
            firstWortPh: number;
            lastWortPlato: number;
            lastWortPh: number;
            spargeWaterL: number;
            spargeWaterMicroSiemens: number;
            spargeWaterPh: number;
        };
        actual: {
            transferStartTime?: string;
            transferEndTime?: string;
            recirculationStartTime?: string;
            recirculationEndTime?: string;
            filtrationStartTime?: string;
            filtrationEndTime?: string;
            firstWortPlato?: number;
            firstWortPh?: number;
            lastWortPlato?: number;
            lastWortPh?: number;
            spargeWaterL?: number;
            spargeWaterMicroSiemens?: number;
            spargeWaterPh?: number;
        };
    };

    boilLog: {
        expected: {
            ingredients: BoilWhirlpoolIngredient[];
            preBoilLiters: number;
            preBoilPlato: number;
            preBoilPh: number;
            boilDuration: number;
            postBoilLiters: number;
            postBoilPlato: number;
            postBoilPh: number;
            whirlpoolDuration: number;
            whirlpoolRestDuration: number;
            coolingDuration: number;
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
            whirlpoolStartTime?: string;
            whirlpoolEndTime?: string;
            whirlpoolRestStartTime?: string;
            whirlpoolRestEndTime?: string;
            coolingStartTime?: string;
            coolingEndTime?: string;
            coolingWashingCounterStart?: number;
            // Fix: Corrected typo from coolingWastingCounterEnd to coolingWashingCounterEnd.
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
        summaryExpectedLiters: number;
        packagingLoadedToWarehouse: boolean;
        notes?: string;
    };
    
    qualityControlLog: {
        // Define as needed later
        sensoryPanelLogs: any[];
        labAnalysisLogs: any[];
    };
}

// --- Order-related types ---

export interface OrderItem {
    id: string;
    masterItemId: string;
    quantity: number;
    pricePerUnit: number;
}

export interface Order {
    id: string;
    customerId: string;
    orderNumber: string;
    orderDate: string; // YYYY-MM-DD
    requiredDate: string; // YYYY-MM-DD
    status: 'Draft' | 'Confirmed' | 'Shipped' | 'Completed' | 'Canceled';
    items: OrderItem[];
    notes?: string;
}
