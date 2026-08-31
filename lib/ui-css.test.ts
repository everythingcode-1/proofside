import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8")

describe("responsive trading controls", () => {
  it("reserves a separate nonshrinking column for the contract unit", () => {
    expect(css).toMatch(/\.amount-input\{[^}]*display:grid;[^}]*grid-template-columns:minmax\(0,1fr\) auto/)
    expect(css).toMatch(/\.amount-input span\{[^}]*min-width:84px;[^}]*border-left:1px solid/)
  })
})
