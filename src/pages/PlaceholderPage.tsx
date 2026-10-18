import { Construction } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { NavItem } from '@/app/nav'

/** Screens whose backend endpoints are not built yet (docs/BUILD_PLAN.md in aqta). */
export function PlaceholderPage({ item }: { item: NavItem }) {
  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-semibold">{item.label}</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Construction className="size-4" /> Not built yet
          </CardTitle>
          <CardDescription>BRD: {item.brd}</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          This screen is waiting for its backend API. It will be wired up as the matching aqta module lands.
        </CardContent>
      </Card>
    </div>
  )
}
