
import React, { useState } from 'react';
import {
  Page, Recipe, BrewSheet, MasterItem, WarehouseItem, Category, Location, Supplier, Customer, Order,
  BatchNumberingSettings, AdministrationSettings, CustomerPriceList, TransportDocument
} from './types';
import { Sidebar } from './components/Sidebar';
import { MenuIcon } from './components/Icons';
import usePersistentState from './hooks/usePersistentState';
import { useToast } from './hooks/useToast';
import {
  mockRecipes, mockBatches, mockMasterItems, mockWarehouseItems, mockCategories,
  mockLocations, mockSuppliers, mockCustomers, mockOrders, mockBatchNumberingSettings,
  mockAdminSettings, mockCustomerPriceLists, mockTransportDocuments, generateBrewSheetFromRecipe
} from './data/mockData';

// Import all page components
import DashboardPage from './pages/DashboardPage';
import BatchesListPage from './pages/BatchesListPage';
import BrewSheetPage from './pages/BrewSheetPage';
import RecipesPage from './pages/RecipesPage';
import RecipeFormPage from './pages/RecipeFormPage';
import CalendarPage from './pages/CalendarPage';
import WarehousePage from './pages/WarehousePage';
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
    const newItems: WarehouseItem[] = items.map(item => ({
        ...item,
        id: `wh_${Date.now()}_${Math.random()}`
    }));
    setWarehouseItems(prev => [...prev, ...newItems]);
    toast.success(`${items.length} item(s) loaded into warehouse.`);
    goBack();
  };

  const handleUnloadItems = (items: Omit<WarehouseItem, 'id'>[]) => {
    setWarehouseItems(prev => {
        const newWhItems = [...prev];
        items.forEach(itemToUnload => {
            let remainingQty = itemToUnload.quantity;
            const relevantLots = newWhItems
                .filter(i => i.masterItemId === itemToUnload.masterItemId && i.lotNumber === itemToUnload.lotNumber)
                .sort((a,b) => new Date(a.arrivalDate).getTime() - new Date(b.arrivalDate).getTime());

            for (const lot of relevantLots) {
                if (remainingQty <= 0) break;
                const toRemove = Math.min(remainingQty, lot.quantity);
                lot.quantity -= toRemove;
                remainingQty -= toRemove;
            }
        });
        return newWhItems.filter(i => i.quantity > 0.001);
    });
    toast.success(`${items.length} type(s) of items unloaded from warehouse.`);
    goBack();
  };

  const handleLoadFinishedGoods = (items: Omit<WarehouseItem, 'id'>[]) => {
    handleLoadItems(items);
    toast.success('Finished goods loaded to warehouse.');
  };

  // Orders
  const handleSaveOrder = (orderData: Order) => {
    if (orders.some(o => o.id === orderData.id)) {
        setOrders(prev => prev.map(o => o.id === orderData.id ? orderData : o));
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
                if (formState.mode === 'unload') return <WarehouseUnloadFormPage masterItems={masterItems} warehouseItems={warehouseItems} onSave={handleUnloadItems} onBack={goBack} />;
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
                return batch ? <BrewSheetPage batch={batch} recipes={recipes} masterItems={masterItems} warehouseItems={warehouseItems} categories={categories} locations={locations} onBack={goBack} onSave={handleSaveBatch} onUnloadItems={handleUnloadItems} onLoadFinishedGoods={handleLoadFinishedGoods} /> : <p>Batch not found</p>;
            case Page.Orders:
                 const order = orders.find(o => o.id === selectedId);
                 return <OrderFormPage order={order} customers={customers} masterItems={masterItems} categories={categories} onSave={handleSaveOrder} onBack={goBack} />;
        }
    }

    switch (currentPage) {
        case Page.Dashboard: return <DashboardPage batches={batches} warehouseItems={warehouseItems} masterItems={masterItems} onNavigate={handleNavigate} />;
        case Page.Batches: return <BatchesListPage batches={batches} recipes={recipes} locations={locations} onSelectBatch={(batch) => handleNavigate({ page: Page.Batches, id: batch.id })} onCreateBatch={handleCreateBatch} onDeleteBatch={handleDeleteBatch} />;
        case Page.Recipes: return <RecipesPage recipes={recipes} masterItems={masterItems} onNewRecipe={() => openForm(Page.Recipes, 'new')} onEditRecipe={(recipe) => openForm(Page.Recipes, 'edit', recipe.id)} onDeleteRecipe={handleDeleteRecipe} />;
        case Page.Calendar: return <CalendarPage batches={batches} recipes={recipes} locations={locations} masterItems={masterItems} categories={categories} onSelectBatch={(batch) => handleNavigate({ page: Page.Batches, id: batch.id })} />;
        case Page.Warehouse: return <WarehousePage warehouseItems={warehouseItems} masterItems={masterItems} locations={locations} categories={categories} onLoadItems={() => openForm(Page.Warehouse, 'load')} onUnloadItems={() => openForm(Page.Warehouse, 'unload')} onMoveItems={() => {}} title={'Warehouse'} showLoadButton={true} />;
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
