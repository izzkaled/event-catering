import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminSettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
        <CardDescription>App preferences, integrations, and configuration.</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">Coming next.</CardContent>
    </Card>
  )
}

