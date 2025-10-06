import React, { useState, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import DashboardPage from './pages/DashboardPage';
import BatchesListPage from './pages/BatchesListPage';
import BrewSheetPage from './pages/BrewSheetPage';
import CalendarPage from './pages/CalendarPage';
import RecipesPage from './pages/RecipesPage';
import RecipeFormPage from './pages/RecipeFormPage';
import WarehousePage from './pages/WarehousePage';
import WarehouseLoadFormPage from './pages/WarehouseLoadFormPage';
import WarehouseUnloadFormPage from './pages/WarehouseUnloadFormPage';
import ItemsPage from './pages/ItemsPage';
import ItemFormPage from './pages/ItemFormPage';
import SuppliersPage from './pages/SuppliersPage';
import LocationsPage from './pages/LocationsPage';
import AnalysisPage from './pages/AnalysisPage';
import ProductionPlanPage from './pages/ProductionPlanPage';
import ToolsPage from './pages/ToolsPage';
import SettingsPage from './pages/SettingsPage';
import CustomersPage from './pages/CustomersPage';
import OrdersListPage from './pages/OrdersListPage';
import OrderFormPage from './pages/OrderFormPage';
import QualityControlPage from './pages/QualityControlPage';
import { Page, BrewSheet, Recipe, MasterItem, WarehouseItem, Location, Supplier, Category, Customer, Order } from './types';
import { mockBrewSheets, mockRecipes, mockMasterItems, mockWarehouseItems, mockLocations, mockSuppliers, mockCategories, mockCustomers, mockOrders } from './data/mockData';
import { useToast, } from './hooks/useToast';
import { useTranslation } from './hooks/useTranslation';
import { MenuIcon } from './components/Icons';
import usePersistentState from './hooks/usePersistentState';

const generateUniqueId = (prefix: string): string => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

const App: React.FC = () => {
    const { t } = useTranslation();
    const [page, setPage] = useState<Page | { page: Page; id: string }>(Page.Dashboard);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const toast = useToast();

    // Data state
    const [recipes, setRecipes] = usePersistentState<Recipe[]>('brewflow_recipes', mockRecipes);
    const [masterItems, setMasterItems] = usePersistentState<MasterItem[]>('brewflow_master_items', mockMasterItems);
    const [batches, setBatches] = usePersistentState<BrewSheet[]>('brewflow_batches', mockBrewSheets);
    const [warehouseItems, setWarehouseItems] = usePersistentState<WarehouseItem[]>('brewflow_warehouse_items', mockWarehouseItems);
    const [locations, setLocations] = usePersistentState<Location[]>('brewflow_locations', mockLocations);
    const [suppliers, setSuppliers] = usePersistentState<Supplier[]>('brewflow_suppliers', mockSuppliers);
    const [categories, setCategories] = usePersistentState<Category[]>('brewflow_categories', mockCategories);
    const [customers, setCustomers] = usePersistentState<Customer[]>('brewflow_customers', mockCustomers);
    const [orders, setOrders] = usePersistentState<Order[]>('brewflow_orders', mockOrders);

    const {
        rawMaterialMasterItems,
        rawMaterialWarehouseItems,
        finishedGoodsMasterItems,
        finishedGoodsWarehouseItems
    } = useMemo(() => {
        const fgParentCat = categories.find(c => c.name === 'Finished Goods');
        const fgCategoryIds = new Set<string>();
        if (fgParentCat) {
            fgCategoryIds.add(fgParentCat.id);
            categories.forEach(cat => {
                if (cat.parentCategoryId === fgParentCat.id) {
                    fgCategoryIds.add(cat.id);
                }
            });
        }

        const allMasterItems = masterItems;
        const allWarehouseItems = warehouseItems;

        const rawMIs = allMasterItems.filter(mi => !fgCategoryIds.has(mi.categoryId));
        const finishedMIs = allMasterItems.filter(mi => fgCategoryIds.has(mi.categoryId));

        const rawWHIs = allWarehouseItems.filter(whi => {
            const mi = allMasterItems.find(i => i.id === whi.masterItemId);
            return mi ? !fgCategoryIds.has(mi.categoryId) : false;
        });

        const finishedWHIs = allWarehouseItems.filter(whi => {
            const mi = allMasterItems.find(i => i.id === whi.masterItemId);
            return mi ? fgCategoryIds.has(mi.categoryId) : false;
        });

        return {
            rawMaterialMasterItems: rawMIs,
            rawMaterialWarehouseItems: rawWHIs,
            finishedGoodsMasterItems: finishedMIs,
            finishedGoodsWarehouseItems: finishedWHIs
        };
    }, [masterItems, warehouseItems, categories]);


    const handleNavigate = (newPage: Page | { page: Page; id: string }) => {
        setPage(newPage);
        setIsSidebarOpen(false);
    };

    // --- CRUD Handlers ---

    // Recipes
    const handleSaveRecipe = (recipeToSave: Recipe) => {
        if ('id' in recipeToSave && recipeToSave.id) {
            setRecipes(recipes.map(r => r.id === recipeToSave.id ? recipeToSave : r));
            toast.success('Recipe updated successfully!');
        } else {
            setRecipes([...recipes, { ...recipeToSave, id: generateUniqueId('recipe') }]);
            toast.success('Recipe created successfully!');
        }
        handleNavigate(Page.Recipes);
    };
    const handleDeleteRecipe = (recipeId: string) => {
        setRecipes(recipes.filter(r => r.id !== recipeId));
        toast.success('Recipe deleted.');
    };

    // Master Items
    const handleSaveItem = (itemToSave: MasterItem) => {
        if ('id' in itemToSave && itemToSave.id) {
            setMasterItems(masterItems.map(i => i.id === itemToSave.id ? itemToSave : i));
            toast.success('Item updated successfully!');
        } else {
            setMasterItems([...masterItems, { ...itemToSave, id: generateUniqueId('item') }]);
            toast.success('Item created successfully!');
        }
        handleNavigate(Page.Items);
    };
    const handleDeleteItem = (itemId: string) => {
        setMasterItems(masterItems.filter(i => i.id !== itemId));
        toast.success('Item deleted.');
    };

    // Batches
    const handleSaveBatch = (batchToSave: BrewSheet) => {
        setBatches(batches.map(b => b.id === batchToSave.id ? batchToSave : b));
        toast.success(`Batch ${batchToSave.lot} saved.`);
    }
    const handleDeleteBatch = (batchId: string) => {
        setBatches(batches.filter(b => b.id !== batchId));
        toast.success('Batch deleted.');
    }
    const handleCreateBatch = (recipeId: string, details: { lot: string; cookDate: string; cookNumber: number; fermenterId: string; }) => {
        const recipe = recipes.find(r => r.id === recipeId);
        if (!recipe) return;

        const newBatch: BrewSheet = {
            id: generateUniqueId('batch'),
            recipeId: recipe.id,
            beerName: recipe.name,
            lot: details.lot,
            cookNumber: details.cookNumber,
            cookDate: details.cookDate,
            fermenterId: details.fermenterId,
            status: 'Planned',
            mashLog: {
                expected: JSON.parse(JSON.stringify({
                    ingredients: recipe.mashIngredients,
                    steps: recipe.mashSteps,
                    mashPh: recipe.processParameters.expectedMashPh,
                    expectedIodineTime: recipe.processParameters.expectedIodineTime,
                })),
                actual: { ingredients: JSON.parse(JSON.stringify(recipe.mashIngredients)), steps: JSON.parse(JSON.stringify(recipe.mashSteps)) }
            },
            lauterLog: {
                expected: JSON.parse(JSON.stringify({
                     transferDuration: recipe.processParameters.transferDuration,
                     recirculationDuration: recipe.processParameters.recirculationDuration,
                     filtrationDuration: recipe.processParameters.filtrationDuration,
                     firstWortPlato: recipe.processParameters.firstWortPlato,
                     firstWortPh: recipe.processParameters.firstWortPh,
                     lastWortPlato: recipe.processParameters.lastWortPlato,
                     lastWortPh: recipe.processParameters.lastWortPh,
                })),
                actual: {}
            },
            boilLog: {
                expected: JSON.parse(JSON.stringify({
                    ingredients: recipe.boilWhirlpoolIngredients,
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
                })),
                actual: { ingredients: JSON.parse(JSON.stringify(recipe.boilWhirlpoolIngredients)) }
            },
            fermentationLog: {
                expected: JSON.parse(JSON.stringify({
                    steps: recipe.fermentationSteps,
                    additions: recipe.tankIngredients
                })),
                actual: { additions: JSON.parse(JSON.stringify(recipe.tankIngredients)), logEntries: [] }
            },
            packagingLog: {
                summaryExpectedLiters: recipe.qualityControlSpec.liters.target,
                packagingLoadedToWarehouse: false,
                packagedItems: JSON.parse(JSON.stringify(recipe.packagedItems)).map((p: any) => ({ ...p, formatLiters: 0, quantityUsed: 0, quantityGood: 0 }))
            },
            qualityControlLog: {
                sensoryPanelLogs: [],
                labAnalysisLogs: [],
            },
        };

        setBatches(prev => [...prev, newBatch].sort((a,b) => new Date(b.cookDate).getTime() - new Date(a.cookDate).getTime()));
        toast.success(`Batch ${details.lot} created!`);
    };

    // Warehouse
    const handleLoadWarehouseItems = (itemsToLoad: Omit<WarehouseItem, 'id'>[]) => {
        const newItems = itemsToLoad.map(item => ({ ...item, id: generateUniqueId('wh')}));
        setWarehouseItems(prev => [...prev, ...newItems]);
        toast.success(`${itemsToLoad.length} item(s) loaded into warehouse.`);
        handleNavigate(Page.Warehouse);
    }
     const handleUnloadWarehouseItems = (itemsToUnload: Omit<WarehouseItem, 'id'>[]) => {
        setWarehouseItems(currentItems => {
            const updatedItems = [...currentItems];
            itemsToUnload.forEach(unloadItem => {
                const itemIndex = updatedItems.findIndex(i => i.masterItemId === unloadItem.masterItemId && i.lotNumber === unloadItem.lotNumber);
                if (itemIndex > -1) {
                    updatedItems[itemIndex].quantity -= unloadItem.quantity;
                }
            });
            return updatedItems.filter(i => i.quantity > 0.01);
        });
        toast.success(`${itemsToUnload.length} item(s) unloaded from warehouse.`);
        
        const currentPage = typeof page === 'string' ? page : page.page;
        if(currentPage === Page.WarehouseFinishedGoods) {
            handleNavigate(Page.WarehouseFinishedGoods);
        } else {
            handleNavigate(Page.Warehouse);
        }
    }
    const handleLoadFinishedGoods = (batchId: string, itemsToLoad: Omit<WarehouseItem, 'id'>[]) => {
        const newItems = itemsToLoad.map(item => ({ ...item, id: generateUniqueId('wh_fg')}));
        setWarehouseItems(prev => [...prev, ...newItems]);

        setBatches(prevBatches => prevBatches.map(batch => {
            if (batch.id === batchId) {
                return {
                    ...batch,
                    packagingLog: {
                        ...batch.packagingLog,
                        packagingLoadedToWarehouse: true,
                    }
                };
            }
            return batch;
        }));
        
        const batchLot = batches.find(b => b.id === batchId)?.lot;
        toast.success(`Finished goods for lot ${batchLot} loaded successfully.`);
        handleNavigate(Page.WarehouseFinishedGoods);
    };

    // Suppliers
    const handleSaveSupplier = (supplierToSave: Supplier | Omit<Supplier, 'id'>) => {
        if ('id' in supplierToSave) {
            setSuppliers(suppliers.map(s => s.id === supplierToSave.id ? supplierToSave : s));
            toast.success('Supplier updated.');
        } else {
            setSuppliers([...suppliers, { ...supplierToSave, id: generateUniqueId('sup') }]);
            toast.success('Supplier created.');
        }
    };
    const handleDeleteSupplier = (supplierId: string) => {
        setSuppliers(suppliers.filter(s => s.id !== supplierId));
        toast.success('Supplier deleted.');
    };

     // Customers
    const handleSaveCustomer = (customerToSave: Customer | Omit<Customer, 'id'>) => {
        if ('id' in customerToSave) {
            setCustomers(customers.map(c => c.id === customerToSave.id ? customerToSave : c));
            toast.success('Customer updated.');
        } else {
            setCustomers([...customers, { ...customerToSave, id: generateUniqueId('cust') }]);
            toast.success('Customer created.');
        }
    };
    const handleDeleteCustomer = (customerId: string) => {
        setCustomers(customers.filter(s => s.id !== customerId));
        toast.success('Customer deleted.');
    };

    // Orders
    const handleSaveOrder = (orderToSave: Order) => {
        if ('id' in orderToSave && orderToSave.id) {
            setOrders(orders.map(o => o.id === orderToSave.id ? orderToSave : o));
            toast.success(`Order ${orderToSave.orderNumber} updated successfully!`);
        } else {
            const newOrder = { ...orderToSave, id: generateUniqueId('order') };
            setOrders(prev => [...prev, newOrder].sort((a,b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()));
            toast.success(`Order ${orderToSave.orderNumber} created successfully!`);
        }
        handleNavigate(Page.Orders);
    };
    const handleDeleteOrder = (orderId: string) => {
        setOrders(orders.filter(o => o.id !== orderId));
        toast.success('Order deleted.');
    };

    // Locations
    const handleSaveLocation = (locationToSave: Location | Omit<Location, 'id'>) => {
         if ('id' in locationToSave) {
            setLocations(locations.map(l => l.id === locationToSave.id ? locationToSave : l));
            toast.success('Location updated.');
        } else {
            setLocations([...locations, { ...locationToSave, id: generateUniqueId('loc') }]);
            toast.success('Location created.');
        }
    };
    const handleDeleteLocation = (locationId: string) => {
        setLocations(locations.filter(l => l.id !== locationId));
        toast.success('Location deleted.');
    };

    // Categories
    const handleSaveCategory = (categoryToSave: Category | Omit<Category, 'id'>) => {
        if ('id' in categoryToSave) {
            setCategories(categories.map(c => c.id === categoryToSave.id ? categoryToSave : c));
            toast.success('Category updated.');
        } else {
            setCategories([...categories, { ...categoryToSave, id: generateUniqueId('cat') }]);
            toast.success('Category created.');
        }
    };

    const handleDeleteCategory = (categoryId: string) => {
        const childCategoryIds = categories.filter(c => c.parentCategoryId === categoryId).map(c => c.id);
        const idsToDelete = [categoryId, ...childCategoryIds];

        setCategories(categories.filter(c => !idsToDelete.includes(c.id)));
        toast.success('Category and its subcategories deleted.');
    };
    
    const renderPage = () => {
        const currentPage = typeof page === 'string' ? page : page.page;
        const pageId = typeof page === 'object' ? page.id : undefined;

        switch (currentPage) {
            case Page.Dashboard:
                return <DashboardPage batches={batches} warehouseItems={warehouseItems} masterItems={masterItems} onNavigate={handleNavigate} />;
            case Page.Batches:
                if (pageId) {
                    const batch = batches.find(b => b.id === pageId);
                    if (batch) {
                        return <BrewSheetPage 
                                    batch={batch} recipes={recipes} masterItems={masterItems} warehouseItems={warehouseItems} categories={categories} locations={locations}
                                    onBack={() => handleNavigate(Page.Batches)} 
                                    onSave={handleSaveBatch}
                                    onUnloadItems={handleUnloadWarehouseItems}
                                    onLoadFinishedGoods={handleLoadFinishedGoods}
                                />;
                    }
                }
                return <BatchesListPage 
                            batches={batches} recipes={recipes} locations={locations} 
                            onSelectBatch={(batch) => handleNavigate({ page: Page.Batches, id: batch.id })} 
                            onCreateBatch={handleCreateBatch}
                            onDeleteBatch={handleDeleteBatch}
                        />;
            case Page.Calendar:
                return <CalendarPage batches={batches} recipes={recipes} locations={locations} masterItems={masterItems} categories={categories} onSelectBatch={(batch) => handleNavigate({ page: Page.Batches, id: batch.id })} />;
            case Page.QualityControl:
                return <QualityControlPage batches={batches} recipes={recipes} />;
            case Page.Recipes:
                if (pageId) {
                    const recipe = recipes.find(r => r.id === pageId) || null;
                    return <RecipeFormPage recipe={recipe} masterItems={masterItems} categories={categories} onSave={handleSaveRecipe} onBack={() => handleNavigate(Page.Recipes)} />;
                }
                 if (pageId === 'new') { // Special case for new
                    return <RecipeFormPage recipe={null} masterItems={masterItems} categories={categories} onSave={handleSaveRecipe} onBack={() => handleNavigate(Page.Recipes)} />;
                }
                return <RecipesPage recipes={recipes} masterItems={masterItems} onNewRecipe={() => handleNavigate({ page: Page.Recipes, id: 'new'})} onEditRecipe={(recipe) => handleNavigate({ page: Page.Recipes, id: recipe.id })} onDeleteRecipe={handleDeleteRecipe} />;
            case Page.Warehouse:
                 if (pageId === 'load') {
                    return <WarehouseLoadFormPage masterItems={rawMaterialMasterItems} locations={locations} onSave={handleLoadWarehouseItems} onBack={() => handleNavigate(Page.Warehouse)} />;
                }
                 if (pageId === 'unload') {
                    return <WarehouseUnloadFormPage masterItems={rawMaterialMasterItems} warehouseItems={rawMaterialWarehouseItems} onSave={handleUnloadWarehouseItems} onBack={() => handleNavigate(Page.Warehouse)} />;
                }
                return <WarehousePage 
                            warehouseItems={rawMaterialWarehouseItems} masterItems={masterItems} locations={locations} categories={categories}
                            onLoadItems={() => handleNavigate({ page: Page.Warehouse, id: 'load'})}
                            onUnloadItems={() => handleNavigate({ page: Page.Warehouse, id: 'unload'})}
                            onMoveItems={() => {}} // Placeholder
                            title={t('Raw Materials Warehouse')}
                            showLoadButton={true}
                        />;
            case Page.WarehouseFinishedGoods:
                if (pageId === 'unload') {
                    return <WarehouseUnloadFormPage masterItems={finishedGoodsMasterItems} warehouseItems={finishedGoodsWarehouseItems} onSave={handleUnloadWarehouseItems} onBack={() => handleNavigate(Page.WarehouseFinishedGoods)} />;
                }
                return <WarehousePage 
                            warehouseItems={finishedGoodsWarehouseItems} masterItems={masterItems} locations={locations} categories={categories}
                            onLoadItems={() => {}} // No manual loading for FG
                            onUnloadItems={() => handleNavigate({ page: Page.WarehouseFinishedGoods, id: 'unload'})}
                            onMoveItems={() => {}} // Placeholder
                            title={t('Finished Goods Warehouse')}
                            showLoadButton={false}
                        />;
            case Page.Items:
                 if (pageId) {
                    const item = masterItems.find(i => i.id === pageId) || null;
                    return <ItemFormPage item={item} categories={categories} suppliers={suppliers} onSave={handleSaveItem} onBack={() => handleNavigate(Page.Items)} />;
                }
                 if (pageId === 'new') { // Special case for new
                    return <ItemFormPage item={null} categories={categories} suppliers={suppliers} onSave={handleSaveItem} onBack={() => handleNavigate(Page.Items)} />;
                }
                return <ItemsPage masterItems={masterItems} categories={categories} onNewItem={() => handleNavigate({ page: Page.Items, id: 'new'})} onEditItem={(item) => handleNavigate({ page: Page.Items, id: item.id })} onDeleteItem={handleDeleteItem} />;
            case Page.Suppliers:
                return <SuppliersPage suppliers={suppliers} onSaveSupplier={handleSaveSupplier} onDeleteSupplier={handleDeleteSupplier} />;
            case Page.Locations:
                return <LocationsPage locations={locations} onSaveLocation={handleSaveLocation} onDeleteLocation={handleDeleteLocation} />;
            case Page.Analysis:
                return <AnalysisPage batches={batches} recipes={recipes} masterItems={masterItems} categories={categories} warehouseItems={warehouseItems} />;
            case Page.ProductionPlan:
                return <ProductionPlanPage 
                            recipes={recipes}
                            masterItems={masterItems}
                            warehouseItems={warehouseItems}
                            categories={categories}
                            suppliers={suppliers}
                            batches={batches}
                        />;
            case Page.Tools:
                return <ToolsPage />;
            case Page.Settings:
                return <SettingsPage 
                            categories={categories}
                            onSaveCategory={handleSaveCategory}
                            onDeleteCategory={handleDeleteCategory}
                        />;
            case Page.Orders:
                if (pageId === 'new') {
                    return <OrderFormPage 
                                order={null} 
                                customers={customers}
                                masterItems={masterItems}
                                categories={categories}
                                onSave={handleSaveOrder} 
                                onBack={() => handleNavigate(Page.Orders)} />;
                }
                if (pageId) {
                    const order = orders.find(o => o.id === pageId) || null;
                    return <OrderFormPage 
                                order={order} 
                                customers={customers}
                                masterItems={masterItems}
                                categories={categories}
                                onSave={handleSaveOrder} 
                                onBack={() => handleNavigate(Page.Orders)} />;
                }
                return <OrdersListPage
                            orders={orders}
                            customers={customers}
                            onNewOrder={() => handleNavigate({ page: Page.Orders, id: 'new'})}
                            onSelectOrder={(order) => handleNavigate({ page: Page.Orders, id: order.id })}
                            onDeleteOrder={handleDeleteOrder}
                        />;
            case Page.Customers:
                return <CustomersPage 
                            customers={customers}
                            onSaveCustomer={handleSaveCustomer}
                            onDeleteCustomer={handleDeleteCustomer}
                        />;
            default:
                return <DashboardPage batches={batches} warehouseItems={warehouseItems} masterItems={masterItems} onNavigate={handleNavigate} />;
        }
    };
    
    return (
        <div className="bg-color-background text-color-text h-screen flex overflow-hidden">
            <Sidebar 
                currentPage={typeof page === 'string' ? page : page.page} 
                onNavigate={handleNavigate} 
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />
             {/* Overlay for mobile */}
            {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>}
            <main className="flex-1 p-4 md:p-6 overflow-y-auto">
                 {/* Hamburger button for mobile */}
                <button 
                    className="md:hidden p-1 mb-4 text-gray-400 hover:text-white"
                    onClick={() => setIsSidebarOpen(true)}
                    aria-label="Open menu"
                >
                    <MenuIcon className="w-6 h-6"/>
                </button>
                {renderPage()}
            </main>
        </div>
    );
};

export default App;
