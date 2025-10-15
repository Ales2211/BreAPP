
export enum Page {
    Dashboard = 'Dashboard',
    Calendar = 'Calendar',
    Batches = 'Batches',
    Recipes = 'Recipes',
    Warehouse = 'Warehouse',
    WarehouseMovements = 'WarehouseMovements',
    Items = 'Items',
    ProductionPlan = 'ProductionPlan',
    Analysis = 'Analysis',
    QualityControl = 'QualityControl',
    Orders = 'Orders',
    Customers = 'Customers',
    Suppliers = 'Suppliers',
    Locations = 'Locations',
    ProductionCosts = 'ProductionCosts',
    PriceList = 'PriceList',
    CustomerPriceLists = 'CustomerPriceLists',
    Shipping = 'Shipping',
    Tools = 'Tools',
    Settings = 'Settings',
    FinishedGoodsWarehouse = 'FinishedGoodsWarehouse',
}

export type Unit = 'Kg' | 'g' | 'L' | 'pcs';

export interface Category {
    id: string;
    name: string;
    parentCategoryId?: string;
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
    format?: number;
    containerVolumeL?: number;
    defaultSupplierId?: string;
    purchaseCost?: number;
    salePrice?: number;
    reorderPoint?: number;
}

export interface Location {
    id: string;
    name: string;
    type: 'LocationType_Warehouse' | 'Tank' | 'LocationType_Other';
    grossVolumeL?: number;
}

export interface WarehouseItem {
    id: string;
    masterItemId: string;
    lotNumber: string;
    quantity: number;
    locationId: string;
    arrivalDate: string;
    expiryDate?: string;
    documentNumber?: string;
}

export interface WarehouseMovement {
    id: string;
    timestamp: string;
    type: 'load' | 'unload' | 'brew_unload' | 'move';
    masterItemId: string;
    lotNumber: string;
    quantity: number;
    locationId: string;
    documentNumber?: string;
}

export interface Ingredient {
    id: string;
    masterItemId: string;
    quantity: number;
}

export interface BoilWhirlpoolIngredient extends Ingredient {
    type: 'Boil' | 'Whirlpool';
    timing: number;
    temperature?: number;
}

export interface TankIngredient extends Ingredient {
    day: number;
}

export interface MashStep {
    id: string;
    type: 'Infusion' | 'Decoction' | 'Temperature';
    temperature: number;
    duration: number;
    actualStartTime?: string;
    actualEndTime?: string;
    actualTemperature?: number;
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
    packagingSplit: number;
    packagingIngredients: Ingredient[];
}

export interface QualityControlValueSpec {
    target?: number;
    min?: number;
    max?: number;
}

export interface QualityControlSpecification {
    og: QualityControlValueSpec;
    fg: QualityControlValueSpec;
    abv: QualityControlValueSpec;
    ibu: QualityControlValueSpec;
    liters: QualityControlValueSpec;
    finalPh: QualityControlValueSpec;
    preFermentationPh: QualityControlValueSpec;
}

export interface ProcessParameters {
    mashWaterMainsL?: number;
    mashWaterMainsMicroSiemens?: number;
    mashWaterRoL?: number;
    mashWaterRoMicroSiemens?: number;
    spargeWaterL?: number;
    spargeWaterMicroSiemens?: number;
    spargeWaterPh?: number;
    maltMilling?: number;
    expectedMashPh?: number;
    expectedIodineTime?: number;
    transferDuration?: number;
    recirculationDuration?: number;
    filtrationDuration?: number;
    firstWortPlato?: number;
    firstWortPh?: number;
    lastWortPlato?: number;
    lastWortPh?: number;
    preBoilLiters?: number;
    preBoilPlato?: number;
    preBoilPh?: number;
    postBoilLiters?: number;
    postBoilPlato?: number;
    postBoilPh?: number;
    boilDuration?: number;
    whirlpoolDuration?: number;
    whirlpoolRestDuration?: number;
    coolingDuration?: number;
    packagingYield: number;
    boilWaterAdditionL?: number;
    boilWaterAdditionNotes?: string;
}

export interface Recipe {
    id: string;
    name: string;
    style: string;
    version: string;
    shelfLifeDays: number;
    qualityControlSpec: QualityControlSpecification;
    mashIngredients: Ingredient[];
    boilWhirlpoolIngredients: BoilWhirlpoolIngredient[];
    tankIngredients: TankIngredient[];
    mashSteps: MashStep[];
    fermentationSteps: FermentationStep[];
    packagedItems: PackagedItemLink[];
    processParameters: ProcessParameters;
    additionalCosts: {
        [key: string]: number | undefined;
    };
    notes: string;
}

export interface LotAssignment {
    id: string;
    lotNumber: string;
    quantity: number | undefined;
}

export interface ActualIngredient {
    id: string;
    masterItemId: string;
    lotAssignments: LotAssignment[];
}

export interface ActualBoilWhirlpoolIngredient extends ActualIngredient {}
export interface ActualTankIngredient extends ActualIngredient {
    unloaded?: boolean;
}

export interface LogEntry {
    id: string;
    timestamp: string;
    type: 'measurement' | 'transfer';
    notes?: string;
    temperature?: number;
    gravity?: number;
    ph?: number;
    pressure?: number;
    details?: {
        fromTankId?: string;
        toTankId?: string;
    };
}

export interface PackagedItemActual {
    id: string;
    masterItemId: string;
    quantityGood?: number;
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
    linkedBatchId?: string;
    unloadStatus: {
        mash: boolean;
        boil: boolean;
        fermentation: boolean;
    };
    mashLog: {
        expected: {
            ingredients: Ingredient[];
            steps: MashStep[];
            mashWaterMainsL?: number;
            mashWaterMainsMicroSiemens?: number;
            mashWaterRoL?: number;
            mashWaterRoMicroSiemens?: number;
            maltMilling?: number;
            mashPh?: number;
            expectedIodineTime?: number;
        };
        actual: {
            ingredients: ActualIngredient[];
            steps: MashStep[];
            mashWaterMainsL?: number;
            mashWaterMainsMicroSiemens?: number;
            mashWaterRoL?: number;
            mashWaterRoMicroSiemens?: number;
            maltMilling?: number;
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
            spargeWaterL?: number;
            spargeWaterMicroSiemens?: number;
            spargeWaterPh?: number;
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
            preBoilLiters?: number;
            preBoilPlato?: number;
            preBoilPh?: number;
            postBoilLiters?: number;
            postBoilPlato?: number;
            postBoilPh?: number;
            boilDuration?: number;
            whirlpoolDuration?: number;
            whirlpoolRestDuration?: number;
            coolingDuration?: number;
            boilWaterAdditionL?: number;
            boilWaterAdditionNotes?: string;
        };
        actual: {
            ingredients: ActualBoilWhirlpoolIngredient[];
            preBoilLiters?: number;
            preBoilPlato?: number;
            preBoilPh?: number;
            postBoilLiters?: number;
            postBoilPlato?: number;
            postBoilPh?: number;
            boilStartTime?: string;
            boilEndTime?: string;
            whirlpoolStartTime?: string;
            whirlpoolEndTime?: string;
            whirlpoolRestStartTime?: string;
            whirlpoolRestEndTime?: string;
            coolingStartTime?: string;
            coolingEndTime?: string;
            coolingWashingCounterStart?: number;
            coolingWashingCounterEnd?: number;
            coolingWortCounterStart?: number;
            coolingWortCounterEnd?: number;
            boilWaterAdditionL?: number;
            boilWaterAdditionNotes?: string;
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
        packagingLoadedToWarehouse?: boolean;
    };
}

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
    orderDate: string;
    requiredDate: string;
    status: 'Draft' | 'Confirmed' | 'Shipped' | 'Completed' | 'Canceled';
    items: OrderItem[];
    notes?: string;
}

export interface TransportDocument {
    id: string;
    documentNumber: string;
    shippingDate: string;
    customerId: string;
    orderIds: string[];
    items: {
        masterItemId: string;
        lotNumber: string;
        quantity: number;
    }[];
    notes?: string;
}

export interface BatchNumberingSettings {
    lotNumberSettings: {
        template: string;
        resetFrequency: 'yearly' | 'monthly' | 'never';
        sequenceDigits: number;
    };
}

export interface AdministrationSettings {
    annualManpowerCost: number | undefined;
    annualGasCost: number | undefined;
    annualRentCost: number | undefined;
    annualWaterCost: number | undefined;
    annualDetergentsCost: number | undefined;
    annualCo2Cost: number | undefined;
    exciseDutyRate: number | undefined;
    annualBatches: number | undefined;
}

export interface ItemDiscount {
    masterItemId: string;
    discountPercent: number;
}

export interface CategoryDiscount {
    categoryId: string;
    discountPercent: number | undefined;
}

export interface CustomerPriceList {
    id: string;
    customerId: string;
    globalDiscountPercent: number | undefined;
    itemDiscounts: ItemDiscount[];
    categoryDiscounts: CategoryDiscount[];
}
