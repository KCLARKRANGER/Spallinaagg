import { TruckManagement } from "@/components/truck-management"

export default function TrucksPage() {
  return (
    <main className="container mx-auto p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-6">Truck & Driver Management</h1>
      <TruckManagement />
    </main>
  )
}
