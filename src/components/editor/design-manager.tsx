"use client"

import { useState } from "react"
import { useDispatch } from "react-redux"
import { Trash2, Download, Upload, X, Loader2 } from "lucide-react"
import { AppDispatch } from "@/lib/store/store"
import { loadDesign } from "@/lib/store/editorSlice" // <-- This import now works correctly
import useDesigns from "@/hooks/useDesigns"
import Button from "../ui/Button"

export function DesignManager() {
  const dispatch = useDispatch<AppDispatch>()
  const { designs, loading, error, fetchDesigns } = useDesigns()
  const [isOpen, setIsOpen] = useState(false)

  const handleLoadDesign = async (designId: string) => {
    try {
      const res = await fetch(`/api/designs/${designId}`)
      if (res.ok) {
        const serverDesign = await res.json()
        // Dispatch the action with the fetched design object as the payload
        dispatch(loadDesign(serverDesign))
        setIsOpen(false)
      } else {
        alert("Failed to load the selected design.");
      }
    } catch (err) {
      console.error("Error loading design:", err);
      alert("An error occurred while loading the design.");
    }
  };

  const handleDeleteDesign = async (designId: string) => {
    if (!confirm('Are you sure you want to delete this design?')) return;
    try {
      await fetch(`/api/designs/${designId}`, { method: 'DELETE' });
      fetchDesigns(); // Refresh the list after deleting
    } catch (err) {
      alert("Failed to delete design.");
    }
  };

  if (!isOpen) {
    return (
      <Button size="sm" variant="outline" onClick={() => setIsOpen(true)} className="gap-2">
        <Download className="w-4 h-4" /> Designs
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg shadow-lg w-full max-w-lg max-h-[500px] flex flex-col">
        <header className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold">Saved Designs</h2>
           <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}><X className="w-5 h-5" /></Button>
        </header>

        <main className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">Loading...</div>
          ) : error ? (
            <div className="text-red-600 p-4">{error}</div>
          ) : (!designs || designs.length === 0) ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">No saved designs</div>
          ) : (
            <div className="space-y-2">
              {designs.map((design: any) => (
                <div key={design.id} className="flex items-center justify-between p-3 bg-muted rounded">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{design.title ?? 'Untitled Design'}</p>
                    <p className="text-xs text-muted-foreground">{new Date(design.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleLoadDesign(design.id)} className="gap-2">
                      <Upload className="w-4 h-4" /> Load
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteDesign(design.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
        <footer className="border-t p-4">
          <Button variant="outline" onClick={() => setIsOpen(false)} className="w-full">Close</Button>
        </footer>
      </div>
    </div>
  )
}