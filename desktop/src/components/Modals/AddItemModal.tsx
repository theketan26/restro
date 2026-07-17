import { useState, useEffect } from "react"
import Modal from "../Modal"
import { z } from "zod"
import { useCreateItem } from "@/commands/item/create-item.command"
import { showToast } from "@/components/Toast"
import { Input } from "../Input"

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

const itemSchema = z.object({
    name: z.string()
        .min(1, { message: "Name is required" })
        .transform((val) => val.trim()),
    description: z.string()
        .transform((val) => val.trim()),
    price: z.number({ message: "Price must be a valid number" })
        .min(0, { message: "Price cannot be negative" }),
    category: z.string()
        .min(1, { message: "Category is required" }),
    available: z.boolean(),
    image: z.string().optional(),
    tasteProfile: z.string().optional(),
    ingredients: z.string().optional(),
    diet: z.string().min(1, { message: "Diet classification is required" }),
});

export const AddItemModal = ({
    visible,
    onClose,
} : {
    visible: boolean;
    onClose: () => void;
}) => {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [priceString, setPriceString] = useState("");
    const [category, setCategory] = useState("Mains");
    const [available, setAvailable] = useState(true);
    const [image, setImage] = useState("");
    const [tasteProfiles, setTasteProfiles] = useState<string[]>([]);
    const [ingredients, setIngredients] = useState("");
    const [diet, setDiet] = useState("veg");
    const [error, setError] = useState<string | null>(null);

    const createItemMutation = useCreateItem();
    const loading = createItemMutation.isPending;

    // Reset form state when modal becomes visible or invisible
    useEffect(() => {
        if (!visible) {
            setName("");
            setDescription("");
            setPriceString("");
            setCategory("Mains");
            setAvailable(true);
            setImage("");
            setTasteProfiles([]);
            setIngredients("");
            setDiet("veg");
            setError(null);
            createItemMutation.reset();
        }
    }, [visible]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const toggleTasteProfile = (profile: string) => {
        setTasteProfiles(prev => 
            prev.includes(profile) 
                ? prev.filter(p => p !== profile)
                : [...prev, profile]
        );
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        
        const price = parseFloat(priceString);
        const tasteProfileString = tasteProfiles.join(", ");
        const validation = itemSchema.safeParse({ 
            name, 
            description, 
            price: isNaN(price) ? undefined : price, 
            category, 
            available,
            image: image || undefined,
            tasteProfile: tasteProfileString || undefined,
            ingredients: ingredients || undefined,
            diet,
        });
        
        if (!validation.success) {
            const firstError = validation.error.issues[0]?.message || "Invalid input";
            setError(firstError);
            return;
        }

        const validatedData = validation.data;
        setError(null);

        try {
            await createItemMutation.mutateAsync({
                name: validatedData.name,
                description: validatedData.description,
                price: validatedData.price,
                category: validatedData.category,
                available: validatedData.available,
                image: validatedData.image,
                taste_profile: validatedData.tasteProfile,
                ingredients: validatedData.ingredients,
                diet: validatedData.diet,
            });
            showToast("Item added successfully", { variant: "success" });
            onClose();
        } catch (err) {
            showToast("Failed to add item", {
                description: "An error occurred while creating the menu item.",
                variant: "error"
            });
            setError("Failed to add item. Please try again.");
        }
    };

    return (
        <Modal 
            visible={visible} 
            onClose={onClose}
            title="Add New Menu Item"
            subtitle="Enter item details below to add a new dish or beverage to the restaurant menu."
            icon={(
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )}
            color="blue"
            primaryButtonDetails={{
                label: loading ? "Adding..." : "Add Item",
                onClick: handleSubmit,
                color: "blue",
            }}
            secondaryButtonDetails={{
                label: "Cancel",
                onClick: onClose,
                color: "gray",
            }}
        >
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                <Input
                    label="Item Name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Margherita Pizza"
                    disabled={loading}
                    variant="outlined"
                    colorScheme="blue"
                    required
                />

                <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                        Description
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe the ingredients or flavor profile..."
                        disabled={loading}
                        rows={3}
                        className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-400 resize-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                        Item Image
                    </label>
                    <div className="flex items-center gap-4">
                        {image && (
                            <img src={image} alt="Preview" className="w-16 h-16 rounded-xl object-cover border border-neutral-200 dark:border-neutral-800" />
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            disabled={loading}
                            className="text-xs text-neutral-500 dark:text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-950/30 dark:file:text-blue-400 cursor-pointer"
                        />
                        {image && (
                            <button
                                type="button"
                                onClick={() => setImage("")}
                                className="text-xs text-red-600 hover:underline"
                            >
                                Remove
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Price ($)"
                        type="number"
                        step="0.01"
                        min="0"
                        value={priceString}
                        onChange={(e) => setPriceString(e.target.value)}
                        placeholder="e.g. 12.99"
                        disabled={loading}
                        variant="outlined"
                        colorScheme="blue"
                        required
                    />

                    <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                            Category
                        </label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            disabled={loading}
                            className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-400"
                            required
                        >
                            <option value="Starters">Starters</option>
                            <option value="Mains">Mains</option>
                            <option value="Sides">Sides</option>
                            <option value="Desserts">Desserts</option>
                            <option value="Beverages">Beverages</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                            Diet Classification
                        </label>
                        <select
                            value={diet}
                            onChange={(e) => setDiet(e.target.value)}
                            disabled={loading}
                            className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-400"
                            required
                        >
                            <option value="veg">Vegetarian (Veg)</option>
                            <option value="non-veg">Non-Vegetarian (Non-Veg)</option>
                            <option value="egg">Eggitarian (Contains Egg)</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        Taste Profile (Select all that apply)
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {["Spicy", "Sweet", "Sour", "Bitter", "Salty", "Savory (Umami)", "Tangy", "Fruity", "Creamy", "Herbaceous"].map((profile) => {
                            const isSelected = tasteProfiles.includes(profile);
                            const emoji = TASTE_EMOJIS[profile] || "";
                            return (
                                <button
                                    key={profile}
                                    type="button"
                                    onClick={() => toggleTasteProfile(profile)}
                                    disabled={loading}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all duration-200 ${
                                        isSelected
                                            ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                                            : "bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-50 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                                    }`}
                                >
                                    <span className="mr-1">{emoji}</span>{profile}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                        Ingredients List (comma separated)
                    </label>
                    <textarea
                        value={ingredients}
                        onChange={(e) => setIngredients(e.target.value)}
                        placeholder="e.g. Tomato Sauce, Mozzarella, Basil, Olive Oil"
                        disabled={loading}
                        rows={2}
                        className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-400 resize-none"
                    />
                </div>

                <div className="flex items-center gap-2 pt-2">
                    <input
                        type="checkbox"
                        checked={available}
                        onChange={(e) => setAvailable(e.target.checked)}
                        disabled={loading}
                        id="item-available"
                        className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                    />
                    <label htmlFor="item-available" className="text-sm font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer select-none">
                        Available for order (Show in menu)
                    </label>
                </div>

                {error && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-400 flex items-start gap-2">
                        <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}
            </form>
        </Modal>
    )
}
