"use client"

import { useCallback, useEffect, useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog"
import {
    Search,
    Plus,
    Package,
    AlertTriangle,
    Edit,
    Trash2,
    CheckCircle
} from "lucide-react"
import { cn, handleStaleServerActionError } from "@/lib/utils"
import { addPartAction, deletePartAction, getPartsAction, updatePartAction, updatePartStockAction } from "@/app/actions/admin-inventory"

interface Part {
    id: string
    name: string
    sku: string
    category: string
    brand: string
    compatibleDevices: string[]
    quantity: number
    minStock: number
    price: number
    cost: number
    location: string
    supplier: string
    description: string
    createdAt: any
    updatedAt: any
}

const CATEGORIES = [
    "Screens",
    "Batteries",
    "Charging Ports",
    "Speakers",
    "Cameras",
    "Motherboards",
    "Flex Cables",
    "Buttons",
    "Housings",
    "Tools",
    "Adhesives",
    "Other"
]

const BRANDS = [
    "Apple",
    "Samsung",
    "Huawei",
    "Xiaomi",
    "OnePlus",
    "Google",
    "Sony",
    "LG",
    "Universal",
    "Other"
]

export function PartsInventory({ isAdmin = true }: { isAdmin?: boolean }) {
    const [parts, setParts] = useState<Part[]>([])
    const [loading, setLoading] = useState(true)
    const isMounted = useRef(true)

    useEffect(() => {
        isMounted.current = true
        return () => { isMounted.current = false }
    }, [])

    const [search, setSearch] = useState("")
    const [categoryFilter, setCategoryFilter] = useState("all")
    const [brandFilter, setBrandFilter] = useState("all")
    const [stockFilter, setStockFilter] = useState<"all" | "low" | "out">("all")
    const [sortBy] = useState<"name" | "quantity" | "category">("name")
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [editingPart, setEditingPart] = useState<Part | null>(null)

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        sku: "",
        category: "Screens",
        brand: "Apple",
        compatibleDevices: "",
        quantity: 0,
        minStock: 5,
        price: 0,
        cost: 0,
        location: "",
        supplier: "",
        description: ""
    })

    const fetchParts = useCallback(async () => {
        setLoading(true)
        try {
            const data = await getPartsAction()
            if (!isMounted.current) return
            setParts((data || []) as Part[])
        } catch (err) {
            if (!isMounted.current) return
            if (handleStaleServerActionError(err)) return
            setParts([])
        } finally {
            if (isMounted.current) setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchParts()
        const interval = setInterval(() => {
            if (isMounted.current) fetchParts()
        }, 30000)
        return () => clearInterval(interval)
    }, [fetchParts])

    const filteredParts = parts.filter(part => {
        const matchesSearch = search === "" ||
            part.name.toLowerCase().includes(search.toLowerCase()) ||
            part.sku.toLowerCase().includes(search.toLowerCase()) ||
            part.brand.toLowerCase().includes(search.toLowerCase())

        const matchesCategory = categoryFilter === "all" || part.category === categoryFilter
        const matchesBrand = brandFilter === "all" || part.brand === brandFilter

        const matchesStock =
            stockFilter === "all" ? true :
                stockFilter === "low" ? part.quantity <= part.minStock && part.quantity > 0 :
                    stockFilter === "out" ? part.quantity === 0 : true

        return matchesSearch && matchesCategory && matchesBrand && matchesStock
    }).sort((a, b) => {
        if (sortBy === "name") return a.name.localeCompare(b.name)
        if (sortBy === "quantity") return a.quantity - b.quantity
        if (sortBy === "category") return a.category.localeCompare(b.category)
        return 0
    })

    const handleAddPart = async () => {
        if (!formData.name.trim()) return

        try {
            if (editingPart) {
                const res = await updatePartAction(editingPart.id, {
                    ...formData,
                    compatibleDevices: formData.compatibleDevices.split(",").map(d => d.trim()).filter(Boolean),
                    updatedAt: new Date()
                })
                if ((res as any)?.error) throw new Error((res as any).error)
            } else {
                const res = await addPartAction({
                    ...formData,
                    compatibleDevices: formData.compatibleDevices.split(",").map(d => d.trim()).filter(Boolean)
                })
                if ((res as any)?.error) throw new Error((res as any).error)
            }

            resetForm()
            setIsAddDialogOpen(false)
            setEditingPart(null)
            fetchParts()
        } catch (err) {
            if (handleStaleServerActionError(err)) return
            alert("Failed to save part. Please try again.")
        }
    }

    const handleEdit = (part: Part) => {
        setFormData({
            name: part.name,
            sku: part.sku,
            category: part.category,
            brand: part.brand,
            compatibleDevices: part.compatibleDevices.join(", "),
            quantity: part.quantity,
            minStock: part.minStock,
            price: part.price,
            cost: part.cost,
            location: part.location,
            supplier: part.supplier,
            description: part.description
        })
        setEditingPart(part)
        setIsAddDialogOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (confirm("Delete this part?")) {
            try {
                const res = await deletePartAction(id)
                if ((res as any)?.error) throw new Error((res as any).error)
                fetchParts()
            } catch (err) {
                if (handleStaleServerActionError(err)) return
                alert("Failed to delete part. Please try again.")
            }
        }
    }

    const handleUpdateQuantity = async (id: string, delta: number) => {
        try {
            const res = await updatePartStockAction(id, delta)
            if ((res as any)?.error) throw new Error((res as any).error)
            fetchParts()
        } catch (err) {
            if (handleStaleServerActionError(err)) return
            alert("Failed to update stock. Please try again.")
        }
    }

    const resetForm = () => {
        setFormData({
            name: "",
            sku: "",
            category: "Screens",
            brand: "Apple",
            compatibleDevices: "",
            quantity: 0,
            minStock: 5,
            price: 0,
            cost: 0,
            location: "",
            supplier: "",
            description: ""
        })
    }

    const getStockStatus = (part: Part) => {
        if (part.quantity === 0) return { color: "bg-red-500/20 text-red-400", label: "Out of Stock" }
        if (part.quantity <= part.minStock) return { color: "bg-yellow-500/20 text-yellow-400", label: "Low Stock" }
        return { color: "bg-green-500/20 text-green-400", label: "In Stock" }
    }

    // Stats
    const totalParts = parts.length
    const totalValue = parts.reduce((sum, p) => sum + (p.quantity * p.cost), 0)
    const lowStockCount = parts.filter(p => p.quantity <= p.minStock && p.quantity > 0).length
    const outOfStockCount = parts.filter(p => p.quantity === 0).length

    if (loading) {
        return (
            <Card className="bg-white/5 border-white/10">
                <CardContent className="p-8 text-center text-white/50">
                    Loading inventory...
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-white/5 border-white/10">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-cyan-500/20 rounded-lg">
                                <Package className="w-5 h-5 text-cyan-400" />
                            </div>
                            <div>
                                <p className="text-sm text-white/60">Total Parts</p>
                                <p className="text-2xl font-bold text-white">{totalParts}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-500/20 rounded-lg">
                                <CheckCircle className="w-5 h-5 text-green-400" />
                            </div>
                            <div>
                                <p className="text-sm text-white/60">Inventory Value</p>
                                <p className="text-2xl font-bold text-white">{totalValue.toLocaleString()} AED</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-yellow-500/20 rounded-lg">
                                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                            </div>
                            <div>
                                <p className="text-sm text-white/60">Low Stock</p>
                                <p className="text-2xl font-bold text-white">{lowStockCount}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-500/20 rounded-lg">
                                <AlertTriangle className="w-5 h-5 text-red-400" />
                            </div>
                            <div>
                                <p className="text-sm text-white/60">Out of Stock</p>
                                <p className="text-2xl font-bold text-white">{outOfStockCount}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4">
                    <div className="flex flex-wrap gap-4">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                            <Input
                                placeholder="Search parts by name, SKU, or brand..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 bg-white/5 border-white/10 text-white"
                            />
                        </div>

                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="w-[150px] bg-white/5 border-white/10 text-white">
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {CATEGORIES.map(cat => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={brandFilter} onValueChange={setBrandFilter}>
                            <SelectTrigger className="w-[130px] bg-white/5 border-white/10 text-white">
                                <SelectValue placeholder="Brand" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Brands</SelectItem>
                                {BRANDS.map(brand => (
                                    <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={stockFilter} onValueChange={(v) => setStockFilter(v as any)}>
                            <SelectTrigger className="w-[130px] bg-white/5 border-white/10 text-white">
                                <SelectValue placeholder="Stock" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Stock</SelectItem>
                                <SelectItem value="low">Low Stock</SelectItem>
                                <SelectItem value="out">Out of Stock</SelectItem>
                            </SelectContent>
                        </Select>

                        {isAdmin && (
                            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button onClick={() => { resetForm(); setEditingPart(null); }} className="bg-cyan-500 hover:bg-cyan-400">
                                        <Plus className="w-4 h-4 mr-2" /> Add Part
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-zinc-900 border-white/10 text-white max-w-lg max-h-[90vh] overflow-y-auto">
                                    <DialogHeader>
                                        <DialogTitle>{editingPart ? "Edit Part" : "Add New Part"}</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm text-white/60">Part Name *</label>
                                                <Input
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    className="bg-white/5 border-white/10"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-sm text-white/60">SKU</label>
                                                <Input
                                                    value={formData.sku}
                                                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                                    className="bg-white/5 border-white/10"
                                                    placeholder="e.g. IP13-SCR-001"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm text-white/60">Category</label>
                                                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                                                    <SelectTrigger className="bg-white/5 border-white/10">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {CATEGORIES.map(cat => (
                                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <label className="text-sm text-white/60">Brand</label>
                                                <Select value={formData.brand} onValueChange={(v) => setFormData({ ...formData, brand: v })}>
                                                    <SelectTrigger className="bg-white/5 border-white/10">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {BRANDS.map(brand => (
                                                            <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-sm text-white/60">Compatible Devices (comma separated)</label>
                                            <Input
                                                value={formData.compatibleDevices}
                                                onChange={(e) => setFormData({ ...formData, compatibleDevices: e.target.value })}
                                                className="bg-white/5 border-white/10"
                                                placeholder="e.g. iPhone 13, iPhone 13 Pro"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm text-white/60">Quantity</label>
                                                <Input
                                                    type="number"
                                                    value={formData.quantity}
                                                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                                                    className="bg-white/5 border-white/10"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-sm text-white/60">Min Stock Alert</label>
                                                <Input
                                                    type="number"
                                                    value={formData.minStock}
                                                    onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
                                                    className="bg-white/5 border-white/10"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm text-white/60">Cost (AED)</label>
                                                <Input
                                                    type="number"
                                                    value={formData.cost}
                                                    onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })}
                                                    className="bg-white/5 border-white/10"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-sm text-white/60">Sell Price (AED)</label>
                                                <Input
                                                    type="number"
                                                    value={formData.price}
                                                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                                                    className="bg-white/5 border-white/10"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm text-white/60">Storage Location</label>
                                                <Input
                                                    value={formData.location}
                                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                                    className="bg-white/5 border-white/10"
                                                    placeholder="e.g. Shelf A-1"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-sm text-white/60">Supplier</label>
                                                <Input
                                                    value={formData.supplier}
                                                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                                                    className="bg-white/5 border-white/10"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-sm text-white/60">Description</label>
                                            <Input
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                className="bg-white/5 border-white/10"
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                                        <Button className="bg-cyan-500 hover:bg-cyan-400" onClick={handleAddPart}>
                                            {editingPart ? "Update" : "Add"} Part
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Parts List */}
            <Card className="bg-white/5 border-white/10">
                <CardHeader>
                    <CardTitle className="text-white flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <Package className="w-5 h-5 text-cyan-400" />
                            Parts Inventory ({filteredParts.length})
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {filteredParts.length === 0 ? (
                        <div className="text-center py-8 text-white/40">
                            {parts.length === 0 ? "No parts in inventory yet" : "No parts match your filters"}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredParts.map((part) => {
                                const status = getStockStatus(part)
                                return (
                                    <div key={part.id} className="flex items-center gap-4 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                                        <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
                                            <Package className="w-6 h-6 text-cyan-400" />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-medium text-white truncate">{part.name}</h4>
                                                <Badge variant="outline" className="text-xs bg-white/5 border-white/10">
                                                    {part.sku || "No SKU"}
                                                </Badge>
                                            </div>
                                            <div className="flex flex-wrap gap-2 text-xs text-white/50">
                                                <span>{part.category}</span>
                                                <span>•</span>
                                                <span>{part.brand}</span>
                                                {part.location && (
                                                    <>
                                                        <span>•</span>
                                                        <span>📍 {part.location}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-lg font-bold text-white">{part.quantity}</p>
                                                <Badge className={cn("text-xs", status.color)}>{status.label}</Badge>
                                            </div>

                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    onClick={() => handleUpdateQuantity(part.id, -1)}
                                                    className="text-white/60 hover:text-white"
                                                >
                                                    -
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    onClick={() => handleUpdateQuantity(part.id, 1)}
                                                    className="text-white/60 hover:text-white"
                                                >
                                                    +
                                                </Button>
                                            </div>

                                            {isAdmin && (
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        onClick={() => handleEdit(part)}
                                                        className="text-white/60 hover:text-cyan-400"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        onClick={() => handleDelete(part.id)}
                                                        className="text-white/60 hover:text-red-400"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
