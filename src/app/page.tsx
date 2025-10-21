import Editor from "@/components/editor/editor"
import { Providers } from "./providers"

export default function HomePage() {
  return (
    <main>
      <Providers>
        <Editor />
      </Providers>
    </main>
  )
}