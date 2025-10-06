

import React, { useState, useMemo } from 'react';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import { useTranslation } from '../hooks/useTranslation';
import { WrenchIcon } from '../components/Icons';

// Data for calculation
// CO2 volumes dissolved in beer at atmospheric pressure
const residualCo2Table: { [tempC: number]: number } = {
    10: 1.20, 11: 1.16, 12: 1.12, 13: 1.09, 14: 1.05, 15: 1.02,
    16: 0.99, 17: 0.96, 18: 0.93, 19: 0.90, 20: 0.88, 21: 0.85,
    22: 0.83, 23: 0.81, 24: 0.78, 25: 0.76, 26: 0.74, 27: 0.72,
    28: 0.70, 29: 0.68, 30: 0.66
};

const PrimingCalculator: React.FC = () => {
    const { t } = useTranslation();
    const [volume, setVolume] = useState<string>('20');
    const [temperature, setTemperature] = useState<string>('20');
    const [targetCo2, setTargetCo2] = useState<string>('2.4');

    const calculatedValues = useMemo(() => {
        const numVolume = parseFloat(volume);
        const numTemp = parseFloat(temperature);
        const numTargetCo2 = parseFloat(targetCo2);

        if (isNaN(numVolume) || isNaN(numTemp) || isNaN(numTargetCo2) || numVolume <= 0) {
            return { residualCo2: 0, primingSugars: {} };
        }

        // Find closest temperature in the table
        const closestTemp = Object.keys(residualCo2Table).reduce((prev, curr) => 
            (Math.abs(parseInt(curr) - numTemp) < Math.abs(parseInt(prev) - numTemp) ? curr : prev)
        );
        const residualCo2 = residualCo2Table[parseInt(closestTemp, 10)];

        const co2Deficit = numTargetCo2 - residualCo2;
        if (co2Deficit <= 0) {
             return { residualCo2, primingSugars: {} };
        }

        // Base calculation for Sucrose (table sugar) in grams
        const baseSucroseGrams = 4 * numVolume * co2Deficit;
        
        const primingSugars = {
            [t('Table Sugar (Sucrose)')]: baseSucroseGrams,
            [t('Corn Sugar (Dextrose)')]: baseSucroseGrams / 0.91,
            [t('Dry Malt Extract (DME)')]: baseSucroseGrams / 0.68,
        };
        
        return { residualCo2, primingSugars };

    }, [volume, temperature, targetCo2, t]);

    return (
        <Card title={t('Priming Sugar Calculator')} icon={<WrenchIcon className="w-5 h-5"/>}>
            <p className="text-sm text-gray-500 mb-4">{t('Enter your batch details to calculate the required priming sugar.')}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input 
                    label={t('Beer Volume (L)')}
                    type="number"
                    value={volume}
                    onChange={(e) => setVolume(e.target.value)}
                    step="0.1"
                    min="0"
                />
                <Input 
                    label={t('Highest Fermentation Temp (°C)')}
                    type="number"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    step="1"
                />
                <Input 
                    label={t('Target CO2 Volumes')}
                    type="number"
                    value={targetCo2}
                    onChange={(e) => setTargetCo2(e.target.value)}
                    step="0.1"
                    min="0"
                />
            </div>

            <div className="mt-6">
                <h3 className="text-lg font-semibold text-color-secondary mb-2">{t('Calculation Results')}</h3>
                <div className="bg-color-background p-4 rounded-lg">
                    <div className="mb-3">
                        <span className="text-gray-500">{t('Residual CO2 (approx.)')}: </span>
                        <span className="font-bold font-mono text-color-accent">{calculatedValues.residualCo2.toFixed(2)} vol</span>
                    </div>
                    {Object.keys(calculatedValues.primingSugars).length > 0 ? (
                        <table className="w-full text-left">
                            <thead className="border-b-2 border-color-border">
                                <tr>
                                    <th className="py-2">{t('Sugar Type')}</th>
                                    <th className="py-2 text-right">{t('Required Amount')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-color-border">
                                {Object.entries(calculatedValues.primingSugars).map(([name, amount]) => (
                                    <tr key={name}>
                                        <td className="py-2">{name}</td>
                                        <td className="py-2 text-right font-mono font-semibold">{Number(amount).toFixed(1)} g</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="text-gray-500">{t('No priming sugar needed, beer is already carbonated.')}</p>
                    )}
                </div>
            </div>
        </Card>
    );
};


const ToolsPage: React.FC = () => {
    const { t } = useTranslation();
    return (
        <div className="h-full flex flex-col">
            <h1 className="text-3xl font-bold text-color-text mb-6 flex-shrink-0">{t('Tools')}</h1>
            <div className="space-y-6">
                <PrimingCalculator />
            </div>
        </div>
    )
};

export default ToolsPage;