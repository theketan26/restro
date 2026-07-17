import Modal from "../Modal"
import type { Item } from "@/domain/models/item"
import { httpClient } from "@/infrastructure/http/axios-client"

const TASTE_EMOJIS: Record<string, string> = {
    "Spicy": "🌶️",
    "Sweet": "🍭",
    "Sour": "🍋",
    "Bitter": "🌿",
    "Salty": "🧂",
    "Savory (Umami)": "🍄",
    "Tangy": "🍊",
    "Fruity": "🍓",
    "Creamy": "🥛",
    "Herbaceous": "🌱"
};

export const ViewItemModal = ({
    item,
    visible,
    onClose,
} : {
    item: Item | null;
    visible: boolean;
    onClose: () => void;
}) => {
    if (!item) return null;

    // Helper to format image url from server relative path
    const getImageUrl = (path: string) => {
        if (!path) return "";
        if (path.startsWith("data:")) return path;
        const apiBase = httpClient.defaults.baseURL || "http://127.0.0.1:2326/api";
        const root = apiBase.endsWith("/api") ? apiBase.slice(0, -4) : apiBase;
        return `${root}${path}`;
    };

    const isAvailable = item.available !== false;
    const ingredientsList = item.ingredients
        ? item.ingredients.split(",").map((ing) => ing.trim()).filter(Boolean)
        : [];

    return (
        <Modal 
            visible={visible} 
            onClose={onClose}
            title="Menu Item Details"
            subtitle="View complete details and ingredients for this dish."
            icon={(
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
            )}
            color="blue"
            secondaryButtonDetails={{
                label: "Close Details",
                onClick: onClose,
                color: "gray",
            }}
        >
            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
                {/* Image Banner */}
                {item.image ? (
                    <div className="relative w-full h-48 rounded-2xl overflow-hidden border border-neutral-100 dark:border-neutral-800">
                        <img 
                            src={getImageUrl(item.image)} 
                            alt={item.name} 
                            className="w-full h-full object-cover"
                        />
                    </div>
                ) : (
                    <div className="w-full h-32 rounded-2xl bg-neutral-50 dark:bg-neutral-900/50 flex flex-col items-center justify-center border border-dashed border-neutral-200 dark:border-neutral-800 text-neutral-400">
                        <svg className="w-10 h-10 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs">No image uploaded</span>
                    </div>
                )}

                {/* Primary Info Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                            {item.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1.5">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                item.category === "Starters"
                                ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50"
                                : item.category === "Mains"
                                    ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900/50"
                                    : item.category === "Sides"
                                    ? "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/30 dark:text-pink-400 dark:border-pink-900/50"
                                    : item.category === "Desserts"
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50"
                                        : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50"
                            }`}>
                                {item.category || "General"}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                item.diet === "veg"
                                ? "bg-green-50/50 text-green-700 border-green-200/50 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900/50"
                                : item.diet === "egg"
                                    ? "bg-amber-50/50 text-amber-700 border-amber-200/50 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50"
                                    : "bg-red-50/50 text-red-700 border-red-200/50 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50"
                            }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                    item.diet === "veg" ? "bg-green-500" : item.diet === "egg" ? "bg-amber-500" : "bg-red-500"
                                }`} />
                                {item.diet === "veg" ? "Veg" : item.diet === "egg" ? "Egg" : "Non-Veg"}
                            </span>
                            <div className="flex items-center gap-1.5 ml-1">
                                <span className={`w-2 h-2 rounded-full ${isAvailable ? "bg-green-500" : "bg-red-500"}`} />
                                <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                                    {isAvailable ? "Available" : "Unavailable"}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
                        ${item.price.toFixed(2)}
                    </div>
                </div>

                {/* Description */}
                <div>
                    <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                        Description
                    </h4>
                    <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed bg-neutral-50 dark:bg-neutral-900/30 p-3.5 rounded-xl border border-neutral-100 dark:border-neutral-800">
                        {item.description || "No description provided for this menu item."}
                    </p>
                </div>

                {/* Taste Profile */}
                {item.taste_profile && (
                    <div>
                        <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                            Taste Profile
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                            {item.taste_profile.split(",").map((s) => s.trim()).filter(Boolean).map((profile) => {
                                const emoji = TASTE_EMOJIS[profile] || "✨";
                                return (
                                    <span 
                                        key={profile}
                                        className="inline-flex items-center px-3 py-1 rounded-xl bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-900/50 text-xs font-semibold"
                                    >
                                        <span className="mr-1">{emoji}</span> {profile}
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Ingredients List */}
                <div>
                    <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                        Ingredients ({ingredientsList.length})
                    </h4>
                    {ingredientsList.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                            {ingredientsList.map((ing, idx) => (
                                <span 
                                    key={idx} 
                                    className="px-2.5 py-1 text-xs font-medium rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200/50 dark:border-neutral-700/50"
                                >
                                    {ing}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 italic">
                            No ingredients list specified.
                        </p>
                    )}
                </div>
            </div>
        </Modal>
    );
};
