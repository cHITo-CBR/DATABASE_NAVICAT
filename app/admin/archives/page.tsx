"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, ArchiveRestore, Inbox, Box, Tags, Scale, Layers, PackageOpen } from "lucide-react";
import { 
  getArchivedCategories, getArchivedBrands, getArchivedUnits, getArchivedPackagingTypes,
  restoreCategory, restoreBrand, restoreUnit, restorePackagingType,
  type CategoryRow, type BrandRow, type UnitRow, type PackagingRow
} from "@/app/actions/catalog";
import { getArchivedProducts, restoreProduct, type ProductRow } from "@/app/actions/products";

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-gray-400">
      <Inbox className="w-10 h-10 mb-2" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

export default function ArchivesPage() {
  const [activeTab, setActiveTab] = useState<"products" | "categories" | "brands" | "units" | "packaging">("products");
  const [loading, setLoading] = useState(false);

  const [products, setProducts] = useState<ProductRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [units, setUnits] = useState<UnitRow[]>([]);
  const [packaging, setPackaging] = useState<PackagingRow[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    if (activeTab === "products") setProducts(await getArchivedProducts());
    else if (activeTab === "categories") setCategories(await getArchivedCategories());
    else if (activeTab === "brands") setBrands(await getArchivedBrands());
    else if (activeTab === "units") setUnits(await getArchivedUnits());
    else if (activeTab === "packaging") setPackaging(await getArchivedPackagingTypes());
    setLoading(false);
  }, [activeTab]);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleRestore(id: number | string, type: typeof activeTab) {
    if (!confirm("Restore this item? It will be moved back to active status.")) return;
    
    if (type === "products") await restoreProduct(id as string);
    else if (type === "categories") await restoreCategory(id as number);
    else if (type === "brands") await restoreBrand(id as number);
    else if (type === "units") await restoreUnit(id as number);
    else if (type === "packaging") await restorePackagingType(id as number);
    
    loadData();
  }

  const tabs = [
    { id: "products", name: "Products", icon: PackageOpen },
    { id: "categories", name: "Categories", icon: Box },
    { id: "brands", name: "Brands", icon: Tags },
    { id: "units", name: "Units", icon: Scale },
    { id: "packaging", name: "Packaging", icon: Layers },
  ] as const;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">System Archives</h1>
        <p className="text-gray-500 text-sm">View and restore archived catalog settings and items.</p>
      </div>

      <div className="flex space-x-2 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-[#005914] text-[#005914]"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.name}
          </button>
        ))}
      </div>

      <Card className="shadow-sm border-0 rounded-xl">
        <CardHeader className="py-4 border-b border-gray-100">
          <CardTitle className="text-lg font-semibold text-gray-800 capitalize">Archived {activeTab}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-[#005914]" /></div>
          ) : (
            <>
              {activeTab === "products" && (
                products.length === 0 ? <EmptyState message="No archived products" /> : (
                  <Table>
                    <TableHeader className="bg-gray-50/50">
                      <TableRow>
                        <TableHead>Product Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Brand</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium text-gray-900">{p.name}</TableCell>
                          <TableCell className="text-gray-500">{p.product_categories?.name || "—"}</TableCell>
                          <TableCell className="text-gray-500">{p.brands?.name || "—"}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => handleRestore(p.id, "products")} className="text-[#005914] hover:bg-green-50">
                              <ArchiveRestore className="w-4 h-4 mr-2" /> Restore
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )
              )}

              {activeTab === "categories" && (
                categories.length === 0 ? <EmptyState message="No archived categories" /> : (
                  <Table>
                    <TableHeader className="bg-gray-50/50">
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium text-gray-900">{c.name}</TableCell>
                          <TableCell className="text-gray-500">{c.description || "—"}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => handleRestore(c.id, "categories")} className="text-[#005914] hover:bg-green-50">
                              <ArchiveRestore className="w-4 h-4 mr-2" /> Restore
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )
              )}

              {activeTab === "brands" && (
                brands.length === 0 ? <EmptyState message="No archived brands" /> : (
                  <Table>
                    <TableHeader className="bg-gray-50/50">
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {brands.map((b) => (
                        <TableRow key={b.id}>
                          <TableCell className="font-medium text-gray-900">{b.name}</TableCell>
                          <TableCell className="text-gray-500">{b.description || "—"}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => handleRestore(b.id, "brands")} className="text-[#005914] hover:bg-green-50">
                              <ArchiveRestore className="w-4 h-4 mr-2" /> Restore
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )
              )}

              {activeTab === "units" && (
                units.length === 0 ? <EmptyState message="No archived units" /> : (
                  <Table>
                    <TableHeader className="bg-gray-50/50">
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Abbreviation</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {units.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium text-gray-900">{u.name}</TableCell>
                          <TableCell className="text-gray-500">{u.abbreviation || "—"}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => handleRestore(u.id, "units")} className="text-[#005914] hover:bg-green-50">
                              <ArchiveRestore className="w-4 h-4 mr-2" /> Restore
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )
              )}

              {activeTab === "packaging" && (
                packaging.length === 0 ? <EmptyState message="No archived packaging limits" /> : (
                  <Table>
                    <TableHeader className="bg-gray-50/50">
                      <TableRow>
                        <TableHead>Total Packaging</TableHead>
                        <TableHead>Net Weight</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {packaging.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium text-gray-900">{p.name}</TableCell>
                          <TableCell className="text-gray-500">{p.description || "—"}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => handleRestore(p.id, "packaging")} className="text-[#005914] hover:bg-green-50">
                              <ArchiveRestore className="w-4 h-4 mr-2" /> Restore
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
