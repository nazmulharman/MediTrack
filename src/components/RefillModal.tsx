import React, { useState } from 'react';
import { Medicine } from '../types/medicine';

interface RefillModalProps {
  medicine: Medicine | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmRefill: (medicineId: string, addedCount: number, newStockDirect?: number) => void;
  dailyConsumedToday?: number;
}

export const RefillModal: React.FC<RefillModalProps> = ({
  medicine,
  isOpen,
  onClose,
  onConfirmRefill,
  dailyConsumedToday = 0,
}) => {
  if (!isOpen || !medicine) return null;

  const [mode, setMode] = useState<'refill' | 'adjust'>('refill');
  const [quantity, setQuantity] = useState<number>(20);
  const [directStock, setDirectStock] = useState<number>(medicine.remainingQuantity);

  const newTotal = medicine.remainingQuantity + quantity;
  const dosesPerDay = medicine.scheduledTimes.length || 2;
  const estimatedDays = Math.floor(
    mode === 'refill' ? newTotal / dosesPerDay : directStock / dosesPerDay
  );

  const handleConfirm = () => {
    if (mode === 'refill') {
      onConfirmRefill(medicine.id, quantity);
    } else {
      onConfirmRefill(medicine.id, 0, directStock);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-inverse-surface/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-surface-container-lowest rounded-3xl max-w-sm w-full p-5 shadow-2xl flex flex-col gap-3.5 border border-surface-container">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-container-low pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-secondary-container text-on-secondary-container flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-[22px]">inventory_2</span>
            </div>
            <div>
              <h3 className="font-headline font-bold text-base text-on-surface">
                Medicine Stock Options
              </h3>
              <p className="text-[11px] text-on-surface-variant font-medium">
                Refill, adjust inventory & consumption
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container-low text-on-surface-variant hover:text-on-surface flex items-center justify-center"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Medicine summary info */}
        <div className="bg-surface-container-low p-3 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-headline font-bold text-sm text-on-surface">{medicine.name}</h4>
              <p className="text-[11px] text-on-surface-variant">
                {medicine.strength}
                {medicine.strengthUnit} • {medicine.form}
              </p>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                medicine.remainingQuantity <= medicine.refillTrigger
                  ? 'bg-error-container text-on-error-container'
                  : 'bg-secondary-fixed text-on-secondary-fixed-variant'
              }`}
            >
              {medicine.remainingQuantity <= medicine.refillTrigger ? 'Low Stock' : 'In Stock'}
            </span>
          </div>

          {/* Daily Consumed Metrics */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-surface-container text-center">
            <div className="p-2 rounded-xl bg-surface-container-lowest">
              <span className="text-[10px] text-outline font-semibold uppercase block">
                Consumed Today
              </span>
              <span className="font-headline font-bold text-base text-primary">
                {dailyConsumedToday} {medicine.form}s
              </span>
            </div>
            <div className="p-2 rounded-xl bg-surface-container-lowest">
              <span className="text-[10px] text-outline font-semibold uppercase block">
                In-Hand Stock
              </span>
              <span className="font-headline font-bold text-base text-on-surface">
                {medicine.remainingQuantity} {medicine.form}s
              </span>
            </div>
          </div>
        </div>

        {/* Mode selector */}
        <div className="grid grid-cols-2 p-1 bg-surface-container rounded-xl gap-1">
          <button
            type="button"
            onClick={() => setMode('refill')}
            className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
              mode === 'refill'
                ? 'bg-surface-container-lowest text-primary shadow-sm'
                : 'text-on-surface-variant'
            }`}
          >
            + Add Refill Supply
          </button>
          <button
            type="button"
            onClick={() => setMode('adjust')}
            className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
              mode === 'adjust'
                ? 'bg-surface-container-lowest text-primary shadow-sm'
                : 'text-on-surface-variant'
            }`}
          >
            Adjust Exact Stock
          </button>
        </div>

        {mode === 'refill' ? (
          /* Refill mode */
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
              Add Received Units (Tablets/Capsules)
            </label>
            <div className="flex items-center justify-center gap-3 py-1">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 5))}
                className="w-9 h-9 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-primary font-bold text-lg flex items-center justify-center active:scale-95"
                type="button"
              >
                -
              </button>
              <div className="flex items-baseline gap-1">
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-16 text-center font-headline text-2xl font-extrabold text-primary bg-surface-container-low rounded-xl py-1 focus:outline-none"
                />
                <span className="text-xs font-bold text-on-surface-variant">{medicine.form}s</span>
              </div>
              <button
                onClick={() => setQuantity(quantity + 5)}
                className="w-9 h-9 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-primary font-bold text-lg flex items-center justify-center active:scale-95"
                type="button"
              >
                +
              </button>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {[10, 20, 30, 60].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setQuantity(preset)}
                  className={`py-1.5 rounded-xl text-xs font-bold transition-all ${
                    quantity === preset
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                  }`}
                >
                  +{preset}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Direct manual adjust mode */
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
              Set Exact In-Hand Physical Stock
            </label>
            <div className="flex items-center justify-center gap-3 py-1">
              <button
                onClick={() => setDirectStock(Math.max(0, directStock - 1))}
                className="w-9 h-9 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-primary font-bold text-lg flex items-center justify-center active:scale-95"
                type="button"
              >
                -1
              </button>
              <div className="flex items-baseline gap-1">
                <input
                  type="number"
                  min="0"
                  value={directStock}
                  onChange={(e) => setDirectStock(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-16 text-center font-headline text-2xl font-extrabold text-primary bg-surface-container-low rounded-xl py-1 focus:outline-none"
                />
                <span className="text-xs font-bold text-on-surface-variant">{medicine.form}s</span>
              </div>
              <button
                onClick={() => setDirectStock(directStock + 1)}
                className="w-9 h-9 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-primary font-bold text-lg flex items-center justify-center active:scale-95"
                type="button"
              >
                +1
              </button>
            </div>
            <p className="text-[10px] text-center text-outline">
              Useful for inventory audit or dropped tablets
            </p>
          </div>
        )}

        <div className="bg-secondary-fixed/30 p-2.5 rounded-xl flex items-center justify-between text-on-secondary-fixed-variant text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-primary">event_available</span>
            <span>New Supply Forecast:</span>
          </div>
          <span className="font-bold text-primary">
            {mode === 'refill' ? newTotal : directStock} units (~{estimatedDays} days)
          </span>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-full bg-surface-container text-on-surface-variant font-bold text-xs hover:bg-surface-container-high active:scale-95 transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 py-2.5 rounded-full bg-primary text-on-primary font-bold text-xs shadow-md hover:bg-primary-container active:scale-95 transition-all flex items-center justify-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">check</span>
            Save Inventory
          </button>
        </div>
      </div>
    </div>
  );
};
