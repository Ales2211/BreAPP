
import { Recipe, BrewSheet, Category, MasterItem, WarehouseItem, Location, Supplier, Customer, Order, Ingredient, BoilWhirlpoolIngredient, TankIngredient, MashStep } from "../types";

export const mockLocations: Location[] = [
    // Brewhouse
    { id: 'loc_turn_1', name: '15bbl Turn 1', type: 'Tank' },
    { id: 'loc_turn_2', name: '15bbl Turn 2', type: 'Tank' },
    { id: 'loc_turn_3', name: '15bbl Turn 3', type: 'Tank' },
    { id: 'loc_turn_4', name: '15bbl Turn 4', type: 'Tank' },
    // Fermenters
    { id: 'loc_fv_1', name: '15bbl FV 1', type: 'Tank' },
    { id: 'loc_fv_2', name: '30bbl FV 2', type: 'Tank' },
    { id: 'loc_fv_3', name: '30bbl FV 3', type: 'Tank' },
    { id: 'loc_fv_4', name: '45bbl FV 4', type: 'Tank' },
    { id: 'loc_fv_5', name: '45bbl FV 5', type: 'Tank' },
    { id: 'loc_fv_6', name: '60bbl FV 6', type: 'Tank' },
    { id: 'loc_fv_7', name: '60bbl FV 7', type: 'Tank' },
    // Bright Tanks
    { id: 'loc_bbt_1', name: '30bbl BT 1', type: 'Tank' },
    { id: 'loc_bbt_2', name: '60bbl BT 2', type: 'Tank' },
    { id: 'loc_bbt_3', name: '60bbl BT 3', type: 'Tank' },
    // Packaging
    { id: 'loc_pkg_1', name: 'Packaging', type: 'Tank' },
    // Warehouses
    // Fix: Changed location type to be specific to avoid translation key conflicts.
    { id: 'loc_wh_raw', name: 'M1 - Raw Materials', type: 'LocationType_Warehouse' },
    { id: 'loc_wh_cold', name: 'M2 - Cold Storage', type: 'LocationType_Warehouse' },
    { id: 'loc_wh_pack', name: 'M3 - Packaging', type: 'LocationType_Warehouse' },
    { id: 'loc_wh_finished', name: 'M4 - Finished Goods', type: 'LocationType_Warehouse' },
    // Other
    // Fix: Changed location type to be specific to avoid translation key conflicts.
    { id: 'loc_other_lab', name: 'Lab', type: 'LocationType_Other' },
];

export const mockSuppliers: Supplier[] = [
    { id: 'sup_mr_malt', name: 'Mr. Malt', website: 'https://www.mr-malt.it' },
    { id: 'sup_bioenologia', name: 'Bioenologia' },
    { id: 'sup_adm_vetro', name: 'ADM Vetro' },
    { id: 'sup_white_labs', name: 'White Labs' },
    { id: 'sup_corimpex', name: 'Corimpex' },
    { id: 'sup_italian_hops', name: 'Italian Hops Company' },
    { id: 'sup_uberti', name: 'Uberti' },
    { id: 'sup_polsinelli', name: 'Polsinelli Enologia', website: 'https://www.polsinelli.it' },
    { id: 'sup_ych', name: 'Yakima Chief Hops', website: 'https://www.yakimachief.com' },
];

export const mockCategories: Category[] = [
    // Parent Categories
    { id: 'cat_rm', name: 'Raw Materials' },
    { id: 'cat_fg', name: 'Finished Goods' },
    
    // Raw Materials Sub-categories
    { id: 'cat_malt', name: 'Malt', parentCategoryId: 'cat_rm' },
    { id: 'cat_hops', name: 'Hops', parentCategoryId: 'cat_rm' },
    { id: 'cat_yeast', name: 'Yeast', parentCategoryId: 'cat_rm' },
    { id: 'cat_spices', name: 'Spices', parentCategoryId: 'cat_rm' },
    { id: 'cat_adjunct', name: 'Adjunct', parentCategoryId: 'cat_rm' },
    { id: 'cat_sugar', name: 'Sugar', parentCategoryId: 'cat_rm' },
    { id: 'cat_packaging', name: 'Category_Packaging', parentCategoryId: 'cat_rm' }, // Packaging materials
    { id: 'cat_other', name: 'Category_Other', parentCategoryId: 'cat_rm' },
    
    // Finished Goods Sub-categories
    { id: 'cat_cans', name: 'Cans', parentCategoryId: 'cat_fg' },
    { id: 'cat_kegs', name: 'Kegs', parentCategoryId: 'cat_fg' },
    { id: 'cat_bottles', name: 'Bottles', parentCategoryId: 'cat_fg' },
];

export const mockMasterItems: MasterItem[] = [
    // Malts
    { id: 'item_1', name: 'Malto BEST Pilsen', categoryId: 'cat_malt', unit: 'Kg', format: 25, defaultSupplierId: 'sup_mr_malt', purchaseCost: 0.91 },
    { id: 'item_2', name: 'Malto BEST Pale Ale', categoryId: 'cat_malt', unit: 'Kg', format: 25, defaultSupplierId: 'sup_mr_malt', purchaseCost: 0.95 },
    { id: 'item_3', name: 'Malto BEST Chit', categoryId: 'cat_malt', unit: 'Kg', format: 25, defaultSupplierId: 'sup_mr_malt', purchaseCost: 1.19 },
    { id: 'item_4', name: 'Fiocchi di frumento', categoryId: 'cat_malt', unit: 'Kg', format: 15, defaultSupplierId: 'sup_mr_malt', purchaseCost: 1.26 },
    { id: 'item_5', name: 'Fiocchi d\'avena (oats)', categoryId: 'cat_malt', unit: 'Kg', format: 15, defaultSupplierId: 'sup_mr_malt', purchaseCost: 1.21 },
    { id: 'item_6', name: 'Zucchero destrosio monoidratato SB', categoryId: 'cat_malt', unit: 'Kg', format: 25, defaultSupplierId: 'sup_mr_malt', purchaseCost: 2.38 },
    { id: 'item_7', name: 'Malto BEST Munich', categoryId: 'cat_malt', unit: 'Kg', format: 25, defaultSupplierId: 'sup_mr_malt', purchaseCost: 1.05 },
    { id: 'item_8', name: 'Malto Best Munich Dark', categoryId: 'cat_malt', unit: 'Kg', format: 25, defaultSupplierId: 'sup_mr_malt', purchaseCost: 1.13 },
    { id: 'item_9', name: 'Malto Simpsons Crystal Extra Dark', categoryId: 'cat_malt', unit: 'Kg', format: 25, defaultSupplierId: 'sup_mr_malt', purchaseCost: 1.44 },
    { id: 'item_10', name: 'Malto Dingemans Pilsner', categoryId: 'cat_malt', unit: 'Kg', format: 25, defaultSupplierId: 'sup_mr_malt', purchaseCost: 0.91 },
    { id: 'item_11', name: 'Candimic light 73', categoryId: 'cat_malt', unit: 'Kg', format: 25, defaultSupplierId: 'sup_mr_malt', purchaseCost: 2.04 },
    { id: 'item_12', name: 'Malto BEST Wheat', categoryId: 'cat_malt', unit: 'Kg', format: 25, defaultSupplierId: 'sup_mr_malt', purchaseCost: 1.09 },
    { id: 'item_13', name: 'Malto Fawcett Brown', categoryId: 'cat_malt', unit: 'Kg', format: 25, defaultSupplierId: 'sup_mr_malt', purchaseCost: 1.55 },
    { id: 'item_14', name: 'Malto Fawcett Chocolate', categoryId: 'cat_malt', unit: 'Kg', format: 25, defaultSupplierId: 'sup_mr_malt', purchaseCost: 1.65 },
    { id: 'item_15', name: 'Malto Fawcett Crystal', categoryId: 'cat_malt', unit: 'Kg', format: 25, defaultSupplierId: 'sup_mr_malt', purchaseCost: 1.53 },
    { id: 'item_16', name: 'Malto Dingemans Rye', categoryId: 'cat_malt', unit: 'Kg', format: 25, defaultSupplierId: 'sup_mr_malt', purchaseCost: 1.25 },
    { id: 'item_17', name: 'VIENNA BEST MALZ', categoryId: 'cat_malt', unit: 'Kg', format: 25, defaultSupplierId: 'sup_mr_malt', purchaseCost: 1.10 },
    { id: 'item_18', name: 'FIOCCHI DI FRUMENTO', categoryId: 'cat_malt', unit: 'Kg', format: 15, defaultSupplierId: 'sup_mr_malt', purchaseCost: 1.27 },
    { id: 'item_19', name: 'CARA HELL BEST MALZ', categoryId: 'cat_malt', unit: 'Kg', format: 20, defaultSupplierId: 'sup_mr_malt', purchaseCost: 1.27 },
    { id: 'item_20', name: 'Fiocchi d\'orzo', categoryId: 'cat_malt', unit: 'Kg', format: 15, defaultSupplierId: 'sup_mr_malt', purchaseCost: 1.38 },
    { id: 'item_21', name: 'Malto Weyermann® CaraPils®', categoryId: 'cat_malt', unit: 'Kg', format: 25, defaultSupplierId: 'sup_mr_malt', purchaseCost: 1.65 },
    { id: 'item_22', name: 'Malto Best A-XL', categoryId: 'cat_malt', unit: 'Kg', format: 25, defaultSupplierId: 'sup_mr_malt', purchaseCost: 1.15 },
    { id: 'item_23', name: 'Malto Simpsons Crystal Medium', categoryId: 'cat_malt', unit: 'Kg', format: 25, defaultSupplierId: 'sup_mr_malt', purchaseCost: 1.25 },
    { id: 'item_24', name: 'Malto Simpsons Chocolate', categoryId: 'cat_malt', unit: 'Kg', format: 25, defaultSupplierId: 'sup_mr_malt', purchaseCost: 1.58 },
    { id: 'item_25', name: 'Malto Simpsons Finest Pale Ale Maris Otter', categoryId: 'cat_malt', unit: 'Kg', format: 25, defaultSupplierId: 'sup_mr_malt', purchaseCost: 1.30 },
    { id: 'item_26', name: 'Malto Simpsons Cornish Gold', categoryId: 'cat_malt', unit: 'Kg', format: 25, defaultSupplierId: 'sup_mr_malt', purchaseCost: 1.42 },
    { id: 'item_27', name: 'Malto Simpsons Pale Chocolate', categoryId: 'cat_malt', unit: 'Kg', format: 25, defaultSupplierId: 'sup_mr_malt', purchaseCost: 1.62 },
    { id: 'item_28', name: 'Malto Simpsons Imperial', categoryId: 'cat_malt', unit: 'Kg', format: 25, defaultSupplierId: 'sup_mr_malt', purchaseCost: 1.16 },
    { id: 'item_29', name: 'Malto Simpsons Golden Naked Oats®', categoryId: 'cat_malt', unit: 'Kg', format: 25, defaultSupplierId: 'sup_mr_malt', purchaseCost: 1.60 },
    { id: 'item_30', name: 'Malto Best Caramel® Pils', categoryId: 'cat_malt', unit: 'Kg', format: 25, defaultSupplierId: 'sup_mr_malt', purchaseCost: 1.12 },
    { id: 'item_31', name: 'Malto Weyermann® Eraclea Pilsner Malt', categoryId: 'cat_malt', unit: 'Kg', format: 25, defaultSupplierId: 'sup_uberti', purchaseCost: 1.22 },
    
    // Hops
    { id: 'item_32', name: 'Luppolo T90 Citra® Y', categoryId: 'cat_hops', unit: 'Kg', format: 5, defaultSupplierId: 'sup_mr_malt', purchaseCost: 33.20 },
    { id: 'item_33', name: 'Luppolo T90 Ekuanot® Y', categoryId: 'cat_hops', unit: 'Kg', format: 5, defaultSupplierId: 'sup_mr_malt', purchaseCost: 20.00 },
    { id: 'item_34', name: 'Luppolo T90 Galaxy', categoryId: 'cat_hops', unit: 'Kg', format: 5, defaultSupplierId: 'sup_mr_malt', purchaseCost: 41.80 },
    { id: 'item_35', name: 'Luppolo T90 Hallertau Mittelfrueh S', categoryId: 'cat_hops', unit: 'Kg', format: 5, defaultSupplierId: 'sup_mr_malt', purchaseCost: 18.90 },
    { id: 'item_36', name: 'Luppolo T90 Tettnang Tettnanger S', categoryId: 'cat_hops', unit: 'Kg', format: 5, defaultSupplierId: 'sup_mr_malt', purchaseCost: 17.20 },
    { id: 'item_37', name: 'Luppolo T90 Saaz S', categoryId: 'cat_hops', unit: 'Kg', format: 5, defaultSupplierId: 'sup_mr_malt', purchaseCost: 20.50 },
    { id: 'item_38', name: 'Luppolo T90 Hallertau Magnum S', categoryId: 'cat_hops', unit: 'Kg', format: 5, defaultSupplierId: 'sup_mr_malt', purchaseCost: 13.50 },
    { id: 'item_39', name: 'Luppolo T90 Simcoe® Y', categoryId: 'cat_hops', unit: 'Kg', format: 5, defaultSupplierId: 'sup_mr_malt', purchaseCost: 32.20 },
    { id: 'item_40', name: 'Luppolo T90 Columbus Y', categoryId: 'cat_hops', unit: 'Kg', format: 5, defaultSupplierId: 'sup_mr_malt', purchaseCost: 19.20 },
    { id: 'item_41', name: 'Luppolo T90 Mosaic® Y', categoryId: 'cat_hops', unit: 'Kg', format: 5, defaultSupplierId: 'sup_mr_malt', purchaseCost: 31.50 },
    { id: 'item_42', name: 'Luppolo T90 Chinook Y', categoryId: 'cat_hops', unit: 'Kg', format: 5, defaultSupplierId: 'sup_mr_malt', purchaseCost: 21.90 },
    { id: 'item_43', name: 'Luppolo T90 Cascade Y', categoryId: 'cat_hops', unit: 'Kg', format: 5, defaultSupplierId: 'sup_mr_malt', purchaseCost: 21.80 },
    { id: 'item_44', name: 'Luppolo T90 Centennial Y', categoryId: 'cat_hops', unit: 'Kg', format: 5, defaultSupplierId: 'sup_mr_malt', purchaseCost: 26.90 },
    { id: 'item_45', name: 'Luppolo T90 Hallertau Saphir S', categoryId: 'cat_hops', unit: 'Kg', format: 5, defaultSupplierId: 'sup_mr_malt', purchaseCost: 14.00 },
    { id: 'item_46', name: 'Cryo Hops® pellets Mosaic®', categoryId: 'cat_hops', unit: 'Kg', format: 5, defaultSupplierId: 'sup_mr_malt', purchaseCost: 74.80 },
    { id: 'item_47', name: 'Cryo Hops® pellets Simcoe®', categoryId: 'cat_hops', unit: 'Kg', format: 5, defaultSupplierId: 'sup_mr_malt', purchaseCost: 74.80 },
    { id: 'item_48', name: 'Luppolo Yakima Chief Hops® Krush™ (HBC 586)', categoryId: 'cat_hops', unit: 'Kg', format: 5, defaultSupplierId: 'sup_mr_malt', purchaseCost: 36.20 },
    { id: 'item_49', name: 'Cryo Hops® pellets Idaho 7®', categoryId: 'cat_hops', unit: 'Kg', format: 5, defaultSupplierId: 'sup_mr_malt', purchaseCost: 61.80 },
    { id: 'item_50', name: 'Luppolo T90 El Dorado® F', categoryId: 'cat_hops', unit: 'Kg', format: 5, defaultSupplierId: 'sup_mr_malt', purchaseCost: 28.90 },
    { id: 'item_51', name: 'Cryo Hops® pellets Citra®', categoryId: 'cat_hops', unit: 'Kg', format: 5, defaultSupplierId: 'sup_mr_malt', purchaseCost: 75.60 },
    { id: 'item_52', name: 'Luppolo T90 Styrian Golding', categoryId: 'cat_hops', unit: 'Kg', format: 5, defaultSupplierId: 'sup_mr_malt', purchaseCost: 14.40 },
    { id: 'item_53', name: 'Luppolo T90 Idaho 7® Y', categoryId: 'cat_hops', unit: 'Kg', format: 5, defaultSupplierId: 'sup_mr_malt', purchaseCost: 20.50 },
    { id: 'item_54', name: 'Luppolo T90 Loral Y', categoryId: 'cat_hops', unit: 'Kg', format: 5, defaultSupplierId: 'sup_mr_malt', purchaseCost: 26.40 },
    { id: 'item_55', name: 'Luppolo T90 Rakau Y', categoryId: 'cat_hops', unit: 'Kg', format: 5, defaultSupplierId: 'sup_mr_malt', purchaseCost: 32.60 },
    { id: 'item_56', name: 'Luppolo T90 Wai-iti F', categoryId: 'cat_hops', unit: 'Kg', format: 5, defaultSupplierId: 'sup_mr_malt', purchaseCost: 37.80 },
    { id: 'item_57', name: 'Cryo Hops® pellets Wai-iti™ Y', categoryId: 'cat_hops', unit: 'Kg', format: 5, defaultSupplierId: 'sup_mr_malt', purchaseCost: 88.20 },
    { id: 'item_58', name: 'HALLERTAUER TRADITION', categoryId: 'cat_hops', unit: 'Kg', format: 5, defaultSupplierId: 'sup_mr_malt', purchaseCost: 15.80 },
    { id: 'item_59', name: 'Luppolo Nectaron® - Pellets T90', categoryId: 'cat_hops', unit: 'Kg', format: 5, defaultSupplierId: 'sup_mr_malt', purchaseCost: 45.40 },
    { id: 'item_60', name: 'Estratto di luppolo in CO2 YCH HyperBoost™ Citra®', categoryId: 'cat_hops', unit: 'Kg', format: 0.1, defaultSupplierId: 'sup_mr_malt', purchaseCost: 3843.00 },
    { id: 'item_61', name: 'Estratto di luppolo in Co2 Herkules', categoryId: 'cat_hops', unit: 'pcs', format: 1, defaultSupplierId: 'sup_mr_malt', purchaseCost: 13.80 },
    { id: 'item_62', name: 'Luppolo Y Talus® - Pellets T90', categoryId: 'cat_hops', unit: 'Kg', format: 5, defaultSupplierId: 'sup_mr_malt', purchaseCost: 34.20 },
    { id: 'item_63', name: 'Luppolo Perle (Hallertau) - Pellets T90', categoryId: 'cat_hops', unit: 'Kg', format: 5, defaultSupplierId: 'sup_mr_malt', purchaseCost: 16.20 },
    { id: 'item_64', name: 'Luppolo Vic Secret™ - Pellets T90', categoryId: 'cat_hops', unit: 'Kg', format: 5, defaultSupplierId: 'sup_mr_malt', purchaseCost: 41.80 },
    { id: 'item_65', name: 'Luppolo Superdelic™ - Pellets T90', categoryId: 'cat_hops', unit: 'Kg', format: 5, defaultSupplierId: 'sup_mr_malt', purchaseCost: 45.20 },
    { id: 'item_66', name: 'Estratto di luppolo in CO2 YCH HyperBoost™ Mosaic®', categoryId: 'cat_hops', unit: 'Kg', format: 1, defaultSupplierId: 'sup_mr_malt', purchaseCost: 3518.00 },
    { id: 'item_67', name: 'Estratto di luppolo in CO2 YCH DynaBoost™ Idaho 7®', categoryId: 'cat_hops', unit: 'Kg', format: 1, defaultSupplierId: 'sup_mr_malt', purchaseCost: 289.10 },
    { id: 'item_68', name: 'Estratto di luppolo in CO2 YCH HyperBoost™ Idaho 7®', categoryId: 'cat_hops', unit: 'Kg', format: 0.1, defaultSupplierId: 'sup_mr_malt', purchaseCost: 3202.00 },
    { id: 'item_69', name: 'Estratto di luppolo in CO2 YCH HyperBoost™ Krush®', categoryId: 'cat_hops', unit: 'Kg', format: 0.1, defaultSupplierId: 'sup_mr_malt', purchaseCost: 3979.00 },
    { id: 'item_70', name: 'Yakima Chief Hops® Cryo Hops® pellets Krush™', categoryId: 'cat_hops', unit: 'Kg', format: 5, defaultSupplierId: 'sup_mr_malt', purchaseCost: 79.80 },
    { id: 'item_71', name: 'Tettnanger - Locher-hopfen', categoryId: 'cat_hops', unit: 'Kg', format: 5, defaultSupplierId: 'sup_italian_hops', purchaseCost: 3.98 },
    { id: 'item_72', name: 'Mittelfruh - Locher-hopfen', categoryId: 'cat_hops', unit: 'Kg', format: 5, defaultSupplierId: 'sup_italian_hops', purchaseCost: 3.98 },
    { id: 'item_73', name: 'S. Select - Locher-hopfen', categoryId: 'cat_hops', unit: 'Kg', format: 5, defaultSupplierId: 'sup_italian_hops', purchaseCost: 0.00 },
    { id: 'item_74', name: 'Saphir - Locher-hopfen', categoryId: 'cat_hops', unit: 'Kg', format: 5, defaultSupplierId: 'sup_italian_hops', purchaseCost: 16.50 },
    { id: 'item_75', name: 'Amarillo - Crosby hops', categoryId: 'cat_hops', unit: 'Kg', format: 5, defaultSupplierId: 'sup_italian_hops', purchaseCost: 29.80 },
    { id: 'item_76', name: 'Centennial - Crosby hops', categoryId: 'cat_hops', unit: 'Kg', format: 5, defaultSupplierId: 'sup_italian_hops', purchaseCost: 22.90 },
    { id: 'item_77', name: 'Idaho 7 - Crosby hops', categoryId: 'cat_hops', unit: 'Kg', format: 5, defaultSupplierId: 'sup_italian_hops', purchaseCost: 29.80 },
    { id: 'item_78', name: 'St. Golding - Rojnik hops', categoryId: 'cat_hops', unit: 'Kg', format: 5, defaultSupplierId: 'sup_italian_hops', purchaseCost: 16.50 },
    { id: 'item_79', name: 'Rakau - Clayton hops', categoryId: 'cat_hops', unit: 'Kg', format: 5, defaultSupplierId: 'sup_italian_hops', purchaseCost: 36.50 },
    { id: 'item_80', name: 'Chinook - Crosby hops', categoryId: 'cat_hops', unit: 'Kg', format: 5, defaultSupplierId: 'sup_italian_hops', purchaseCost: 22.50 },
    { id: 'item_81', name: 'Yakima Chief Hops® Cryo Hops® pellets Nectaron®', categoryId: 'cat_hops', unit: 'Kg', format: 5, defaultSupplierId: 'sup_mr_malt', purchaseCost: 94.75 },

    // Yeasts
    { id: 'item_82', name: 'SafAle US-05', categoryId: 'cat_yeast', unit: 'Kg', format: 0.5, defaultSupplierId: 'sup_mr_malt', purchaseCost: 87.98 },
    { id: 'item_83', name: 'SafAle W-34/70', categoryId: 'cat_yeast', unit: 'Kg', format: 0.5, defaultSupplierId: 'sup_mr_malt', purchaseCost: 137.24 },
    { id: 'item_84', name: 'Atecream Trappist HG', categoryId: 'cat_yeast', unit: 'Kg', format: 1, defaultSupplierId: 'sup_bioenologia', purchaseCost: 65.27 },
    { id: 'item_85', name: 'Atecream BF Saison', categoryId: 'cat_yeast', unit: 'Kg', format: 1, defaultSupplierId: 'sup_bioenologia', purchaseCost: 63.13 },
    { id: 'item_86', name: 'Atecream Ale 05', categoryId: 'cat_yeast', unit: 'Kg', format: 1, defaultSupplierId: 'sup_bioenologia', purchaseCost: 52.97 },
    { id: 'item_87', name: 'Atecream LG 37', categoryId: 'cat_yeast', unit: 'Kg', format: 1, defaultSupplierId: 'sup_bioenologia', purchaseCost: 59.92 },
    { id: 'item_88', name: 'Atecream LN3', categoryId: 'cat_yeast', unit: 'Kg', format: 1, defaultSupplierId: 'sup_bioenologia', purchaseCost: 77.40 },
    { id: 'item_89', name: 'Atecream Green Mountain', categoryId: 'cat_yeast', unit: 'Kg', format: 1, defaultSupplierId: 'sup_bioenologia', purchaseCost: 88.81 },
    { id: 'item_90', name: 'Ateflow London ESB', categoryId: 'cat_yeast', unit: 'Kg', format: 10, defaultSupplierId: 'sup_bioenologia', purchaseCost: 24.07 },
    { id: 'item_91', name: 'WLP940-O-2L - Organic Mexican Lager Yeast', categoryId: 'cat_yeast', unit: 'Kg', format: 2, defaultSupplierId: 'sup_white_labs', purchaseCost: 175.50 },
    { id: 'item_92', name: 'WLP067-O-2L - Organic Coastal Haze Ale Yeast Blend', categoryId: 'cat_yeast', unit: 'Kg', format: 2, defaultSupplierId: 'sup_white_labs', purchaseCost: 175.50 },
    { id: 'item_93', name: 'LONA® LALBREW', categoryId: 'cat_yeast', unit: 'Kg', format: 0.5, defaultSupplierId: 'sup_corimpex', purchaseCost: 290.00 },
    { id: 'item_94', name: 'Lievito WHC Lab Saturated', categoryId: 'cat_yeast', unit: 'g', format: 500, defaultSupplierId: 'sup_corimpex', purchaseCost: 107.28 },
    { id: 'item_95', name: 'Atecrem Ale BW', categoryId: 'cat_yeast', unit: 'Kg', format: 1, defaultSupplierId: 'sup_bioenologia', purchaseCost: 61.62 },

    // Adjuncts & Others
    { id: 'item_96', name: 'Acido Lattico 80% E270', categoryId: 'cat_other', unit: 'Kg', format: 25, defaultSupplierId: 'sup_mr_malt', purchaseCost: 4.68 },
    { id: 'item_97', name: 'Gypsum solfato di calcio E516 CC', categoryId: 'cat_other', unit: 'Kg', format: 25, defaultSupplierId: 'sup_mr_malt', purchaseCost: 1.70 },
    { id: 'item_98', name: 'Cloruro di calcio E509 CC', categoryId: 'cat_other', unit: 'Kg', format: 25, defaultSupplierId: 'sup_mr_malt', purchaseCost: 2.26 },
    { id: 'item_99', name: 'Yeast - Vit', categoryId: 'cat_other', unit: 'Kg', format: 1, defaultSupplierId: 'sup_mr_malt', purchaseCost: 14.30 },
    { id: 'item_100', name: 'Super F', categoryId: 'cat_other', unit: 'Kg', format: 5, defaultSupplierId: 'sup_mr_malt', purchaseCost: 10.10 },
    { id: 'item_101', name: 'Calcio carbonato naturale E170', categoryId: 'cat_other', unit: 'Kg', format: 1, defaultSupplierId: 'sup_mr_malt', purchaseCost: 4.34 },
    { id: 'item_102', name: 'Brewers Clarity', categoryId: 'cat_other', unit: 'Kg', format: 1, defaultSupplierId: 'sup_mr_malt', purchaseCost: 268.50 },
    { id: 'item_103', name: 'Oak Cubes Whisky', categoryId: 'cat_other', unit: 'g', format: 250, defaultSupplierId: 'sup_mr_malt', purchaseCost: 30.00 },
    { id: 'item_104', name: 'Malto Simpsons Malted Oats', categoryId: 'cat_other', unit: 'Kg', format: 25, defaultSupplierId: 'sup_mr_malt', purchaseCost: 1.19 },
    { id: 'item_105', name: 'Super F', categoryId: 'cat_other', unit: 'Kg', format: 25, defaultSupplierId: 'sup_mr_malt', purchaseCost: 7.53 },

    // Packaging
    { id: 'item_106', name: 'Lattina nera Sleek 33 cl Crown', categoryId: 'cat_packaging', unit: 'pcs', format: 7084, defaultSupplierId: 'sup_adm_vetro', purchaseCost: 0.14 },
    { id: 'item_107', name: 'Coperchio Lattine nero Crown', categoryId: 'cat_packaging', unit: 'pcs', format: 7680, defaultSupplierId: 'sup_adm_vetro', purchaseCost: 0.027 },
    { id: 'item_108', name: 'PolyKeg® PRO baionetta It 24 valvola 4.0', categoryId: 'cat_packaging', unit: 'pcs', format: 1, defaultSupplierId: 'sup_mr_malt', purchaseCost: 11.15 },
    { id: 'item_109', name: 'Sigillo Fusto Polykeg® Neutro', categoryId: 'cat_packaging', unit: 'pcs', format: 264, defaultSupplierId: 'sup_mr_malt', purchaseCost: 0.14 },
    { id: 'item_110', name: 'Lattina nera Sleek 33 cl Ball', categoryId: 'cat_packaging', unit: 'pcs', format: 6048, purchaseCost: 0.16 },
    { id: 'item_111', name: 'Coperchio Lattine nero Ball', categoryId: 'cat_packaging', unit: 'pcs', format: 6175, purchaseCost: 0.00 },
    { id: 'item_112', name: 'ETICHETTA VARIGRAFICA', categoryId: 'cat_packaging', unit: 'pcs', format: 1, purchaseCost: 0.25 },

    // Finished Goods - Preserved from original list
    { id: 'item_pkg_apa_can_fg', name: 'Finished Good - APA Can 44cl', categoryId: 'cat_cans', unit: 'pcs', salePrice: 2.5, containerVolumeL: 0.44 },
    { id: 'item_pkg_wit_keg_fg', name: 'Finished Good - Wit Keg 24L', categoryId: 'cat_kegs', unit: 'pcs', salePrice: 80.0, containerVolumeL: 24.0 },
    { id: 'item_pkg_neipa_can_fg', name: 'Finished Good - NEIPA Can 44cl', categoryId: 'cat_cans', unit: 'pcs', salePrice: 3.2, containerVolumeL: 0.44 },
];

const today = new Date();
const getPastDate = (days: number) => new Date(today.getTime() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
const getFutureDate = (days: number) => new Date(today.getTime() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

export const mockCustomers: Customer[] = [
    { id: 'cust1', name: 'The Thirsty Monk Pub', vatNumber: 'IT12345678901', address: 'Via Roma 1, 00100 Rome', email: 'orders@thirsty.monk', phone: '06 1234567' },
    { id: 'cust2', name: 'Craft Beer Corner', vatNumber: 'IT09876543210', address: 'Piazza Duomo 10, 20121 Milan', email: 'buy@craftcorner.it', phone: '02 9876543' },
    { id: 'cust3', name: 'Birroteca Almaluppolo', vatNumber: 'IT56473829101', address: 'Via Verdi 5, 50122 Florence', email: 'info@almaluppolo.com' },
];

export const mockOrders: Order[] = [
    { 
        id: 'order1',
        customerId: 'cust1',
        orderNumber: '2024-001',
        orderDate: getPastDate(10),
        requiredDate: getPastDate(3),
        status: 'Completed',
        items: [
            { id: 'oi1', masterItemId: 'item_pkg_apa_can_fg', quantity: 120, pricePerUnit: 2.50 },
            { id: 'oi2', masterItemId: 'item_pkg_neipa_can_fg', quantity: 96, pricePerUnit: 3.20 },
        ],
        notes: 'Please deliver in the morning.'
    },
    {
        id: 'order2',
        customerId: 'cust2',
        orderNumber: '2024-002',
        orderDate: getPastDate(5),
        requiredDate: getFutureDate(2),
        status: 'Confirmed',
        items: [
            { id: 'oi3', masterItemId: 'item_pkg_wit_keg_fg', quantity: 5, pricePerUnit: 80.0 },
        ],
    },
    {
        id: 'order3',
        customerId: 'cust1',
        orderNumber: '2024-003',
        orderDate: getPastDate(1),
        requiredDate: getFutureDate(7),
        status: 'Draft',
        items: [
             { id: 'oi4', masterItemId: 'item_pkg_neipa_can_fg', quantity: 240, pricePerUnit: 3.10 },
        ],
        notes: 'Waiting for confirmation on final quantity.'
    }
];


export const mockRecipes: Recipe[] = [
    {
        id: 'recipe1',
        name: 'American Pale Ale',
        style: 'APA',
        qualityControlSpec: {
            og: { target: 12.5, min: 12.3, max: 12.7 },
            fg: { target: 2.5, min: 2.3, max: 2.7 },
            abv: { target: 5.5, min: 5.3, max: 5.7 },
            ibu: { target: 40, min: 38, max: 42 },
            liters: { target: 20 },
            finalPh: { target: 4.5, min: 4.4, max: 4.6 }
        },
        shelfLifeDays: 120,
        mashIngredients: [
            { id: 'mi1', masterItemId: 'item_1', quantity: 4.5 },
            { id: 'mi2', masterItemId: 'item_7', quantity: 0.5 },
            { id: 'mi3', masterItemId: 'item_98', quantity: 0.005 },
        ],
        boilWhirlpoolIngredients: [
            { id: 'bwi1', masterItemId: 'item_43', quantity: 0.03, type: 'Boil', timing: 60 },
            { id: 'bwi3', masterItemId: 'item_32', quantity: 0.05, type: 'Whirlpool', timing: 0, temperature: 85 },
        ],
        tankIngredients: [
            { id: 'ti1', masterItemId: 'item_82', quantity: 0.011, day: 0 },
            { id: 'ti2', masterItemId: 'item_32', quantity: 0.05, day: 7 }, // Dry hop day 7
        ],
        mashSteps: [ { id: 'ms1', temperature: 65, duration: 60, type: 'Infusion' }, ],
        fermentationSteps: [
            { id: 'fs1', description: 'Primary Fermentation', temperature: 18, pressure: 0, days: 7 },
            { id: 'fs2', description: 'Dry Hop', temperature: 18, pressure: 0, days: 4 },
            { id: 'fs3', description: 'Cold Crash', temperature: 2, pressure: 0.8, days: 3 },
        ],
        processParameters: {
            mashWaterMainsL: 15, mashWaterMainsMicroSiemens: 200, mashWaterRoL: 5, mashWaterRoMicroSiemens: 10,
            spargeWaterL: 12, spargeWaterMicroSiemens: 150, spargeWaterPh: 5.8, maltMilling: 88, expectedMashPh: 5.3, expectedIodineTime: 60,
            transferDuration: 15, recirculationDuration: 15, filtrationDuration: 60, firstWortPlato: 14, firstWortPh: 5.4,
            lastWortPlato: 4, lastWortPh: 5.8, preBoilLiters: 25, preBoilPlato: 11.5, preBoilPh: 5.2,
            postBoilLiters: 21, postBoilPlato: 12.5, postBoilPh: 5.1, boilDuration: 60, whirlpoolDuration: 15, whirlpoolRestDuration: 15, coolingDuration: 25,
        },
        packagedItems: [{ id: 'pkg1', masterItemId: 'item_pkg_apa_can_fg' }],
        notes: 'Classic APA with a modern hop twist.'
    },
    {
        id: 'recipe2',
        name: 'Belgian Wit',
        style: 'Witbier',
        qualityControlSpec: {
            og: { target: 12.0, min: 11.8, max: 12.2 },
            fg: { target: 2.0, min: 1.8, max: 2.2 },
            abv: { target: 5.2, min: 5.0, max: 5.4 },
            ibu: { target: 15, min: 13, max: 17 },
            liters: { target: 20 },
        },
        shelfLifeDays: 180,
        mashIngredients: [
            { id: 'mi1', masterItemId: 'item_1', quantity: 2.2 },
            { id: 'mi2', masterItemId: 'item_12', quantity: 2.2 },
            { id: 'mi3', masterItemId: 'item_5', quantity: 0.6 },
        ],
        boilWhirlpoolIngredients: [
            { id: 'bwi1', masterItemId: 'item_37', quantity: 0.025, type: 'Boil', timing: 60 },
        ],
        tankIngredients: [ { id: 'ti1', masterItemId: 'item_85', quantity: 0.02, day: 0 }, ],
        mashSteps: [ { id: 'ms1', temperature: 68, duration: 60, type: 'Infusion' }, ],
        fermentationSteps: [
            { id: 'fs1', description: 'Primary Fermentation', temperature: 20, pressure: 0, days: 12 },
            { id: 'fs2', description: 'Diacetyl Rest', temperature: 22, pressure: 0, days: 2 },
            { id: 'fs3', description: 'Crash', temperature: 3, pressure: 0.8, days: 3 },
        ],
        processParameters: {
            mashWaterMainsL: 18, mashWaterMainsMicroSiemens: 200, mashWaterRoL: 0, mashWaterRoMicroSiemens: 10,
            spargeWaterL: 14, spargeWaterMicroSiemens: 150, spargeWaterPh: 5.8, maltMilling: 88, expectedMashPh: 5.4, expectedIodineTime: 60,
            transferDuration: 15, recirculationDuration: 15, filtrationDuration: 60, firstWortPlato: 13, firstWortPh: 5.5,
            lastWortPlato: 4, lastWortPh: 5.9, preBoilLiters: 26, preBoilPlato: 11.0, preBoilPh: 5.3,
            postBoilLiters: 22, postBoilPlato: 12.0, postBoilPh: 5.2, boilDuration: 60, whirlpoolDuration: 10, whirlpoolRestDuration: 10, coolingDuration: 30,
        },
        packagedItems: [{ id: 'pkg2', masterItemId: 'item_pkg_wit_keg_fg' }],
        notes: 'Spicy and refreshing Belgian classic.'
    },
    {
        id: 'recipe3',
        name: 'Hazy IPA',
        style: 'NEIPA',
        qualityControlSpec: {
            og: { target: 15.0, min: 14.8, max: 15.2 },
            fg: { target: 3.0, min: 2.8, max: 3.2 },
            abv: { target: 6.5, min: 6.3, max: 6.7 },
            ibu: { target: 50, min: 45, max: 55 },
            liters: { target: 20 },
        },
        shelfLifeDays: 90,
        mashIngredients: [
            { id: 'mi1', masterItemId: 'item_25', quantity: 4.0 },
            { id: 'mi2', masterItemId: 'item_12', quantity: 1.0 },
            { id: 'mi3', masterItemId: 'item_5', quantity: 1.0 },
        ],
        boilWhirlpoolIngredients: [
            { id: 'bwi1', masterItemId: 'item_32', quantity: 0.05, type: 'Whirlpool', timing: 0, temperature: 80 },
            { id: 'bwi2', masterItemId: 'item_41', quantity: 0.05, type: 'Whirlpool', timing: 0, temperature: 80 },
        ],
        tankIngredients: [
            { id: 'ti1', masterItemId: 'item_92', quantity: 1, day: 0 },
            { id: 'ti2', masterItemId: 'item_32', quantity: 0.075, day: 2 },
            { id: 'ti3', masterItemId: 'item_41', quantity: 0.075, day: 8 },
        ],
        mashSteps: [ { id: 'ms1', temperature: 67, duration: 60, type: 'Infusion' }, ],
        fermentationSteps: [
            { id: 'fs1', description: 'Primary Fermentation', temperature: 19, pressure: 0, days: 8 },
            { id: 'fs2', description: 'Second Dry Hop', temperature: 15, pressure: 0, days: 4 },
            { id: 'fs3', description: 'Soft Crash', temperature: 10, pressure: 0.8, days: 2 },
        ],
        processParameters: {
            mashWaterMainsL: 20, mashWaterMainsMicroSiemens: 200, mashWaterRoL: 0, mashWaterRoMicroSiemens: 10,
            spargeWaterL: 12, spargeWaterMicroSiemens: 150, spargeWaterPh: 5.8, maltMilling: 90, expectedMashPh: 5.5, expectedIodineTime: 60,
            transferDuration: 15, recirculationDuration: 15, filtrationDuration: 60, firstWortPlato: 16, firstWortPh: 5.6,
            lastWortPlato: 5, lastWortPh: 5.9, preBoilLiters: 27, preBoilPlato: 14.0, preBoilPh: 5.4,
            postBoilLiters: 23, postBoilPlato: 15.0, postBoilPh: 5.2, boilDuration: 60, whirlpoolDuration: 20, whirlpoolRestDuration: 20, coolingDuration: 25,
        },
        packagedItems: [{ id: 'pkg3', masterItemId: 'item_pkg_neipa_can_fg' }],
        notes: 'Juicy, hazy, and hoppy.'
    }
];

const createBrewSheetFromRecipe = (recipe: Recipe, details: {
    id: string;
    lot: string;
    cookNumber: number;
    cookDate: string;
    fermenterId: string;
    status: 'Planned' | 'In Progress' | 'Fermenting' | 'Packaged' | 'Completed';
}): BrewSheet => {
    const deepCopy = <T,>(obj: T): T => JSON.parse(JSON.stringify(obj));
    return {
        id: details.id,
        recipeId: recipe.id,
        beerName: recipe.name,
        lot: details.lot,
        cookNumber: details.cookNumber,
        cookDate: details.cookDate,
        fermenterId: details.fermenterId,
        status: details.status,
        unloadStatus: {
            mash: false,
            boil: false,
            fermentation: false,
        },
        mashLog: {
            expected: {
                ingredients: deepCopy(recipe.mashIngredients),
                steps: deepCopy(recipe.mashSteps),
                mashPh: recipe.processParameters.expectedMashPh,
                expectedIodineTime: recipe.processParameters.expectedIodineTime,
                mashWaterMainsL: recipe.processParameters.mashWaterMainsL,
                mashWaterMainsMicroSiemens: recipe.processParameters.mashWaterMainsMicroSiemens,
                mashWaterRoL: recipe.processParameters.mashWaterRoL,
                mashWaterRoMicroSiemens: recipe.processParameters.mashWaterRoMicroSiemens,
                maltMilling: recipe.processParameters.maltMilling,
            },
            actual: {
                ingredients: deepCopy(recipe.mashIngredients).map((ing: Ingredient) => ({ id: ing.id, masterItemId: ing.masterItemId, lotAssignments: [] })),
                steps: deepCopy(recipe.mashSteps),
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
                ingredients: deepCopy(recipe.boilWhirlpoolIngredients),
                preBoilLiters: recipe.processParameters.preBoilLiters,
                preBoilPlato: recipe.processParameters.preBoilPlato,
                preBoilPh: recipe.processParameters.preBoilPh,
                boilDuration: recipe.processParameters.boilDuration,
                postBoilLiters: recipe.processParameters.postBoilLiters,
                postBoilPlato: recipe.processParameters.postBoilPlato,
                postBoilPh: recipe.processParameters.postBoilPh,
                whirlpoolDuration: recipe.processParameters.whirlpoolDuration,
                whirlpoolRestDuration: recipe.processParameters.whirlpoolRestDuration,
                coolingDuration: recipe.processParameters.coolingDuration,
            },
            actual: {
                ingredients: deepCopy(recipe.boilWhirlpoolIngredients).map((ing: BoilWhirlpoolIngredient) => ({ ...ing, lotAssignments: [] })),
            }
        },
        fermentationLog: {
            expected: {
                steps: deepCopy(recipe.fermentationSteps),
                additions: deepCopy(recipe.tankIngredients)
            },
            actual: {
                additions: deepCopy(recipe.tankIngredients).map((ing: TankIngredient) => ({ ...ing, lotAssignments: [] })),
                logEntries: []
            }
        },
        packagingLog: {
            summaryExpectedLiters: recipe.qualityControlSpec.liters.target,
            packagingLoadedToWarehouse: false,
            packagedItems: deepCopy(recipe.packagedItems).map((p: any) => ({ ...p, quantityGood: 0 }))
        },
        qualityControlLog: {
            sensoryPanelLogs: [],
            labAnalysisLogs: [],
        },
    };
};

export const mockBrewSheets: BrewSheet[] = ([
    // Past Batches
    createBrewSheetFromRecipe(mockRecipes[0], { id: 'batch_past_1', lot: '24A50', cookNumber: 50, cookDate: getPastDate(35), fermenterId: 'loc_fv_1', status: 'Completed' }),
    createBrewSheetFromRecipe(mockRecipes[1], { id: 'batch_past_2', lot: '24W32', cookNumber: 32, cookDate: getPastDate(30), fermenterId: 'loc_fv_2', status: 'Completed' }),
    createBrewSheetFromRecipe(mockRecipes[2], { id: 'batch_past_3', lot: '24H10', cookNumber: 10, cookDate: getPastDate(25), fermenterId: 'loc_fv_4', status: 'Completed' }),
    
    // Ongoing Batches
    createBrewSheetFromRecipe(mockRecipes[0], { id: 'batch_ongoing_1', lot: '24A51', cookNumber: 51, cookDate: getPastDate(12), fermenterId: 'loc_fv_3', status: 'Fermenting' }),
    createBrewSheetFromRecipe(mockRecipes[0], { id: 'batch_ongoing_2', lot: '24A52', cookNumber: 52, cookDate: getPastDate(8), fermenterId: 'loc_fv_1', status: 'Fermenting' }),
    createBrewSheetFromRecipe(mockRecipes[1], { id: 'batch_ongoing_3', lot: '24W33', cookNumber: 33, cookDate: getPastDate(15), fermenterId: 'loc_fv_5', status: 'Fermenting' }),
    createBrewSheetFromRecipe(mockRecipes[2], { id: 'batch_ongoing_4', lot: '24H11', cookNumber: 11, cookDate: getPastDate(10), fermenterId: 'loc_fv_6', status: 'Fermenting' }),
    createBrewSheetFromRecipe(mockRecipes[1], { id: 'batch_ongoing_5', lot: '24W34', cookNumber: 34, cookDate: getPastDate(4), fermenterId: 'loc_fv_2', status: 'In Progress' }),
    createBrewSheetFromRecipe(mockRecipes[2], { id: 'batch_ongoing_6', lot: '24H12', cookNumber: 12, cookDate: getPastDate(1), fermenterId: 'loc_fv_7', status: 'In Progress' }),

    // Future / Planned Batches
    createBrewSheetFromRecipe(mockRecipes[0], { id: 'batch_future_1', lot: '24A53', cookNumber: 53, cookDate: getFutureDate(2), fermenterId: 'loc_fv_4', status: 'Planned' }),
    createBrewSheetFromRecipe(mockRecipes[0], { id: 'batch_future_2', lot: '24A54', cookNumber: 54, cookDate: getFutureDate(5), fermenterId: 'loc_fv_1', status: 'Planned' }),
    createBrewSheetFromRecipe(mockRecipes[1], { id: 'batch_future_3', lot: '24W35', cookNumber: 35, cookDate: getFutureDate(9), fermenterId: 'loc_fv_2', status: 'Planned' }),
    createBrewSheetFromRecipe(mockRecipes[2], { id: 'batch_future_4', lot: '24H13', cookNumber: 13, cookDate: getFutureDate(12), fermenterId: 'loc_fv_5', status: 'Planned' }),
    createBrewSheetFromRecipe(mockRecipes[2], { id: 'batch_future_5', lot: '24H14', cookNumber: 14, cookDate: getFutureDate(15), fermenterId: 'loc_fv_6', status: 'Planned' }),
] as BrewSheet[]).sort((a,b) => new Date(b.cookDate).getTime() - new Date(a.cookDate).getTime());

export const mockWarehouseItems: WarehouseItem[] = [
    { id: 'wh_import_1', masterItemId: 'item_99', lotNumber: 'H004WW21040', quantity: 1.04, locationId: 'loc_wh_raw', expiryDate: '2026-10-01', documentNumber: 'IMG_IMPORT', arrivalDate: '2026-05-14' },
    { id: 'wh_import_2', masterItemId: 'item_96', lotNumber: 'Y500390214', quantity: 6, locationId: 'loc_wh_raw', expiryDate: '2029-11-29', documentNumber: 'IMG_IMPORT', arrivalDate: '2025-02-19' },
    { id: 'wh_import_3', masterItemId: 'item_101', lotNumber: 'F304/210501', quantity: 0.95, locationId: 'loc_wh_raw', expiryDate: '2026-05-01', documentNumber: 'IMG_IMPORT', arrivalDate: '2024-01-01' },
    { id: 'wh_import_4', masterItemId: 'item_98', lotNumber: '3384', quantity: 15.89, locationId: 'loc_wh_raw', expiryDate: '2025-05-02', documentNumber: 'IMG_IMPORT', arrivalDate: '2024-01-01' },
    { id: 'wh_import_5', masterItemId: 'item_97', lotNumber: '21 11 26', quantity: 21.55, locationId: 'loc_wh_raw', expiryDate: '2026-11-24', documentNumber: 'IMG_IMPORT', arrivalDate: '2025-05-14' },
    { id: 'wh_import_6', masterItemId: 'item_100', lotNumber: 'WU92420/', quantity: 1.6, locationId: 'loc_wh_raw', expiryDate: '2026-01-04', documentNumber: 'IMG_IMPORT', arrivalDate: '2026-01-21' },
    { id: 'wh_import_7', masterItemId: 'item_102', lotNumber: 'W0823428', quantity: 0.68, locationId: 'loc_wh_raw', expiryDate: '2027-01-27', documentNumber: 'IMG_IMPORT', arrivalDate: '2025-10-30' },
    { id: 'wh_import_8', masterItemId: 'item_105', lotNumber: 'W082/109/', quantity: 23, locationId: 'loc_wh_raw', expiryDate: '2026-06-11', documentNumber: 'IMG_IMPORT', arrivalDate: '2025-05-10' },
    { id: 'wh_import_9', masterItemId: 'item_32', lotNumber: 'P91-IJCIT9475AA11.9', quantity: 15, locationId: 'loc_wh_raw', expiryDate: '2026-12-01', documentNumber: 'IMG_IMPORT', arrivalDate: '2024-12-30' },
    { id: 'wh_import_10', masterItemId: 'item_32', lotNumber: 'P91-IJCIT9749AVY12.1', quantity: 9, locationId: 'loc_wh_raw', expiryDate: '2028-01-01', documentNumber: 'IMG_IMPORT', arrivalDate: '2026-07-16' },
    { id: 'wh_import_11', masterItemId: 'item_32', lotNumber: 'P92-IJCIT1078AA13.8', quantity: 3.5, locationId: 'loc_wh_raw', expiryDate: '2027-10-01', documentNumber: 'IMG_IMPORT', arrivalDate: '2025-05-14' },
    { id: 'wh_import_12', masterItemId: 'item_40', lotNumber: 'P91-IJCCUS9516AVY15.5', quantity: 9.4, locationId: 'loc_wh_raw', expiryDate: '2027-10-01', documentNumber: 'IMG_IMPORT', arrivalDate: '2025-07-15' },
    { id: 'wh_import_13', masterItemId: 'item_40', lotNumber: 'P92-IJCRS3131AA17.2', quantity: 0.7, locationId: 'loc_wh_raw', expiryDate: '2026-10-01', documentNumber: 'IMG_IMPORT', arrivalDate: '2024-07-12' },
    { id: 'wh_import_14', masterItemId: 'item_40', lotNumber: 'P92-IJCBG3137AA15.2', quantity: 15, locationId: 'loc_wh_raw', expiryDate: '2026-10-01', documentNumber: 'IMG_IMPORT', arrivalDate: '2024-12-30' },
    { id: 'wh_import_15', masterItemId: 'item_38', lotNumber: '24DE/24/0515 AA13.2', quantity: 2.15, locationId: 'loc_wh_raw', expiryDate: '2029-11-30', documentNumber: 'IMG_IMPORT', arrivalDate: '2024-12-30' },
    { id: 'wh_import_16', masterItemId: 'item_38', lotNumber: '24UL/23/1093Y AA10.8', quantity: 0, locationId: 'loc_wh_raw', expiryDate: '2029-07-31', documentNumber: 'IMG_IMPORT', arrivalDate: '2024-11-08' },
    { id: 'wh_import_17', masterItemId: 'item_38', lotNumber: '24DE/24/0268 AA13.1', quantity: 10, locationId: 'loc_wh_raw', expiryDate: '2030-05-31', documentNumber: 'IMG_IMPORT', arrivalDate: '2026-07-15' },
    { id: 'wh_import_18', masterItemId: 'item_41', lotNumber: 'P91-UMOS8529AA11.7', quantity: 20, locationId: 'loc_wh_raw', expiryDate: '2027-01-01', documentNumber: 'IMG_IMPORT', arrivalDate: '2024-12-30' },
    { id: 'wh_import_19', masterItemId: 'item_37', lotNumber: '24-9/07/4014 AA3.31', quantity: 4, locationId: 'loc_wh_raw', expiryDate: '2029-11-19', documentNumber: 'IMG_IMPORT', arrivalDate: '2024-12-30' },
    { id: 'wh_import_20', masterItemId: 'item_52', lotNumber: 'HPP-4030-02AA3.9', quantity: 15.2, locationId: 'loc_wh_raw', expiryDate: '2029-11-30', documentNumber: 'IMG_IMPORT', arrivalDate: '2024-12-30' },
    { id: 'wh_import_21', masterItemId: 'item_43', lotNumber: 'P91-JUCAB4138AA7.6', quantity: 15, locationId: 'loc_wh_raw', expiryDate: '2027-11-01', documentNumber: 'IMG_IMPORT', arrivalDate: '2026-07-15' },
    { id: 'wh_import_22', masterItemId: 'item_43', lotNumber: 'P92-IJCAS3120AA8.3', quantity: 15, locationId: 'loc_wh_raw', expiryDate: '2026-10-01', documentNumber: 'IMG_IMPORT', arrivalDate: '2024-10-30' },
    { id: 'wh_import_23', masterItemId: 'item_44', lotNumber: 'P91-JUCEN9518AA10.9', quantity: 10, locationId: 'loc_wh_raw', expiryDate: '2027-10-01', documentNumber: 'IMG_IMPORT', arrivalDate: '2025-07-15' },
    { id: 'wh_import_24', masterItemId: 'item_44', lotNumber: 'P92-IJCLN3049AA10.6', quantity: 0, locationId: 'loc_wh_raw', expiryDate: '2026-09-01', documentNumber: 'IMG_IMPORT', arrivalDate: '2024-01-10' },
    { id: 'wh_import_25', masterItemId: 'item_44', lotNumber: 'P92-IJCEN3253AA8.9', quantity: 17, locationId: 'loc_wh_raw', expiryDate: '2027-01-01', documentNumber: 'IMG_IMPORT', arrivalDate: '2024-12-30' },
    { id: 'wh_import_26', masterItemId: 'item_42', lotNumber: 'P91-IJCI18241AA12.1', quantity: 3.2, locationId: 'loc_wh_raw', expiryDate: '2026-10-01', documentNumber: 'IMG_IMPORT', arrivalDate: '2024-02-10' },
    { id: 'wh_import_27', masterItemId: 'item_42', lotNumber: 'P92-IJCH4127AA12.5', quantity: 10, locationId: 'loc_wh_raw', expiryDate: '2027-10-01', documentNumber: 'IMG_IMPORT', arrivalDate: '2026-07-15' },
    { id: 'wh_import_28', masterItemId: 'item_33', lotNumber: 'P91UEKUI297AA14.20', quantity: 12.5, locationId: 'loc_wh_raw', expiryDate: '2026-10-01', documentNumber: 'IMG_IMPORT', arrivalDate: '2024-12-30' },
    { id: 'wh_import_29', masterItemId: 'item_33', lotNumber: 'P91-IJFKJ9548AA14.2', quantity: 10, locationId: 'loc_wh_raw', expiryDate: '2027-11-01', documentNumber: 'IMG_IMPORT', arrivalDate: '2025-07-15' },
    { id: 'wh_import_30', masterItemId: 'item_35', lotNumber: '24DE/24/0075 AA3.3', quantity: 2.5, locationId: 'loc_wh_raw', expiryDate: '2029-12-31', documentNumber: 'IMG_IMPORT', arrivalDate: '2025-02-07' },
    { id: 'wh_import_31', masterItemId: 'item_35', lotNumber: '24DE/24/0184 3.2', quantity: 5, locationId: 'loc_wh_raw', expiryDate: '2030-02-28', documentNumber: 'IMG_IMPORT', arrivalDate: '2026-07-15' },
    { id: 'wh_import_32', masterItemId: 'item_55', lotNumber: 'T9024006 AA9.10', quantity: 17.5, locationId: 'loc_wh_raw', expiryDate: '2029-02-28', documentNumber: 'IMG_IMPORT', arrivalDate: '2026-05-14' },
    { id: 'wh_import_33', masterItemId: 'item_39', lotNumber: 'P91-IJSIM8541AA12.4', quantity: 2.5, locationId: 'loc_wh_raw', expiryDate: '2027-01-01', documentNumber: 'IMG_IMPORT', arrivalDate: '2024-12-30' },
    { id: 'wh_import_34', masterItemId: 'item_39', lotNumber: 'P92-IJSIM4116AA14.0', quantity: 30, locationId: 'loc_wh_raw', expiryDate: '2027-10-01', documentNumber: 'IMG_IMPORT', arrivalDate: '2026-07-30' },
    { id: 'wh_import_35', masterItemId: 'item_36', lotNumber: '23-0145 AA2.4', quantity: 3, locationId: 'loc_wh_raw', expiryDate: '2029-01-17', documentNumber: 'IMG_IMPORT', arrivalDate: '2024-11-08' },
    { id: 'wh_import_36', masterItemId: 'item_36', lotNumber: '24DE/24/0023 AA3.6', quantity: 15, locationId: 'loc_wh_raw', expiryDate: '2029-12-31', documentNumber: 'IMG_IMPORT', arrivalDate: '2026-04-23' },
    { id: 'wh_import_37', masterItemId: 'item_56', lotNumber: '23-4LVV2.1', quantity: 12.5, locationId: 'loc_wh_raw', expiryDate: '2026-07-10', documentNumber: 'IMG_IMPORT', arrivalDate: '2024-10-20' },
    { id: 'wh_import_38', masterItemId: 'item_56', lotNumber: 'T9024007AA2.20', quantity: 15, locationId: 'loc_wh_raw', expiryDate: '2029-02-28', documentNumber: 'IMG_IMPORT', arrivalDate: '2024-10-30' },
    { id: 'wh_import_39', masterItemId: 'item_51', lotNumber: 'PC1-IJCI1127BAA23.0', quantity: 35, locationId: 'loc_wh_raw', expiryDate: '2027-02-01', documentNumber: 'IMG_IMPORT', arrivalDate: '2024-12-30' },
    { id: 'wh_import_40', masterItemId: 'item_49', lotNumber: 'PC1-IJID71177AA22.3', quantity: 10, locationId: 'loc_wh_raw', expiryDate: '2027-01-01', documentNumber: 'IMG_IMPORT', arrivalDate: '2024-12-30' },
    { id: 'wh_import_41', masterItemId: 'item_49', lotNumber: 'PC1-IJIDY1165BAA21.6', quantity: 2.5, locationId: 'loc_wh_raw', expiryDate: '2027-01-01', documentNumber: 'IMG_IMPORT', arrivalDate: '2024-07-12' },
    { id: 'wh_import_42', masterItemId: 'item_49', lotNumber: 'PC1-IJID72220AA23.6', quantity: 10, locationId: 'loc_wh_raw', expiryDate: '2027-12-01', documentNumber: 'IMG_IMPORT', arrivalDate: '2025-05-14' },
    { id: 'wh_import_43', masterItemId: 'item_46', lotNumber: 'PC1-UMOS1220BAA21.9', quantity: 5, locationId: 'loc_wh_raw', expiryDate: '2027-01-01', documentNumber: 'IMG_IMPORT', arrivalDate: '2024-12-30' },
    { id: 'wh_import_44', masterItemId: 'item_46', lotNumber: 'PC1-IJMOS2233AA23.3', quantity: 10, locationId: 'loc_wh_raw', expiryDate: '2027-12-01', documentNumber: 'IMG_IMPORT', arrivalDate: '2026-07-15' },
    { id: 'wh_import_45', masterItemId: 'item_53', lotNumber: 'P91-IJID79646AA11.8', quantity: 20, locationId: 'loc_wh_raw', expiryDate: '2027-12-01', documentNumber: 'IMG_IMPORT', arrivalDate: '2025-07-08' },
    { id: 'wh_import_46', masterItemId: 'item_45', lotNumber: '24DE/23/0116 AA3.3', quantity: 1, locationId: 'loc_wh_raw', expiryDate: '2028-12-31', documentNumber: 'IMG_IMPORT', arrivalDate: '2024-06-06' },
    { id: 'wh_import_47', masterItemId: 'item_45', lotNumber: '24DE/24/2063 AA3.3', quantity: 9, locationId: 'loc_wh_raw', expiryDate: '2029-12-31', documentNumber: 'IMG_IMPORT', arrivalDate: '2025-03-07' },
    { id: 'wh_import_48', masterItemId: 'item_45', lotNumber: '24DE/24/0167 AA3.6', quantity: 2.5, locationId: 'loc_wh_raw', expiryDate: '2030-01-31', documentNumber: 'IMG_IMPORT', arrivalDate: '2026-07-30' },
    { id: 'wh_import_49', masterItemId: 'item_47', lotNumber: 'PC1-IJSIM1244AA22.3', quantity: 10, locationId: 'loc_wh_raw', expiryDate: '2027-02-01', documentNumber: 'IMG_IMPORT', arrivalDate: '2024-12-30' },
    { id: 'wh_import_50', masterItemId: 'item_34', lotNumber: 'VY11-2023AA18.4', quantity: 20, locationId: 'loc_wh_raw', expiryDate: '2026-04-13', documentNumber: 'IMG_IMPORT', arrivalDate: '2024-10-20' },
    { id: 'wh_import_51', masterItemId: 'item_65', lotNumber: 'T9024148 AA/12.10', quantity: 1.5, locationId: 'loc_wh_raw', expiryDate: '2027-05-15', documentNumber: 'IMG_IMPORT', arrivalDate: '2025-05-07' },
    { id: 'wh_import_52', masterItemId: 'item_61', lotNumber: '23/7000', quantity: 0.02, locationId: 'loc_wh_raw', expiryDate: '2031-11-30', documentNumber: 'IMG_IMPORT', arrivalDate: '2025-03-31' },
    { id: 'wh_import_53', masterItemId: 'item_61', lotNumber: '24/7207', quantity: 0.18, locationId: 'loc_wh_raw', expiryDate: '2032-11-30', documentNumber: 'IMG_IMPORT', arrivalDate: '2025-05-07' },
    { id: 'wh_import_54', masterItemId: 'item_69', lotNumber: 'OE1KII165', quantity: 0.05, locationId: 'loc_wh_raw', expiryDate: '2027-03-01', documentNumber: 'IMG_IMPORT', arrivalDate: '2026-05-14' },
    { id: 'wh_import_55', masterItemId: 'item_14', lotNumber: '16129.99', quantity: 300, locationId: 'loc_wh_raw', expiryDate: '2027-06-10', documentNumber: 'IMG_IMPORT', arrivalDate: '2025-07-20' },
    { id: 'wh_import_56', masterItemId: 'item_1', lotNumber: '23325-204', quantity: 500, locationId: 'loc_wh_raw', expiryDate: '2027-05-21', documentNumber: 'IMG_IMPORT', arrivalDate: '2025-05-10' },
    { id: 'wh_import_57', masterItemId: 'item_10', lotNumber: '24222.1', quantity: 150, locationId: 'loc_wh_raw', expiryDate: '2027-02-01', documentNumber: 'IMG_IMPORT', arrivalDate: '2025-05-10' },
    { id: 'wh_import_58', masterItemId: 'item_15', lotNumber: 'P080/10747', quantity: 12.5, locationId: 'loc_wh_raw', expiryDate: '2027-01-01', documentNumber: 'IMG_IMPORT', arrivalDate: '2026-04-23' },
    { id: 'wh_import_59', masterItemId: 'item_7', lotNumber: '20725-152', quantity: 0, locationId: 'loc_wh_raw', expiryDate: '2027-03-20', documentNumber: 'IMG_IMPORT', arrivalDate: '2026-04-23' },
    { id: 'wh_import_60', masterItemId: 'item_7', lotNumber: '225525-225', quantity: 200, locationId: 'loc_wh_raw', expiryDate: '2027-06-13', documentNumber: 'IMG_IMPORT', arrivalDate: '2025-05-10' },
    { id: 'wh_import_61', masterItemId: 'item_3', lotNumber: '16826-143', quantity: 25, locationId: 'loc_wh_raw', expiryDate: '2027-06-17', documentNumber: 'IMG_IMPORT', arrivalDate: '2026-07-16' },
    { id: 'wh_import_62', masterItemId: 'item_3', lotNumber: '20525-221', quantity: 25, locationId: 'loc_wh_raw', expiryDate: '2027-07-25', documentNumber: 'IMG_IMPORT', arrivalDate: '2025-05-10' },
    { id: 'wh_import_63', masterItemId: 'item_22', lotNumber: '24105-147', quantity: 50, locationId: 'loc_wh_raw', expiryDate: '2027-02-10', documentNumber: 'IMG_IMPORT', arrivalDate: '2025-03-07' },
    { id: 'wh_import_64', masterItemId: 'item_8', lotNumber: '20526-143', quantity: 60, locationId: 'loc_wh_raw', expiryDate: '2027-07-24', documentNumber: 'IMG_IMPORT', arrivalDate: '2026-05-10' },
    { id: 'wh_import_65', masterItemId: 'item_9', lotNumber: 'SL0581546', quantity: 10, locationId: 'loc_wh_raw', expiryDate: '2025-10-01', documentNumber: 'IMG_IMPORT', arrivalDate: '2024-10-30' },
    { id: 'wh_import_66', masterItemId: 'item_9', lotNumber: 'SL0707536', quantity: 25, locationId: 'loc_wh_raw', expiryDate: '2026-06-01', documentNumber: 'IMG_IMPORT', arrivalDate: '2025-05-10' },
    { id: 'wh_import_67', masterItemId: 'item_27', lotNumber: 'SL0703967', quantity: 10.5, locationId: 'loc_wh_raw', expiryDate: '2026-06-01', documentNumber: 'IMG_IMPORT', arrivalDate: '2026-01-21' },
    { id: 'wh_import_68', masterItemId: 'item_82', lotNumber: 'AJZ3V10102', quantity: 14.5, locationId: 'loc_wh_raw', expiryDate: '2026-11-10', documentNumber: 'IMG_IMPORT', arrivalDate: '2024-12-30' },
    { id: 'wh_import_69', masterItemId: 'item_83', lotNumber: 'AJ2PJR0079', quantity: 3, locationId: 'loc_wh_raw', expiryDate: '2027-10-22', documentNumber: 'IMG_IMPORT', arrivalDate: '2025-07-30' },
    { id: 'wh_import_70', masterItemId: 'item_6', lotNumber: '52460703', quantity: 25, locationId: 'loc_wh_raw', expiryDate: '2026-10-27', documentNumber: 'IMG_IMPORT', arrivalDate: '2026-05-31' },
    { id: 'wh_import_71', masterItemId: 'item_6', lotNumber: '55189768', quantity: 25, locationId: 'loc_wh_raw', expiryDate: '2027-06-06', documentNumber: 'IMG_IMPORT', arrivalDate: '2026-05-10' },
];
