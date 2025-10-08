import React from 'react';
import { Page } from '../types';
import { Logo } from './Logo';
import {
    HomeIcon, BeakerIcon, BookOpenIcon, ArchiveIcon, TagIcon, ClipboardListIcon, ChartBarIcon,
    ClipboardCheckIcon, ShoppingBagIcon, UsersIcon, TruckIcon, BuildingStoreIcon, WrenchIcon,
    CogIcon, CalendarIcon
} from './Icons';
import { useTranslation } from '../hooks/useTranslation';

interface SidebarProps {
    currentPage: Page;
    onNavigate: (page: Page) => void;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const navItems = [
    { page: Page.Dashboard, icon: HomeIcon, labelKey: 'Dashboard' },
    {
        labelKey: 'Sidebar_Production',
        subItems: [
            { page: Page.Calendar, icon: CalendarIcon, labelKey: 'Calendar' },
            { page: Page.Batches, icon: BeakerIcon, labelKey: 'Batches' },
            { page: Page.Recipes, icon: BookOpenIcon, labelKey: 'Recipes' },
        ]
    },
    {
        labelKey: 'Sidebar_Warehouse',
        subItems: [
            { page: Page.Warehouse, icon: ArchiveIcon, labelKey: 'Warehouse' },
            { page: Page.Items, icon: TagIcon, labelKey: 'Items' },
        ]
    },
    {
        labelKey: 'Sidebar_Commercial',
        subItems: [
            { page: Page.Orders, icon: ShoppingBagIcon, labelKey: 'Orders' },
            { page: Page.Customers, icon: UsersIcon, labelKey: 'Customers' },
            { page: Page.CustomerPriceLists, icon: UsersIcon, labelKey: 'Customer Price Lists' },
            { page: Page.Shipping, icon: TruckIcon, labelKey: 'Shipping' },
        ]
    },
    {
        labelKey: 'Sidebar_Planning',
        subItems: [
            { page: Page.ProductionPlan, icon: ClipboardListIcon, labelKey: 'Production Plan' },
            { page: Page.Analysis, icon: ChartBarIcon, labelKey: 'Analysis' },
            { page: Page.QualityControl, icon: ClipboardCheckIcon, labelKey: 'Quality Control' },
        ]
    },
    {
        labelKey: 'Sidebar_Admin',
        subItems: [
            { page: Page.ProductionCosts, icon: ChartBarIcon, labelKey: 'Production Costs' },
            { page: Page.PriceList, icon: TagIcon, labelKey: 'Price Lists' },
            { page: Page.Suppliers, icon: TruckIcon, labelKey: 'Suppliers' },
            { page: Page.Locations, icon: BuildingStoreIcon, labelKey: 'Locations' },
        ]
    },
    {
        labelKey: 'Sidebar_Settings',
        subItems: [
            { page: Page.Tools, icon: WrenchIcon, labelKey: 'Tools' },
            { page: Page.Settings, icon: CogIcon, labelKey: 'Settings' },
        ]
    }
];

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, isOpen, setIsOpen }) => {
    const { t } = useTranslation();

    const NavLink: React.FC<{ page: Page, icon: React.ElementType, labelKey: string }> = ({ page, icon: Icon, labelKey }) => {
        const isActive = currentPage === page;
        return (
            <button
                onClick={() => onNavigate(page)}
                className={`flex items-center w-full space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-color-accent text-white shadow-md' : 'text-gray-400 hover:bg-color-surface hover:text-color-text'
                }`}
            >
                <Icon className="w-5 h-5" />
                <span>{t(labelKey)}</span>
            </button>
        );
    };

    return (
        <>
            <div className={`fixed inset-0 bg-black/60 z-30 md:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsOpen(false)}></div>
            <aside className={`flex-shrink-0 w-64 bg-color-surface text-color-text flex flex-col p-4 fixed md:relative h-full z-40 transform transition-transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
                <div className="flex items-center space-x-2 pb-4 px-2 border-b border-color-border mb-4">
                    <Logo className="h-10 w-10" />
                    <span className="font-bold text-2xl text-color-accent">BrewFlow</span>
                </div>
                <nav className="flex-1 space-y-2 overflow-y-auto pr-2 -mr-2">
                    {navItems.map((item, index) => {
                        if ('subItems' in item) {
                            return (
                                <div key={index} className="space-y-2">
                                    <h3 className="px-3 pt-4 pb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t(item.labelKey)}</h3>
                                    {item.subItems.map(subItem => (
                                        <NavLink key={subItem.page} page={subItem.page} icon={subItem.icon} labelKey={subItem.labelKey} />
                                    ))}
                                </div>
                            );
                        }
                        return <NavLink key={item.page} page={item.page} icon={item.icon} labelKey={item.labelKey} />;
                    })}
                </nav>
            </aside>
        </>
    );
};