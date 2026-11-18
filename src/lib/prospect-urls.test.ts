import { describe, expect, it } from 'vitest'
import { domainOf, parseProspectList, parseProspectUrl } from './prospect-urls'

describe('parseProspectUrl', () => {
  it('adds a scheme to a bare domain', () => {
    expect(parseProspectUrl('example.com/blog')).toBe('https://example.com/blog')
  })

  it('keeps an existing scheme', () => {
    expect(parseProspectUrl('http://example.com/')).toBe('http://example.com/')
  })

  it('drops the trailing comma a spreadsheet export leaves behind', () => {
    expect(parseProspectUrl('example.com,')).toBe('https://example.com/')
  })

  it('rejects a hostname with no dot, which is a typo rather than a site', () => {
    expect(parseProspectUrl('localhost')).toBeNull()
    expect(parseProspectUrl('not a url')).toBeNull()
  })

  it('rejects an empty line', () => {
    expect(parseProspectUrl('   ')).toBeNull()
  })
})

describe('parseProspectList', () => {
  it('splits on newlines, commas and stray whitespace alike', () => {
    const urls = parseProspectList('a.com\nb.com, c.com   d.com')
    expect(urls).toEqual([
      'https://a.com/',
      'https://b.com/',
      'https://c.com/',
      'https://d.com/',
    ])
  })

  it('keeps the first occurrence and drops repeats', () => {
    expect(parseProspectList('a.com\nhttps://a.com\na.com')).toEqual(['https://a.com/'])
  })

  it('skips lines it cannot read instead of failing the whole paste', () => {
    expect(parseProspectList('a.com\nnonsense\nb.com')).toEqual([
      'https://a.com/',
      'https://b.com/',
    ])
  })
})

describe('domainOf', () => {
  it('strips the scheme and www', () => {
    expect(domainOf('https://www.example.com/a/b')).toBe('example.com')
  })

  it('returns an empty string for something that is not a url', () => {
    expect(domainOf('nonsense')).toBe('')
  })
})
