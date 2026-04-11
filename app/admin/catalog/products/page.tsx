"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PlusCircle, Search, PackageOpen, Loader2, Inbox, Edit, Archive, Upload, X } from "lucide-react";
import { getProducts, createProduct, updateProduct, archiveProduct, type ProductRow } from "@/app/actions/products";
import { getCategories, getBrands, getPackagingTypes, type CategoryRow, type BrandRow, type PackagingRow } from "@/app/actions/catalog";

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-gray-400">
      <Inbox className="w-10 h-10 mb-2" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

export default function ProductCatalogPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [packagingTypes, setPackagingTypes] = useState<PackagingRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductRow | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    const data = await getProducts(search);
    setProducts(data);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    Promise.all([getCategories(), getBrands(), getPackagingTypes()]).then(([cats, brs, pkgs]) => {
      setCategories(cats);
      setBrands(brs);
      setPackagingTypes(pkgs);
    });
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => loadProducts(), 300);
    return () => clearTimeout(timeout);
  }, [loadProducts]);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const form = new FormData(e.currentTarget);
    
    // Add the uploaded image URL to the form data
    if (uploadedImageUrl) {
      form.append('imageUrl', uploadedImageUrl);
    }
    
    const result = editingProduct 
      ? await updateProduct(editingProduct.id, form)
      : await createProduct(form);
      
    setSaving(false);
    if (result.success) {
      setDialogOpen(false);
      setUploadedImageUrl("");
      loadProducts();
    } else {
      alert(result.error || "Failed to save product.");
    }
  }

  async function handleImageUpload(file: File) {
    if (!file) return;
    
    setUploadingImage(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (result.success) {
        setUploadedImageUrl(result.imageUrl);
      } else {
        alert(result.error || 'Failed to upload image');
        console.error('Upload error:', result);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  }

  function removeImage() {
    setUploadedImageUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleArchive(id: string) {
    if (!confirm("Are you sure you want to archive this product?")) return;
    await archiveProduct(id);
    loadProducts();
  }

  function openEditDialog(product: ProductRow) {
    setEditingProduct(product);
    setUploadedImageUrl(product.image_url || "");
    setDialogOpen(true);
  }

  function openCreateDialog() {
    setEditingProduct(null);
    setUploadedImageUrl("");
    setDialogOpen(true);
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Product Master Catalog</h1>
          <p className="text-gray-500 text-sm">Manage products, their relationships to categories/brands, and product variants.</p>
        </div>
        <Button onClick={openCreateDialog} className="bg-[#005914] hover:bg-[#00420f]">
          <PlusCircle className="w-4 h-4 mr-2" />
          Add New Product
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
            <DialogDescription>
              {editingProduct ? "Update product details below." : "Create a new product in the catalog."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name</Label>
              <Input id="name" name="name" required placeholder="e.g. Century Tuna Flakes" defaultValue={editingProduct?.name || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" name="description" placeholder="Product description" defaultValue={editingProduct?.description || ""} />
            </div>
            <div className="space-y-2">
              <Label>Product Image</Label>
              <div className="flex items-center space-x-4">
                {uploadedImageUrl ? (
                  <div className="relative">
                    <img 
                      src={uploadedImageUrl} 
                      alt="Product" 
                      className="w-20 h-20 object-cover rounded-md border"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center">
                    <Upload className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="w-full"
                  >
                    {uploadingImage ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        {uploadedImageUrl ? 'Change Image' : 'Upload Image'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="totalPackaging">Total Packaging</Label>
                <Input id="totalPackaging" name="totalPackaging" placeholder="e.g. Box of 48" defaultValue={editingProduct?.total_packaging || ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="netWeight">Net Weight</Label>
                <Input id="netWeight" name="netWeight" placeholder="e.g. 155g" defaultValue={editingProduct?.net_weight || ""} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalCases">Total Cases</Label>
              <Input 
                id="totalCases" 
                name="totalCases" 
                type="number" 
                min="0"
                placeholder="e.g. 100" 
                defaultValue={editingProduct?.total_cases || 0} 
              />
              <p className="text-xs text-gray-500">Number of cases/boxes in inventory</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="packagingPrice">Packaging Price</Label>
              <Input 
                id="packagingPrice" 
                name="packagingPrice" 
                type="number" 
                step="0.01"
                min="0"
                placeholder="e.g. 125.50" 
                defaultValue={editingProduct?.packaging_price?.toString() || ""} 
              />
              <p className="text-xs text-gray-500">Price per packaging unit in PHP</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryId">Category</Label>
              <Select name="categoryId" defaultValue={editingProduct?.category_id?.toString() || ""}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="brandId">Brand</Label>
              <Select name="brandId" defaultValue={editingProduct?.brand_id?.toString() || ""}>
                <SelectTrigger><SelectValue placeholder="Select brand" /></SelectTrigger>
                <SelectContent>
                  {brands.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="submit" className="bg-[#005914] hover:bg-[#00420f]" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {editingProduct ? "Save Changes" : "Create Product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card className="shadow-sm border-0 rounded-xl">
        <CardHeader className="py-4 border-b border-gray-100 flex flex-row items-center justify-between">
          <div className="flex gap-3 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search SKU, name, or brand..."
                className="pl-9 h-9 border-gray-200 bg-gray-50"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-[#005914]" />
            </div>
          ) : products.length === 0 ? (
            <EmptyState message="No active products found" />
          ) : (
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Packaging Price</TableHead>
                  <TableHead>Total Packaging</TableHead>
                  <TableHead>Net Weight</TableHead>
                  <TableHead>Total Cases</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id} className="hover:bg-gray-50/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center overflow-hidden">
                          {p.image_url ? (
                            <img 
                              src={p.image_url} 
                              alt={p.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <PackageOpen className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <span className="font-semibold text-[#005914]">{p.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-500">{p.category_name ?? "—"}</TableCell>
                    <TableCell className="text-gray-500 font-medium">{p.brand_name ?? "—"}</TableCell>
                    <TableCell className="text-gray-500">
                      {p.packaging_price && typeof p.packaging_price === 'number' && p.packaging_price > 0 ? 
                        `₱${p.packaging_price.toFixed(2)}` : "—"}
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {p.total_packaging || "—"}
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {p.net_weight || "—"}
                    </TableCell>
                    <TableCell className="text-gray-700 font-semibold">
                      <span className={`px-2 py-1 rounded-md text-xs ${
                        p.total_cases === 0 ? 'bg-red-50 text-red-700' : 
                        p.total_cases < 10 ? 'bg-yellow-50 text-yellow-700' : 
                        'bg-green-50 text-green-700'
                      }`}>
                        {p.total_cases} cases
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(p)} className="text-[#005914] hover:bg-[#E2EBE5]">
                          <Edit className="w-4 h-4 mr-1" /> Edit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleArchive(p.id)} className="text-red-600 hover:bg-red-50">
                          <Archive className="w-4 h-4 mr-1" /> Archive
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
