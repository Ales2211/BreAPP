export enum Page {
    Dashboard = 'Dashboard',
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
    Tools = 'Tools',
    Settings = 'Settings',
    Shipping = 'Shipping',
    Calendar = 'Calendar',
}

export type Unit = 'Kg' | 'g' | 'L' | 'pcs';

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
  containerVolumeL?: number;
  defaultSupplierId?: string;
  purchaseCost?: number;
  salePrice?: number;
  reorderPoint?: number;
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
  timestamp: string; // ISO string
  type: 'load' | 'unload' | 'brew_unload' | 'move' | 'correction';
  masterItemId: string;
  lotNumber: string;
  quantity: number; // positive for load/in, negative for unload/out
  locationId: string;
  documentNumber?: string;
  notes?: string;
}

export interface Ingredient {
  id: string;
  masterItemId: string;
  quantity: number;
}

export interface BoilWhirlpoolIngredient extends Ingredient {
  type: 'Boil' | 'Whirlpool';
  timing: number; // minutes
  temperature?: number; // for whirlpool
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
    id: string;
    masterItemId: string;
    packagingSplit?: number;
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
    finalPh: QualityControlValueSpec;
    preFermentationPh: QualityControlValueSpec;
}

export interface AdministrationSettings {
    annualManpowerCost: number;
    annualGasCost: number;
    annualRentCost: number;
    annualWaterCost: number;
    annualDetergentsCost: number;
    annualCo2Cost: number;
    exciseDutyRate: number;
    annualBatches: number;
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
    packagingIngredients: Ingredient[];
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
        packagingYield: number;
    },
    additionalCosts: {
        other: number;
    },
    notes: string;
}

export interface LogEntry {
  id: string;
  timestamp: string; // ISO string
  temperature: number;
  gravity: number;
  ph: number;
  notes: string;
}

export interface LotAssignment {
    id: string;
    lotNumber: string;
    quantity: number;
}

export interface ActualIngredient {
    id: string; // Corresponds to the Ingredient ID from the recipe
    masterItemId: string;
    lotAssignments: LotAssignment[];
}

export type ActualBoilWhirlpoolIngredient = ActualIngredient;
export type ActualTankIngredient = ActualIngredient;

export interface PackagedItemActual {
    id: string; // Corresponds to PackagedItemLink id
    masterItemId: string;
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
  linkedBatchId?: string; // ID of the parent batch if this is a double batch turn
  
  unloadStatus: {
      mash: boolean;
      boil: boolean;
      fermentation: boolean;
  };
  
  mashLog: {
    expected: {
        ingredients: Ingredient[];
        steps: MashStep[];
        mashWaterMainsL: number;
        mashWaterMainsMicroSiemens: number;
        mashWaterRoL: number;
        mashWaterRoMicroSiemens: number;
        maltMilling: number;
        mashPh: number;
        expectedIodineTime: number;
    };
    actual: {
        ingredients: ActualIngredient[];
        steps: (MashStep & { actualStartTime?: string; actualEndTime?: string; actualTemperature?: number; })[];
        mashWaterMainsL?: number;
        mashWaterMainsMicroSiemens?: number;
        mashWaterRoL?: number;
        mashWaterRoMicroSiemens?: number;
        maltMilling?: number;
        mashPh?: number;
        iodineTime?: number;
    }
  },
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
      }
  },
  boilLog: {
      expected: {
          ingredients: BoilWhirlpoolIngredient[];
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
      }
  },
  fermentationLog: {
    expected: {
        steps: FermentationStep[];
        additions: TankIngredient[];
    };
    actual: {
        additions: ActualTankIngredient[];
        logEntries: LogEntry[];
    }
  },
  packagingLog: {
    packagingDate?: string;
    bestBeforeDate?: string;
    tankPressure?: number;
    saturation?: string;
    packagedItems: PackagedItemActual[];
    notes?: string;
    summaryExpectedLiters?: number;
    packagingLoadedToWarehouse?: boolean;
  }
}

export interface BatchNumberingSettings {
    lotNumberSettings: {
        template: string;
        resetFrequency: 'yearly' | 'monthly' | 'never';
        sequenceDigits: number;
    }
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
    orderDate: string; // YYYY-MM-DD
    requiredDate: string; // YYYY-MM-DD
    status: 'Draft' | 'Confirmed' | 'Shipped' | 'Completed' | 'Canceled';
    items: OrderItem[];
    notes: string;
}

export interface ItemDiscount {
    masterItemId: string;
    discountPercent: number;
}

export interface CustomerPriceList {
    id: string;
    customerId: string;
    globalDiscountPercent: number;
    itemDiscounts: ItemDiscount[];
}

export interface TransportDocumentItem {
    id: string;
    masterItemId: string;
    lotNumber: string;
    quantity: number;
    pricePerUnit: number;
}

export interface TransportDocument {
    id: string;
    documentNumber: string;
    customerId: string;
    shippingDate: string;
    carrier?: string;
    shippingAddress?: string;
    notes?: string;
    items: TransportDocumentItem[];
    orderId?: string;
}