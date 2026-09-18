import { describe, expect, it } from 'vitest'
import { commentaryPlayerReference } from '../matchUtils'

describe('spelarnamn i löpande matchreferat', () => {
  const karlsson = { id: '1', firstName: 'Oskar', lastName: 'Karlsson' }

  it('använder efternamn när det är entydigt', () => {
    expect(commentaryPlayerReference(karlsson, [karlsson, { id: '2', firstName: 'Erik', lastName: 'Svensson' }])).toBe('Karlsson')
  })

  it('behåller fullt namn vid efternamnskrock, även mellan lagen', () => {
    const anotherKarlsson = { id: '2', firstName: 'Ludvig', lastName: 'Karlsson' }
    expect(commentaryPlayerReference(karlsson, [karlsson, anotherKarlsson])).toBe('Oskar Karlsson')
    expect(commentaryPlayerReference(anotherKarlsson, [karlsson, anotherKarlsson])).toBe('Ludvig Karlsson')
  })
})
