import { NextRequest, NextResponse } from 'next/server'

// Server-side cache: cacheKey → image URL string
const imageCache = new Map<string, string>()

const WIKIPEDIA_UA = 'AskMyCar/1.0 (automotive assistant; contact@askmycar.app)'

// Build candidate Wikipedia article titles to try, in order of likelihood
function wikiTitles(make: string, model: string): string[] {
  const m = make.trim()
  const mo = model.trim()

  // Normalize make for common cases
  const makeMapped: Record<string, string> = {
    'ram': 'Ram',
    'gmc': 'GMC',
    'bmw': 'BMW',
    'mercedes-benz': 'Mercedes-Benz',
    'mercedes benz': 'Mercedes-Benz',
  }
  const normalMake = makeMapped[m.toLowerCase()] ?? (m.charAt(0).toUpperCase() + m.slice(1))

  const slug = (s: string) => s.replace(/\s+/g, '_')

  return [
    `${slug(normalMake)}_${slug(mo)}`,                     // Toyota_Camry
    `${slug(normalMake)}_${slug(mo)}_(automobile)`,         // disambiguation
    `${slug(normalMake)}_${slug(mo.split(' ')[0])}`,        // Ford_F (first word only)
    `${slug(normalMake)}_${slug(mo)}_pickup`,               // Ram_1500_pickup
    `${slug(normalMake)}_pickup`,                            // Ram_pickup
    `${slug(normalMake)}_${slug(mo)}_truck`,
  ]
}

async function fetchWikipediaImage(make: string, model: string): Promise<string | null> {
  const titles = wikiTitles(make, model)

  for (const title of titles) {
    try {
      const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=800&piprop=thumbnail`
      const res = await fetch(url, {
        headers: { 'User-Agent': WIKIPEDIA_UA },
        signal: AbortSignal.timeout(4000),
      })
      if (!res.ok) continue
      const data = await res.json()
      const pages = data?.query?.pages
      if (!pages) continue
      const page = Object.values(pages)[0] as Record<string, unknown>
      // Skip missing pages (-1) or pages without images
      if (page.pageid === -1) continue
      const thumb = (page.thumbnail as Record<string, string> | undefined)?.source
      if (thumb) return thumb
    } catch {
      // timeout or parse error — try next title
    }
  }
  return null
}

async function fetchBraveImage(year: number, make: string, model: string): Promise<string | null> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY
  if (!apiKey) return null

  try {
    const q = encodeURIComponent(`${year} ${make} ${model} car`)
    const res = await fetch(
      `https://api.search.brave.com/res/v1/images/search?q=${q}&count=5&safesearch=strict`,
      {
        headers: {
          'X-Subscription-Token': apiKey,
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(4000),
      }
    )
    if (!res.ok) return null
    const data = await res.json()
    const results = data?.results ?? []

    // Prefer results with "thumbnail" src that look like real car photos
    for (const r of results) {
      const src = r?.thumbnail?.src || r?.image?.src
      if (src && src.startsWith('https')) return src
    }
  } catch {
    // timeout or API error
  }
  return null
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const year = parseInt(searchParams.get('year') || '0')
  const make = searchParams.get('make') || ''
  const model = searchParams.get('model') || ''

  if (!year || !make || !model) {
    return NextResponse.json({ error: 'Missing year, make, or model' }, { status: 400 })
  }

  const cacheKey = `${year}-${make}-${model}`.toLowerCase()

  if (imageCache.has(cacheKey)) {
    return NextResponse.json({ url: imageCache.get(cacheKey) })
  }

  // Try Wikipedia first, then Brave as fallback
  const imageUrl =
    (await fetchWikipediaImage(make, model)) ??
    (await fetchBraveImage(year, make, model))

  if (imageUrl) {
    imageCache.set(cacheKey, imageUrl)
    return NextResponse.json({ url: imageUrl })
  }

  return NextResponse.json({ url: null })
}
