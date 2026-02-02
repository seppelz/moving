import { motion } from 'framer-motion'
import { Truck } from 'lucide-react'
import clsx from 'clsx'

interface TruckVisualizerProps {
    totalVolume: number
    className?: string
    showLabels?: boolean
}

export default function TruckVisualizer({
    totalVolume,
    className,
    showLabels = true
}: TruckVisualizerProps) {
    // Truck capacity visualization (e.g. 3.5t truck ~ 20m3, 7.5t ~ 35m3, 12t ~ 50m3)
    const truckCapacity = totalVolume <= 18 ? 20 : (totalVolume <= 32 ? 35 : 50)
    const truckProgress = Math.min((totalVolume / truckCapacity) * 100, 100)

    const recommendation = totalVolume <= 18
        ? '3.5t Transporter'
        : (totalVolume <= 32 ? '7.5t LKW' : '12t LKW')

    return (
        <div className={clsx("bg-gray-100 rounded-2xl p-6", className)}>
            {showLabels && (
                <div className="flex justify-between items-end mb-2">
                    <span className="text-3xl font-black text-primary-600">
                        {totalVolume.toFixed(1)} <span className="text-lg font-bold">m³</span>
                    </span>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                        LKW Kapazität
                    </span>
                </div>
            )}

            <div className="h-3 bg-white rounded-full overflow-hidden border border-gray-200 mb-3 relative">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${truckProgress}%` }}
                    className={clsx("h-full transition-colors duration-500", {
                        'bg-green-500': truckProgress < 80,
                        'bg-orange-500': truckProgress >= 80 && truckProgress < 95,
                        'bg-red-500': truckProgress >= 95,
                    })}
                />
            </div>

            <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-2">
                <Truck className="w-3 h-3" />
                Empfehlung: <span className="font-bold text-gray-700">{recommendation}</span>
            </p>
        </div>
    )
}
