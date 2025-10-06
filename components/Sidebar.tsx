import React from 'react';
import { Page } from '../types';
import { HomeIcon, BeakerIcon, CalendarIcon, BookOpenIcon, ArchiveIcon, TagIcon, TruckIcon, BuildingStoreIcon, ClipboardListIcon, ChartBarIcon, WrenchIcon, CogIcon, XIcon, ShoppingBagIcon, UsersIcon, ClipboardCheckIcon } from './Icons';
import { useTranslation } from '../hooks/useTranslation';
import { Logo } from './Logo';

interface SidebarProps {
    currentPage: Page;
    onNavigate: (page: Page) => void;
    isOpen: boolean;
    onClose: () => void;
}

interface NavItem {
    page: Page;
    labelKey: string;
    icon: React.ReactNode;
}

const productionNavItems: NavItem[] = [
    { page: Page.Dashboard, labelKey: 'Dashboard', icon: <HomeIcon className="w-5 h-5" /> },
    { page: Page.Batches, labelKey: 'Batches', icon: <BeakerIcon className="w-5 h-5" /> },
    { page: Page.Calendar, labelKey: 'Calendar', icon: <CalendarIcon className="w-5 h-5" /> },
    { page: Page.QualityControl, labelKey: 'Quality Control', icon: <ClipboardCheckIcon className="w-5 h-5" /> },
    { page: Page.Recipes, labelKey: 'Recipes', icon: <BookOpenIcon className="w-5 h-5" /> },
    { page: Page.Warehouse, labelKey: 'Raw Materials Warehouse', icon: <ArchiveIcon className="w-5 h-5" /> },
    { page: Page.Items, labelKey: 'Item Master Data', icon: <TagIcon className="w-5 h-5" /> },
    { page: Page.ProductionPlan, labelKey: 'Production Plan', icon: <ClipboardListIcon className="w-5 h-5" /> },
    { page: Page.Suppliers, labelKey: 'Suppliers', icon: <TruckIcon className="w-5 h-5" /> },
    { page: Page.Locations, labelKey: 'Locations', icon: <BuildingStoreIcon className="w-5 h-5" /> },
    { page: Page.Analysis, labelKey: 'Analysis', icon: <ChartBarIcon className="w-5 h-5" /> },
    { page: Page.Tools, labelKey: 'Tools', icon: <WrenchIcon className="w-5 h-5" /> },
];

const commercialNavItems: NavItem[] = [
    { page: Page.Orders, labelKey: 'Orders', icon: <ShoppingBagIcon className="w-5 h-5" /> },
    { page: Page.Customers, labelKey: 'Customers', icon: <UsersIcon className="w-5 h-5" /> },
    { page: Page.WarehouseFinishedGoods, labelKey: 'Finished Goods Warehouse', icon: <ArchiveIcon className="w-5 h-5" /> },
];

const settingsNavItem: NavItem = 
    { page: Page.Settings, labelKey: 'Settings', icon: <CogIcon className="w-5 h-5" /> };

const NavLink: React.FC<{
    item: NavItem;
    isActive: boolean;
    onClick: () => void;
    t: (key: string) => string;
}> = ({ item, isActive, onClick, t }) => (
    <li>
        <button
            onClick={onClick}
            className={`flex items-center space-x-3 w-full text-left p-2 rounded-md transition-colors text-sm font-semibold ${
                isActive
                ? 'bg-color-accent text-white'
                : 'text-gray-400 hover:bg-color-border hover:text-color-text'
            }`}
        >
            {item.icon}
            <span>{t(item.labelKey)}</span>
        </button>
    </li>
);

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, isOpen, onClose }) => {
    const { t } = useTranslation();
    return (
        <aside className={`bg-color-surface w-64 p-4 flex-shrink-0 flex flex-col overflow-y-auto
                           fixed md:relative md:translate-x-0
                           inset-y-0 left-0 z-40
                           transition-transform duration-300 ease-in-out
                           ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-2">
                    <Logo className="w-8 h-8" aria-label="BrewFlow Logo"/>
                    <span className="text-xl font-bold text-color-text">BrewFlow</span>
                </div>
                 <button className="md:hidden p-1 text-gray-400 hover:text-white" onClick={onClose} aria-label="Close menu">
                    <XIcon className="w-6 h-6" />
                </button>
            </div>
            
            <nav className="flex-1 flex flex-col justify-between">
                <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">{t('Production')}</h3>
                    <ul className="space-y-1">
                        {productionNavItems.map(item => (
                            <NavLink key={item.page} item={item} isActive={currentPage === item.page} onClick={() => onNavigate(item.page)} t={t} />
                        ))}
                    </ul>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-6 mb-2 px-2">{t('Commercial')}</h3>
                    <ul className="space-y-1">
                        {commercialNavItems.map(item => (
                            <NavLink key={item.page} item={item} isActive={currentPage === item.page} onClick={() => onNavigate(item.page)} t={t} />
                        ))}
                    </ul>
                    <ul className="space-y-1 mt-6 pt-6 border-t border-color-border/20">
                       <NavLink item={settingsNavItem} isActive={currentPage === settingsNavItem.page} onClick={() => onNavigate(settingsNavItem.page)} t={t} />
                    </ul>
                </div>
                <div className="text-center text-xs text-gray-600 mt-4">
                    <p>BrewFlow &copy; 2024</p>
                    <p>Version 1.1.0</p>
                </div>
            </nav>
        </aside>
    );
};

export default Sidebar;
