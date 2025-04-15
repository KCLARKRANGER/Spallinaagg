import Link from "next/link"
import { Button } from "@/components/ui/button"

export function ScheduleHeader() {
  return (
    <header className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
      <div>
        <h1 className="text-3xl font-bold">Aggregate & Concrete Scheduler</h1>
        <p className="text-muted-foreground">Upload and manage your trucking schedule</p>
      </div>
      <div className="flex gap-2">
        <Link href="/trucks">
          <Button variant="outline">Manage Trucks</Button>
        </Link>
      </div>
    </header>
  )
}
