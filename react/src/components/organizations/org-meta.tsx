import { Briefcase, Building2, GraduationCap, HeartHandshake, Landmark, Network, Users, type LucideIcon } from 'lucide-react'
import { regionName } from '@/lib/countries'
import { normalize } from '@/api/explore'
import { orgTypeIds } from '@/api/orgExplore'
import type { OrgType } from '@/api/organizations'
import type { Organization } from '@/types'

/**
 * Types are free text today (no icon/slug), so the icon is guessed from the name.
 * Replace with a server-provided `slug` (docs/API_PENDIENTE_REACT.md §5).
 */
export function typeIcon(name: string): LucideIcon {
  const n = normalize(name)
  if (n.includes('academ') || n.includes('universi')) return GraduationCap
  if (n.includes('gubern') || n.includes('admin') || n.includes('govern')) return Landmark
  if (n.includes('ong') || n.includes('ngo') || n.includes('fundac')) return HeartHandshake
  if (n.includes('privad') || n.includes('private')) return Briefcase
  if (n.includes('comunid') || n.includes('communit') || n.includes('asoci')) return Users
  if (n.includes('consorc')) return Network
  return Building2
}

/** Names of all the organization's types, in the order they come. */
export function orgTypeNames(org: Organization, types: OrgType[]): string[] {
  return orgTypeIds(org)
    .map((id) => types.find((t) => t.id === id)?.type)
    .filter((name): name is string => !!name)
}

/** «España», «España +2», «Global» or null. */
export function orgCountryLabel(org: Organization, lang: string, globalLabel: string): string | null {
  const countries = org.countries ?? []
  if (countries.length === 0) return org.is_global ? globalLabel : null
  const first = regionName(countries[0], lang)
  return countries.length > 1 ? `${first} +${countries.length - 1}` : first
}
