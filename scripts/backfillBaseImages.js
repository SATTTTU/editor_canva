// Backfill script to attach an Asset to designs whose base layer has no assetId but the design has a thumbnail
// Usage: node scripts/backfillBaseImages.js

const { PrismaClient } = require('@prisma/client')

async function main() {
  const prisma = new PrismaClient()
  try {
    console.log('Searching for designs with layers missing assetId and a thumbnail...')
    const designs = await prisma.design.findMany({
      where: { thumbnail: { not: null } },
      include: { layers: true },
    })

    let repaired = 0

    for (const design of designs) {
      // find any layer that has null assetId
      const missing = design.layers.filter(l => l.assetId === null)
      if (missing.length === 0) continue

      // choose base candidate: zIndex 0, or first layer
      let baseCandidate = design.layers.find(l => l.zIndex === 0) || design.layers[0]
      if (!baseCandidate) continue

      console.log(`Design ${design.id} has ${missing.length} layers missing assetId. Backfilling base layer ${baseCandidate.id} from thumbnail.`)

      // create an asset from the thumbnail (store thumbnail as url)
      try {
        const asset = await prisma.asset.create({
          data: {
            originalName: `design-${design.id}-thumbnail.png`,
            mimeType: 'image/png',
            url: design.thumbnail,
            width: null,
            height: null,
            sizeBytes: null,
          }
        })

        // update the base layer to point at this new asset
        await prisma.layer.update({ where: { id: baseCandidate.id }, data: { assetId: asset.id } })
        console.log(`Updated layer ${baseCandidate.id} -> asset ${asset.id}`)
        repaired++
      } catch (err) {
        console.error('Failed to create asset/update layer for design', design.id, err)
      }
    }

    console.log(`Done. Repaired ${repaired} designs.`)
  } catch (err) {
    console.error('Script failed:', err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
