import type React from "react"

interface EditorLayoutProps {
  toolbar: React.ReactNode
  canvas: React.ReactNode
  layers: React.ReactNode
  assetGallery?: React.ReactNode
}

export function EditorLayout({ toolbar, canvas, layers, assetGallery }: EditorLayoutProps) {
  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card p-3 z-10">{toolbar}</header>
      <main className="flex flex-1 overflow-hidden">
        <section className="flex-1 flex flex-col overflow-hidden bg-muted/30">{canvas}</section>
        <aside className="w-64 border-l border-border bg-card overflow-y-auto">{layers}</aside>
      </main>
      {assetGallery}
    </div>
  )
}