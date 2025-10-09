import { BrewSheet, Recipe, MasterItem, WarehouseItem, Category, Location, Supplier, Customer, Order, BatchNumberingSettings, AdministrationSettings, CustomerPriceList, TransportDocument, WarehouseMovement } from '../types';

export const mockCategories: Category[] = [
  { id: 'cat_malt', name: 'Malt' },
  { id: 'cat_hops', name: 'Hops' },
  { id: 'cat_yeast', name: 'Yeast' },
  { id: 'cat_adjunct', name: 'Adjunct' },
  { id: 'cat_sugar', name: 'Sugar' },
  { id: 'cat_spices', name: 'Spices' },
  { id: 'cat_other', name: 'Category_Other' },
  { id: 'cat_packaging', name: 'Category_Packaging' },
  { id: 'cat_fg', name: 'Finished Goods' },
  { id: 'cat_kegs', name: 'Kegs', parentCategoryId: 'cat_fg' },
  { id: 'cat_cans', name: 'Cans', parentCategoryId: 'cat_fg' },
  { id: 'cat_bottles', name: 'Bottles', parentCategoryId: 'cat_fg' },
];

export const mockSuppliers: Supplier[] = [
    { id: 'sup_1', name: 'Weyermann Malz', email: 'info@weyermann.de' },
    { id: 'sup_2', name: 'Yakima Chief Hops', email: 'sales@yakimachief.com' },
    { id: 'sup_3', name: 'Fermentis', email: 'sales@fermentis.com' },
];

export const mockMasterItems: MasterItem[] = [
  // Malts
  { id: 'item_1', name: 'Pilsner Malt', categoryId: 'cat_malt', unit: 'Kg', format: 25, purchaseCost: 1.5, defaultSupplierId: 'sup_1' },
  { id: 'item_2', name: 'Vienna Malt', categoryId: 'cat_malt', unit: 'Kg', format: 25, purchaseCost: 1.6, defaultSupplierId: 'sup_1' },
  { id: 'item_3', name: 'Munich Malt', categoryId: 'cat_malt', unit: 'Kg', format: 25, purchaseCost: 1.6, defaultSupplierId: 'sup_1' },
  { id: 'item_4', name: 'CaraPils', categoryId: 'cat_malt', unit: 'Kg', format: 25, purchaseCost: 1.8, defaultSupplierId: 'sup_1' },
  // Hops
  { id: 'item_5', name: 'Citra', categoryId: 'cat_hops', unit: 'Kg', format: 5, purchaseCost: 50, defaultSupplierId: 'sup_2' },
  { id: 'item_6', name: 'Mosaic', categoryId: 'cat_hops', unit: 'Kg', format: 5, purchaseCost: 55, defaultSupplierId: 'sup_2' },
  { id: 'item_7', name: 'Simcoe', categoryId: 'cat_hops', unit: 'Kg', format: 5, purchaseCost: 52, defaultSupplierId: 'sup_2' },
  // Yeast
  { id: 'item_8', name: 'SafAle US-05', categoryId: 'cat_yeast', unit: 'g', format: 500, purchaseCost: 0.1, defaultSupplierId: 'sup_3' },
  // Finished Goods
  { id: 'item_9', name: 'American IPA 33cl Can', categoryId: 'cat_cans', unit: 'pcs', containerVolumeL: 0.33, salePrice: 2.5 },
  { id: 'item_10', name: 'American IPA 20L Keg', categoryId: 'cat_kegs', unit: 'pcs', containerVolumeL: 20, salePrice: 80 },
];

export const mockLocations: Location[] = [
    { id: 'loc_1', name: 'Raw Materials Warehouse', type: 'LocationType_Warehouse' },
    { id: 'loc_2', name: 'Finished Goods Warehouse', type: 'LocationType_Warehouse' },
    { id: 'loc_3', name: 'FV01', type: 'Tank', grossVolumeL: 1200 },
    { id: 'loc_4', name: 'FV02', type: 'Tank', grossVolumeL: 1200 },
    { id: 'loc_5', name: 'BT01', type: 'Tank', grossVolumeL: 1200 },
];

export const mockWarehouseItems: WarehouseItem[] = [
    { id: 'wh_1', masterItemId: 'item_1', lotNumber: 'WM-PILS-001', quantity: 500, locationId: 'loc_1', arrivalDate: '2023-10-01' },
    { id: 'wh_2', masterItemId: 'item_5', lotNumber: 'YCH-CIT-001', quantity: 10, locationId: 'loc_1', arrivalDate: '2023-10-01' },
    { id: 'wh_3', masterItemId: 'item_8', lotNumber: 'FER-US05-001', quantity: 1000, locationId: 'loc_1', arrivalDate: '2023-10-01' },
    { id: 'wh_4', masterItemId: 'item_9', lotNumber: '24001', quantity: 500, locationId: 'loc_2', arrivalDate: '2024-01-15' },
];

export const mockWarehouseMovements: WarehouseMovement[] = [
    { id: 'mov_1', timestamp: '2023-10-01T10:00:00Z', type: 'load', masterItemId: 'item_1', lotNumber: 'WM-PILS-001', quantity: 500, locationId: 'loc_1', documentNumber: 'DDT-123' },
    { id: 'mov_2', timestamp: '2023-10-01T10:00:00Z', type: 'load', masterItemId: 'item_5', lotNumber: 'YCH-CIT-001', quantity: 10, locationId: 'loc_1', documentNumber: 'DDT-456' },
    { id: 'mov_3', timestamp: '2024-01-15T14:00:00Z', type: 'load', masterItemId: 'item_9', lotNumber: '24001', quantity: 500, locationId: 'loc_2', documentNumber: 'PKG-24001' },
];

export const mockRecipes: Recipe[] = [
    {
        id: 'recipe_1',
        name: 'American IPA',
        style: 'IPA',
        shelfLifeDays: 180,
        qualityControlSpec: {
            og: { target: 14.5, min: 14.2, max: 14.8 },
            fg: { target: 2.5, min: 2.2, max: 2.8 },
            abv: { target: 6.5 },
            ibu: { target: 55 },
            liters: { target: 1000 },
            finalPh: { target: 4.3 },
            preFermentationPh: { target: 5.2 },
        },
        mashIngredients: [
            { id: 'mi_1', masterItemId: 'item_1', quantity: 200 },
            { id: 'mi_2', masterItemId: 'item_4', quantity: 20 },
        ],
        boilWhirlpoolIngredients: [
            { id: 'bwi_1', masterItemId: 'item_5', quantity: 1, type: 'Boil', timing: 60 },
            { id: 'bwi_2', masterItemId: 'item_6', quantity: 2, type: 'Whirlpool', timing: 20, temperature: 85 },
        ],
        tankIngredients: [
            { id: 'ti_1', masterItemId: 'item_8', quantity: 500, day: 0 },
            { id: 'ti_2', masterItemId: 'item_7', quantity: 3, day: 3 },
        ],
        packagingIngredients: [],
        mashSteps: [
            { id: 'ms_1', type: 'Infusion', temperature: 65, duration: 60 },
        ],
        fermentationSteps: [
            { id: 'fs_1', description: 'Primary Fermentation', temperature: 19, pressure: 0.8, days: 7 },
            { id: 'fs_2', description: 'Diacetyl Rest', temperature: 21, pressure: 0.8, days: 2 },
            { id: 'fs_3', description: 'Crash Cool', temperature: 2, pressure: 1.0, days: 3 },
        ],
        packagedItems: [
            { id: 'pi_1', masterItemId: 'item_9', packagingSplit: 50 },
            { id: 'pi_2', masterItemId: 'item_10', packagingSplit: 50 },
        ],
        processParameters: {
            mashWaterMainsL: 700, mashWaterMainsMicroSiemens: 400,
            mashWaterRoL: 100, mashWaterRoMicroSiemens: 20,
            spargeWaterL: 400, spargeWaterMicroSiemens: 200, spargeWaterPh: 5.8,
            maltMilling: 95, expectedMashPh: 5.3, expectedIodineTime: 60,
            transferDuration: 20, recirculationDuration: 15, filtrationDuration: 70,
            firstWortPlato: 18, firstWortPh: 5.2, lastWortPlato: 2, lastWortPh: 5.8,
            preBoilLiters: 1150, preBoilPlato: 12.5, preBoilPh: 5.2,
            postBoilLiters: 1050, postBoilPlato: 14.5, postBoilPh: 5.1,
            boilDuration: 60, whirlpoolDuration: 10, whirlpoolRestDuration: 20, coolingDuration: 30,
            packagingYield: 90,
        },
        additionalCosts: { other: 50 },
        notes: 'Classic West Coast IPA.'
    }
];

export const generateBrewSheetFromRecipe = (recipe: Recipe, cookDate: string, fermenterId: string, allBatches: BrewSheet[]): BrewSheet => {
    const currentYear = new Date(cookDate).getFullYear();
    const batchesThisYear = allBatches.filter(b => new Date(b.cookDate).getFullYear() === currentYear);
    const maxCookNumberThisYear = batchesThisYear.reduce((max, b) => Math.max(max, b.cookNumber), 0);
    const cookNumber = maxCookNumberThisYear + 1;
    
    const lot = `${currentYear.toString().slice(-2)}${cookNumber.toString().padStart(3, '0')}`;
    
    return {
        id: `batch_${Date.now()}`,
        recipeId: recipe.id,
        beerName: recipe.name,
        lot,
        cookNumber,
        cookDate,
        fermenterId,
        status: 'Planned',
        unloadStatus: { mash: false, boil: false, fermentation: false },
        mashLog: {
            expected: {
                ingredients: recipe.mashIngredients,
                steps: recipe.mashSteps,
                mashWaterMainsL: recipe.processParameters.mashWaterMainsL,
                mashWaterMainsMicroSiemens: recipe.processParameters.mashWaterMainsMicroSiemens,
                mashWaterRoL: recipe.processParameters.mashWaterRoL,
                mashWaterRoMicroSiemens: recipe.processParameters.mashWaterRoMicroSiemens,
                maltMilling: recipe.processParameters.maltMilling,
                mashPh: recipe.processParameters.expectedMashPh,
                expectedIodineTime: recipe.processParameters.expectedIodineTime,
            },
            actual: {
                ingredients: recipe.mashIngredients.map(ing => ({ id: ing.id, masterItemId: ing.masterItemId, lotAssignments: [] })),
                steps: recipe.mashSteps.map(step => ({ ...step })),
            }
        },
        lauterLog: {
            expected: {
                transferDuration: recipe.processParameters.transferDuration,
                recirculationDuration: recipe.processParameters.recirculationDuration,
                filtrationDuration: recipe.processParameters.filtrationDuration,
                firstWortPlato: recipe.processParameters.firstWortPlato,
                firstWortPh: recipe.processParameters.firstWortPh,
                lastWortPlato: recipe.processParameters.lastWortPlato,
                lastWortPh: recipe.processParameters.lastWortPh,
                spargeWaterL: recipe.processParameters.spargeWaterL,
                spargeWaterMicroSiemens: recipe.processParameters.spargeWaterMicroSiemens,
                spargeWaterPh: recipe.processParameters.spargeWaterPh,
            },
            actual: {}
        },
        boilLog: {
            expected: {
                ingredients: recipe.boilWhirlpoolIngredients,
                preBoilLiters: recipe.processParameters.preBoilLiters,
                preBoilPlato: recipe.processParameters.preBoilPlato,
                preBoilPh: recipe.processParameters.preBoilPh,
                postBoilLiters: recipe.processParameters.postBoilLiters,
                postBoilPlato: recipe.processParameters.postBoilPlato,
                postBoilPh: recipe.processParameters.postBoilPh,
                boilDuration: recipe.processParameters.boilDuration,
                whirlpoolDuration: recipe.processParameters.whirlpoolDuration,
                whirlpoolRestDuration: recipe.processParameters.whirlpoolRestDuration,
                coolingDuration: recipe.processParameters.coolingDuration,
            },
            actual: {
                ingredients: recipe.boilWhirlpoolIngredients.map(ing => ({ id: ing.id, masterItemId: ing.masterItemId, lotAssignments: [] })),
            }
        },
        fermentationLog: {
            expected: {
                steps: recipe.fermentationSteps,
                additions: recipe.tankIngredients,
            },
            actual: {
                additions: recipe.tankIngredients.map(ing => ({ id: ing.id, masterItemId: ing.masterItemId, lotAssignments: [] })),
                logEntries: []
            }
        },
        packagingLog: {
            packagedItems: recipe.packagedItems.map(pi => ({ id: pi.id, masterItemId: pi.masterItemId, quantityGood: 0 })),
            summaryExpectedLiters: recipe.qualityControlSpec.liters.target * (recipe.processParameters.packagingYield / 100),
        }
    };
};

export const mockBatches: BrewSheet[] = [
    generateBrewSheetFromRecipe(mockRecipes[0], new Date().toISOString().split('T')[0], 'loc_3', []),
];

mockBatches[0].status = 'Fermenting';

export const mockCustomers: Customer[] = [
    { id: 'cust_1', name: 'The Thirsty Monk Pub', email: 'orders@ttmp.com', address: '123 Beer St, Brewville' },
    { id: 'cust_2', name: 'Craft Beer Distributors Inc.', email: 'purchase@craftdist.com', address: '456 Hop Ave, City' },
];

export const mockOrders: Order[] = [
    { 
        id: 'ord_1', 
        customerId: 'cust_1', 
        orderNumber: 'PO-2024-001', 
        orderDate: '2024-07-15', 
        requiredDate: '2024-07-22',
        status: 'Confirmed',
        items: [
            { id: 'oi_1', masterItemId: 'item_10', quantity: 5, pricePerUnit: 80 },
        ],
        notes: 'Deliver after 2 PM.'
    }
];

export const mockBatchNumberingSettings: BatchNumberingSettings = {
    lotNumberSettings: {
        template: '{YY}{SEQ}',
        resetFrequency: 'yearly',
        sequenceDigits: 3,
    }
};

export const mockAdminSettings: AdministrationSettings = {
    annualManpowerCost: 50000,
    annualGasCost: 10000,
    annualRentCost: 24000,
    annualWaterCost: 5000,
    annualDetergentsCost: 3000,
    annualCo2Cost: 2000,
    exciseDutyRate: 2.99,
    annualBatches: 100,
};

export const mockCustomerPriceLists: CustomerPriceList[] = [
    {
        id: 'cpl_1',
        customerId: 'cust_1',
        globalDiscountPercent: 5,
        itemDiscounts: [],
    }
];

export const mockTransportDocuments: TransportDocument[] = [];