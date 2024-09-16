interface FontData {
  family: string
  fullName: string
  postscriptName: string
  style: string
  weight: string
  stretch: string
  italic: boolean
}

interface FontAccessAPI {
  queryLocalFonts(): Promise<FontData[]>
}

interface Window {
  queryLocalFonts?: FontAccessAPI['queryLocalFonts']
}
