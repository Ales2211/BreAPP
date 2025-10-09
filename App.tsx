import React, { useState } from 'react';
import {
  Page, Recipe, BrewSheet, MasterItem, WarehouseItem, Category, Location, Supplier, Customer, Order,
  BatchNumberingSettings, AdministrationSettings, CustomerPriceList, TransportDocument, WarehouseMovement
} from './types';
import { Sidebar } from './components/Sidebar';
import { MenuIcon } from './components/Icons';
import usePersistentState from './hooks/usePersistentState';
import { useToast } from './hooks/useToast';
// FIX: Import useTranslation hook to provide the 't' function for localization.
import { useTranslation } from './hooks/useTranslation';
import {
  mockRecipes, mockBatches, mockMasterItems, mockWarehouseItems, mockCategories,
  mockLocations, mockSuppliers, mockCustomers, mockOrders, mockBatchNumberingSettings,
  mockAdminSettings, mockCustomerPriceLists, mockTransportDocuments, generateBrewSheetFromRecipe,
  mockWarehouseMovements
} from './data/mockData';

// Import all page components
import DashboardPage from './pages/DashboardPage';
import BatchesListPage from './pages/BatchesListPage';
import BrewSheetPage from './pages/BrewSheetPage';
import RecipesPage from './pages/RecipesPage';
import RecipeFormPage from './pages/RecipeFormPage';
import CalendarPage from './pages/CalendarPage';
import WarehousePage from './pages/WarehousePage';
import WarehouseMovementsPage from './pages/WarehouseMovementsPage';
import ItemsPage from './pages/ItemsPage';
import ItemFormPage from './pages/ItemFormPage';
import ProductionPlanPage from './pages/ProductionPlanPage';
import AnalysisPage from './pages/AnalysisPage';
import QualityControlPage from './pages/QualityControlPage';
import OrdersListPage from './pages/OrdersListPage';
import OrderFormPage from './pages/OrderFormPage';
import CustomersPage from './pages/CustomersPage';
import SuppliersPage from './pages/SuppliersPage';
import LocationsPage from './pages/LocationsPage';
import ProductionCostsPage from './pages/ProductionCostsPage';
import PriceListPage from './pages/PriceListPage';
import CustomerPriceListsPage from './pages/CustomerPriceListsPage';
import SettingsPage from './pages/SettingsPage';
import ToolsPage from './pages/ToolsPage';
import WarehouseLoadFormPage from './pages/WarehouseLoadFormPage';
import WarehouseUnloadFormPage from './pages/WarehouseUnloadFormPage';
import ShippingPage from './pages/ShippingPage';

const App: React.FC = () => {
  // Data state
  const [recipes, setRecipes] = usePersistentState<Recipe[]>('recipes', mockRecipes);
  const [batches, setBatches] = usePersistentState<BrewSheet[]>('batches', mockBatches);
  const [masterItems, setMasterItems] = usePersistentState<MasterItem[]>('masterItems', mockMasterItems);
  const [warehouseItems, setWarehouseItems] = usePersistentState<WarehouseItem[]>('warehouseItems', mockWarehouseItems);
  const [warehouseMovements, setWarehouseMovements] = usePersistentState<WarehouseMovement[]>('warehouseMovements', mockWarehouseMovements);
  const [categories, setCategories] = usePersistentState<Category[]>('categories', mockCategories);
  const [locations, setLocations] = usePersistentState<Location[]>('locations', mockLocations);
  const [suppliers, setSuppliers] = usePersistentState<Supplier[]>('suppliers', mockSuppliers);
  const [customers, setCustomers] = usePersistentState<Customer[]>('customers', mockCustomers);
  const [orders, setOrders] = usePersistentState<Order[]>('orders', mockOrders);
  const [transportDocuments, setTransportDocuments] = usePersistentState<TransportDocument[]>('transportDocuments', mockTransportDocuments);
  const [batchNumberingSettings, setBatchNumberingSettings] = usePersistentState<BatchNumberingSettings>('batchNumberingSettings', mockBatchNumberingSettings);
  const [adminSettings, setAdminSettings] = usePersistentState<AdministrationSettings>('adminSettings', mockAdminSettings);
  const [customerPriceLists, setCustomerPriceLists] = usePersistentState<CustomerPriceList[]>('customerPriceLists', mockCustomerPriceLists);

  // UI state
  const [currentPage, setCurrentPage] = useState<Page>(Page.Dashboard);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toast = useToast();
  // FIX: Initialize useTranslation hook to get the 't' function.
  const { t } = useTranslation();

  // State for detail/form pages
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formState, setFormState] = useState<{ page: Page, mode: 'new' | 'edit' | 'load' | 'unload', id?: string } | null>(null);

  // --- Navigation ---
  const handleNavigate = (page: Page | { page: Page; id: string }) => {
    if (typeof page === 'object') {
      setCurrentPage(page.page);
      setSelectedId(page.id);
    } else {
      setCurrentPage(page);
      setSelectedId(null);
    }
    setFormState(null);
    setSidebarOpen(false);
  };

  const goBack = () => {
    setSelectedId(null);
    setFormState(null);
  };

  const openForm = (page: Page, mode: 'new' | 'edit' | 'load' | 'unload', id?: string) => {
    setFormState({ page, mode, id });
  };
  
  // --- CRUD Handlers ---

  // Batches
  const handleSaveBatch = (batch: BrewSheet) => {
    setBatches(prev => prev.map(b => b.id === batch.id ? batch : b));
    toast.success('Batch saved successfully!');
    goBack();
  };
  const handleCreateBatch = (recipeId: string, details: { cookDate: string; fermenterId: string; }) => {
    const recipe = recipes.find(r => r.id === recipeId);
    if (recipe) {
        const newBatch = generateBrewSheetFromRecipe(recipe, details.cookDate, details.fermenterId, batches);
        setBatches(prev => [...prev, newBatch]);
        toast.success('New batch created!');
    }
  };
  const handleDeleteBatch = (batchId: string) => {
    setBatches(prev => prev.filter(b => b.id !== batchId));
    toast.success('Batch deleted!');
  };

  // Recipes
  const handleSaveRecipe = (recipeData: Recipe | Omit<Recipe, 'id'>) => {
    if ('id' in recipeData) {
        setRecipes(prev => prev.map(r => r.id === recipeData.id ? recipeData : r));
        toast.success('Recipe updated!');
    } else {
        const newRecipe = { ...recipeData, id: `recipe_${Date.now()}` };
        setRecipes(prev => [...prev, newRecipe]);
        toast.success('Recipe created!');
    }
    goBack();
  };
  const handleDeleteRecipe = (recipeId: string) => {
    setRecipes(prev => prev.filter(r => r.id !== recipeId));
    toast.success('Recipe deleted!');
  };
  const handleDuplicateRecipe = (recipeId: string) => {
    const originalRecipe = recipes.find(r => r.id === recipeId);
    if (!originalRecipe) {
        toast.error('Could not find recipe to duplicate.');
        return;
    }

    const newRecipe = {
        ...JSON.parse(JSON.stringify(originalRecipe)), // Deep copy
        id: `recipe_${Date.now()}`,
        name: `${originalRecipe.name} (Copy)`,
    };
    
    setRecipes(prev => [...prev, newRecipe]);
    toast.success(`Recipe "${originalRecipe.name}" duplicated successfully!`);
  };
  
  // Items
  const handleSaveMasterItem = (itemData: MasterItem | Omit<MasterItem, 'id'>) => {
    if ('id' in itemData) {
        setMasterItems(prev => prev.map(i => i.id === itemData.id ? itemData : i));
        toast.success('Item updated!');
    } else {
        const newItem = { ...itemData, id: `item_${Date.now()}` };
        setMasterItems(prev => [...prev, newItem]);
        toast.success('Item created!');
    }
    goBack();
  };
  const handleDeleteMasterItem = (itemId: string) => {
    setMasterItems(prev => prev.filter(i => i.id !== itemId));
    toast.success('Item deleted!');
  };

  // Warehouse
  const handleLoadItems = (items: Omit<WarehouseItem, 'id'>[]) => {
    const newItems: WarehouseItem[] = [];
    const newMovements: WarehouseMovement[] = [];
    const timestamp = new Date().toISOString();

    items.forEach(item => {
        const newItemId = `wh_${Date.now()}_${Math.random()}`;
        newItems.push({ ...item, id: newItemId });
        newMovements.push({
            id: `mov_${newItemId}`,
            timestamp,
            type: 'load',
            masterItemId: item.masterItemId,
            lotNumber: item.lotNumber,
            quantity: item.quantity,
            locationId: item.locationId,
            documentNumber: item.documentNumber,
        });
    });

    setWarehouseItems(prev => [...prev, ...newItems]);
    setWarehouseMovements(prev => [...prev, ...newMovements]);
    toast.success(`${items.length} item(s) loaded into warehouse.`);
    goBack();
  };

  const handleUnloadItems = (itemsToUnload: Omit<WarehouseItem, 'id'>[], type: 'unload' | 'brew_unload') => {
    const newMovements: WarehouseMovement[] = [];
    const timestamp = new Date().toISOString();
    
    const deepCopiedItems = JSON.parse(JSON.stringify(warehouseItems)) as WarehouseItem[];

    itemsToUnload.forEach(itemToUnload => {
        let remainingQtyToUnload = itemToUnload.quantity;
        const relevantLots = deepCopiedItems
            .filter(i => i.masterItemId === itemToUnload.masterItemId && i.lotNumber === itemToUnload.lotNumber)
            .sort((a, b) => new Date(a.arrivalDate).getTime() - new Date(b.arrivalDate).getTime());

        for (const lot of relevantLots) {
            if (remainingQtyToUnload <= 0) break;
            const qtyToRemove = Math.min(remainingQtyToUnload, lot.quantity);
            
            lot.quantity -= qtyToRemove;
            remainingQtyToUnload -= qtyToRemove;

            newMovements.push({
                id: `mov_unload_${Date.now()}_${Math.random()}`,
                timestamp,
                type: type,
                masterItemId: itemToUnload.masterItemId,
                lotNumber: itemToUnload.lotNumber,
                quantity: -qtyToRemove,
                locationId: lot.locationId,
                documentNumber: itemToUnload.documentNumber,
            });
        }
    });
    
    const finalItems = deepCopiedItems.filter(i => i.quantity > 0.001);
    
    setWarehouseItems(finalItems);
    setWarehouseMovements(prev => [...prev, ...newMovements]);
    toast.success(`${itemsToUnload.length} type(s) of items unloaded from warehouse.`);
    goBack();
};

const handleMoveItem = (details: { masterItemId: string; lotNumber: string; fromLocationId: string; toLocationId: string; quantity: number; }) => {
    const { masterItemId, lotNumber, fromLocationId, toLocationId, quantity } = details;

    setWarehouseItems(prevItems => {
        let updatedItems = [...prevItems];

        // Find the source item
        const sourceItemIndex = updatedItems.findIndex(
            item => item.masterItemId === masterItemId &&
                    item.lotNumber === lotNumber &&
                    item.locationId === fromLocationId
        );

        if (sourceItemIndex === -1) {
            // FIX: Use 't' function for translation.
            toast.error(t('Source item not found.'));
            return prevItems;
        }

        const sourceItem = { ...updatedItems[sourceItemIndex] };

        if (sourceItem.quantity < quantity) {
            // FIX: Use 't' function for translation.
            toast.error(t('Insufficient quantity to move.'));
            return prevItems;
        }

        // Decrease source quantity
        sourceItem.quantity -= quantity;

        // Find or create destination item
        const destItemIndex = updatedItems.findIndex(
            item => item.masterItemId === masterItemId &&
                    item.lotNumber === lotNumber &&
                    item.locationId === toLocationId &&
                    item.expiryDate === sourceItem.expiryDate // Match expiry date too
        );

        if (destItemIndex !== -1) {
            // Destination item exists, update its quantity
            updatedItems[destItemIndex] = {
                ...updatedItems[destItemIndex],
                quantity: updatedItems[destItemIndex].quantity + quantity,
            };
        } else {
            // Destination item does not exist, create a new one
            updatedItems.push({
                id: `wh_${Date.now()}`,
                masterItemId: sourceItem.masterItemId,
                lotNumber: sourceItem.lotNumber,
                quantity: quantity,
                locationId: toLocationId,
                arrivalDate: sourceItem.arrivalDate,
                expiryDate: sourceItem.expiryDate,
                documentNumber: sourceItem.documentNumber,
            });
        }
        
        // Update or remove source item
        if (sourceItem.quantity < 0.001) {
            updatedItems = updatedItems.filter((_, index) => index !== sourceItemIndex);
        } else {
            updatedItems[sourceItemIndex] = sourceItem;
        }
        
        // Create movement logs
        const timestamp = new Date().toISOString();
        const documentNumber = `MOVE-${Date.now()}`;
        const newMovements: WarehouseMovement[] = [
            {
                id: `mov_out_${Date.now()}`, timestamp, type: 'move', masterItemId, lotNumber,
                quantity: -quantity, locationId: fromLocationId, documentNumber
            },
            {
                id: `mov_in_${Date.now()}`, timestamp, type: 'move', masterItemId, lotNumber,
                quantity: quantity, locationId: toLocationId, documentNumber
            }
        ];
        setWarehouseMovements(prev => [...prev, ...newMovements]);

        // FIX: Use 't' function for translation.
        toast.success(t('Item moved successfully!'));
        return updatedItems;
    });
};


  const handleLoadFinishedGoods = (items: Omit<WarehouseItem, 'id'>[]) => {
    handleLoadItems(items);
    toast.success('Finished goods loaded to warehouse.');
  };

  // Orders
  const handleSaveOrder = (orderData: Order | Omit<Order, 'id'>) => {
    if ('id' in orderData && orderData.id && orders.some(o => o.id === orderData.id)) {
        setOrders(prev => prev.map(o => o.id === orderData.id ? orderData as Order : o));
        toast.success('Order updated!');
    } else {
        const newOrder = { ...orderData, id: `ord_${Date.now()}` };
        setOrders(prev => [...prev, newOrder]);
        toast.success('Order created!');
    }
    goBack();
  };
  const handleDeleteOrder = (orderId: string) => {
    setOrders(prev => prev.filter(o => o.id !== orderId));
    toast.success('Order deleted!');
  };

  // Others...
  const handleSaveCategory = (categoryData: Category | Omit<Category, 'id'>) => {
      if ('id' in categoryData) {
          setCategories(prev => prev.map(c => c.id === categoryData.id ? categoryData : c));
      } else {
          setCategories(prev => [...prev, { ...categoryData, id: `cat_${Date.now()}` }]);
      }
      toast.success('Category saved.');
  };
  const handleDeleteCategory = (categoryId: string) => {
      setCategories(prev => prev.filter(c => c.id !== categoryId && c.parentCategoryId !== categoryId));
      toast.success('Category deleted.');
  };

  const handleSaveSupplier = (supplierData: Supplier | Omit<Supplier, 'id'>) => {
    if ('id' in supplierData) {
        setSuppliers(prev => prev.map(s => s.id === supplierData.id ? supplierData : s));
    } else {
        setSuppliers(prev => [...prev, { ...supplierData, id: `sup_${Date.now()}` }]);
    }
    toast.success('Supplier saved.');
  };

  const handleDeleteSupplier = (supplierId: string) => {
    setSuppliers(prev => prev.filter(s => s.id !== supplierId));
    toast.success('Supplier deleted.');
  };
  
  const handleSaveCustomer = (customerData: Customer | Omit<Customer, 'id'>) => {
    if ('id' in customerData) {
        setCustomers(prev => prev.map(c => c.id === customerData.id ? customerData : c));
    } else {
        setCustomers(prev => [...prev, { ...customerData, id: `cust_${Date.now()}` }]);
    }
    toast.success('Customer saved.');
  };
  const handleDeleteCustomer = (customerId: string) => {
    setCustomers(prev => prev.filter(c => c.id !== customerId));
    toast.success('Customer deleted.');
  };

  const handleSaveLocation = (locationData: Location | Omit<Location, 'id'>) => {
    if ('id' in locationData) {
        setLocations(prev => prev.map(l => l.id === locationData.id ? locationData : l));
    } else {
        setLocations(prev => [...prev, { ...locationData, id: `loc_${Date.now()}` }]);
    }
    toast.success('Location saved.');
  };
  const handleDeleteLocation = (locationId: string) => {
    setLocations(prev => prev.filter(l => l.id !== locationId));
    toast.success('Location deleted.');
  };
  
  const handleSavePriceList = (priceList: CustomerPriceList) => {
    if (customerPriceLists.some(pl => pl.id === priceList.id)) {
        setCustomerPriceLists(prev => prev.map(pl => pl.id === priceList.id ? priceList : pl));
    } else {
        setCustomerPriceLists(prev => [...prev, { ...priceList, id: `cpl_${Date.now()}` }]);
    }
    toast.success('Price list saved!');
  };

  const renderPage = () => {
    if (formState) {
        switch (formState.page) {
            case Page.Recipes:
                const recipe = formState.mode === 'edit' ? recipes.find(r => r.id === formState.id) : null;
                return <RecipeFormPage recipe={recipe} masterItems={masterItems} categories={categories} administrationSettings={adminSettings} onSave={handleSaveRecipe} onBack={goBack} />;
            case Page.Items:
                const item = formState.mode === 'edit' ? masterItems.find(i => i.id === formState.id) : null;
                return <ItemFormPage item={item} categories={categories} suppliers={suppliers} onSave={handleSaveMasterItem} onBack={goBack} />;
            case Page.Warehouse:
                if (formState.mode === 'load') return <WarehouseLoadFormPage masterItems={masterItems} locations={locations} onSave={handleLoadItems} onBack={goBack} />;
                if (formState.mode === 'unload') return <WarehouseUnloadFormPage masterItems={masterItems} warehouseItems={warehouseItems} onSave={(items) => handleUnloadItems(items, 'unload')} onBack={goBack} />;
                break;
            case Page.Orders:
                const order = formState.mode === 'edit' ? orders.find(o => o.id === formState.id) : null;
                return <OrderFormPage order={order} customers={customers} masterItems={masterItems} categories={categories} onSave={handleSaveOrder} onBack={goBack} />;
        }
    }

    if (selectedId) {
        switch (currentPage) {
            case Page.Batches:
                const batch = batches.find(b => b.id === selectedId);
                return batch ? <BrewSheetPage batch={batch} recipes={recipes} masterItems={masterItems} warehouseItems={warehouseItems} categories={categories} locations={locations} onBack={goBack} onSave={handleSaveBatch} onUnloadItems={(items) => handleUnloadItems(items, 'brew_unload')} onLoadFinishedGoods={handleLoadFinishedGoods} /> : <p>Batch not found</p>;
            case Page.Orders:
                 const order = orders.find(o => o.id === selectedId);
                 return <OrderFormPage order={order} customers={customers} masterItems={masterItems} categories={categories} onSave={handleSaveOrder} onBack={goBack} />;
        }
    }

    switch (currentPage) {
        case Page.Dashboard: return <DashboardPage batches={batches} warehouseItems={warehouseItems} masterItems={masterItems} onNavigate={handleNavigate} />;
        case Page.Batches: return <BatchesListPage batches={batches} recipes={recipes} locations={locations} onSelectBatch={(batch) => handleNavigate({ page: Page.Batches, id: batch.id })} onCreateBatch={handleCreateBatch} onDeleteBatch={handleDeleteBatch} />;
        case Page.Recipes: return <RecipesPage recipes={recipes} masterItems={masterItems} onNewRecipe={() => openForm(Page.Recipes, 'new')} onEditRecipe={(recipe) => openForm(Page.Recipes, 'edit', recipe.id)} onDeleteRecipe={handleDeleteRecipe} onDuplicateRecipe={handleDuplicateRecipe} />;
        case Page.Calendar: return <CalendarPage batches={batches} recipes={recipes} locations={locations} masterItems={masterItems} categories={categories} onSelectBatch={(batch) => handleNavigate({ page: Page.Batches, id: batch.id })} />;
        case Page.Warehouse: return <WarehousePage warehouseItems={warehouseItems} masterItems={masterItems} locations={locations} categories={categories} onLoadItems={() => openForm(Page.Warehouse, 'load')} onUnloadItems={() => openForm(Page.Warehouse, 'unload')} onMoveItem={handleMoveItem} title={'Warehouse'} showLoadButton={true} />;
        case Page.WarehouseMovements: return <WarehouseMovementsPage movements={warehouseMovements} masterItems={masterItems} locations={locations} categories={categories} />;
        case Page.Items: return <ItemsPage masterItems={masterItems} categories={categories} onNewItem={() => openForm(Page.Items, 'new')} onEditItem={(item) => openForm(Page.Items, 'edit', item.id)} onDeleteItem={handleDeleteMasterItem} />;
        case Page.ProductionPlan: return <ProductionPlanPage recipes={recipes} masterItems={masterItems} warehouseItems={warehouseItems} suppliers={suppliers} batches={batches} />;
        case Page.Analysis: return <AnalysisPage batches={batches} recipes={recipes} masterItems={masterItems} categories={categories} warehouseItems={warehouseItems} />;
        case Page.QualityControl: return <QualityControlPage batches={batches} recipes={recipes} />;
        case Page.Orders: return <OrdersListPage orders={orders} customers={customers} onNewOrder={() => openForm(Page.Orders, 'new')} onSelectOrder={(order) => handleNavigate({ page: Page.Orders, id: order.id })} onDeleteOrder={handleDeleteOrder} />;
        case Page.Customers: return <CustomersPage customers={customers} onSaveCustomer={handleSaveCustomer} onDeleteCustomer={handleDeleteCustomer} />;
        case Page.Suppliers: return <SuppliersPage suppliers={suppliers} onSaveSupplier={handleSaveSupplier} onDeleteSupplier={handleDeleteSupplier} />;
        case Page.Locations: return <LocationsPage locations={locations} onSaveLocation={handleSaveLocation} onDeleteLocation={handleDeleteLocation} />;
        case Page.ProductionCosts: return <ProductionCostsPage recipes={recipes} masterItems={masterItems} administrationSettings={adminSettings} onSaveAdministrationSettings={setAdminSettings} />;
        case Page.PriceList: return <PriceListPage recipes={recipes} masterItems={masterItems} administrationSettings={adminSettings} onSaveMultipleItems={(items) => { const newItems = [...masterItems]; items.forEach(i => { const index = newItems.findIndex(mi => mi.id === i.id); if (index !== -1) newItems[index] = i; }); setMasterItems(newItems); toast.success('Prices saved!'); }} />;
        case Page.CustomerPriceLists: return <CustomerPriceListsPage recipes={recipes} masterItems={masterItems} customers={customers} administrationSettings={adminSettings} customerPriceLists={customerPriceLists} onSavePriceList={handleSavePriceList} />;
        case Page.Shipping: return <ShippingPage transportDocuments={transportDocuments} orders={orders} customers={customers} onNewDocument={(orderId) => toast.info('Creating transport documents is not yet implemented.')} onSelectDocument={(doc) => toast.info('Editing transport documents is not yet implemented.')} onDeleteDocument={(docId) => setTransportDocuments(prev => prev.filter(d => d.id !== docId))} />;
        case Page.Tools: return <ToolsPage />;
        case Page.Settings: return <SettingsPage categories={categories} onSaveCategory={handleSaveCategory} onDeleteCategory={handleDeleteCategory} batchNumberingSettings={batchNumberingSettings} onSaveBatchNumberingSettings={setBatchNumberingSettings} batches={batches} />;
        default: return <DashboardPage batches={batches} warehouseItems={warehouseItems} masterItems={masterItems} onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="flex h-screen bg-color-background text-color-text font-sans">
      <Sidebar currentPage={currentPage} onNavigate={handleNavigate} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="md:hidden p-4 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-md hover:bg-color-surface">
            <MenuIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {renderPage()}
        </div>
      </main>
    </div>
  );
};

export default App;