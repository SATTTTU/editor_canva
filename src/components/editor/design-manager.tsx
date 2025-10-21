"use client"

import { useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import { Trash2, Download, Upload, X } from "lucide-react"
import { AppDispatch, RootState } from "@/lib/store/store"
import { deleteDesign, loadDesign } from "@/lib/store/editorSlice"
import Button from "../ui/Button"

export function DesignManager() {
  const { designs } = useSelector((state: RootState) => state.editor)
  const dispatch = useDispatch<AppDispatch>()
  const [isOpen, setIsOpen] = useState(false)

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
           <Button variant="primary" size="sm" onClick={() => setIsOpen(false)}><X className="w-5 h-5" /></Button>
        </header>

        <main className="flex-1 overflow-y-auto p-4">
          {designs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">No saved designs</div>
          ) : (
            <div className="space-y-2">
              {designs.map((design) => (
                <div key={design.id} className="flex items-center justify-between p-3 bg-muted rounded">
                  <div>
                    <p className="font-medium text-sm">{design.name}</p>
                    <p className="text-xs text-muted-foreground">{new Date(design.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => { dispatch(loadDesign(design.id)); setIsOpen(false); }} className="gap-2">
                      <Upload className="w-4 h-4" /> Load
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => dispatch(deleteDesign(design.id))} className="text-destructive">
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