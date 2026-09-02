import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

const PRESENTATION_ROOT = path.join(process.cwd(), 'src/presentation')
const EMOJI_PRESENTATION = /\p{Emoji_Presentation}/u

function productionTsxFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      return entry.name === '__tests__' ? [] : productionTsxFiles(entryPath)
    }
    return entry.name.endsWith('.tsx') ? [entryPath] : []
  })
}

function emojiButtonChildren(filePath: string): string[] {
  const source = fs.readFileSync(filePath, 'utf8')
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  )
  const findings: string[] = []

  function visit(node: ts.Node): void {
    if (
      ts.isJsxElement(node)
      && node.openingElement.tagName.getText(sourceFile) === 'button'
    ) {
      const renderedChildren = node.children.map(child => child.getText(sourceFile)).join(' ')
      if (EMOJI_PRESENTATION.test(renderedChildren)) {
        const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
        findings.push(`${path.relative(process.cwd(), filePath)}:${line + 1}`)
      }
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return findings
}

describe('emoji-domängräns för knappar', () => {
  it('renderar Lucide eller typografiska tecken, aldrig emoji-glyfer, i knappar', () => {
    const findings = productionTsxFiles(PRESENTATION_ROOT).flatMap(emojiButtonChildren)
    expect(findings).toEqual([])
  })

  it('håller inställningsmenyn fri från de tidigare dynamiska emoji-etiketterna', () => {
    const gameHeader = fs.readFileSync(
      path.join(PRESENTATION_ROOT, 'components/GameHeader.tsx'),
      'utf8',
    )
    expect(gameHeader).not.toMatch(/[💾📂⬇️⬆️]/u)
  })

  it('håller History-flikarna på den delade textbaserade TabBar-vokabulären', () => {
    const historyScreen = fs.readFileSync(
      path.join(PRESENTATION_ROOT, 'screens/HistoryScreen.tsx'),
      'utf8',
    )
    expect(historyScreen).toContain('<TabBar')
    expect(historyScreen).not.toMatch(/[📅✉️📚📷🩸] (Säsonger|Brev|Skoluppgifter|Lagfoton|Blodslinje)/u)
  })
})
