// Contractor truck data
export interface ContractorTruck {
  id: string
  company?: string
  tonnage?: string
  phoneNumber?: string
  driverName?: string
}

// Clean and deduplicated contractor truck data
export const CONTRACTOR_TRUCKS: ContractorTruck[] = [
  // A
  { id: "AIG07", tonnage: "20" },
  { id: "AIG08", tonnage: "20" },
  { id: "AIG11", tonnage: "20" },
  { id: "AVE06", tonnage: "21" },
  { id: "AVE07", tonnage: "20" },
  { id: "AVE08", tonnage: "20" },
  { id: "AVO10", tonnage: "18" },

  // B
  { id: "BR58", tonnage: "23" },
  { id: "BR60", tonnage: "24" },
  { id: "BR63", tonnage: "21" },
  { id: "BR65", tonnage: "22" },
  { id: "BR67", tonnage: "20" },
  { id: "BRW58", tonnage: "23" },
  { id: "BRW60", tonnage: "24" },
  { id: "BRW63", tonnage: "21" },
  { id: "BRW65", tonnage: "22" },
  { id: "BRW67", tonnage: "20" },

  // C
  { id: "CAL02", tonnage: "18" },
  { id: "CAL03", tonnage: "18" },
  { id: "CAL04", tonnage: "18" },
  { id: "CAL07", tonnage: "18" },
  { id: "CEN19", tonnage: "22.11" },
  { id: "CEN20", tonnage: "22.11" },
  { id: "CHA38", tonnage: "22.34" },
  { id: "CHA103", tonnage: "25.01" },
  { id: "CHA104", tonnage: "23.41" },
  { id: "CUT03", tonnage: "20" },
  { id: "CUT10", tonnage: "33" },
  { id: "CUT11", tonnage: "20" },
  { id: "CUT12", tonnage: "20" },

  // D
  { id: "DW75", tonnage: "Not Clear" },
  { id: "DW175", tonnage: "Not Clear" },

  // F
  { id: "FER40", tonnage: "23.16" },
  { id: "FER42", tonnage: "23.76" },
  { id: "FER43", tonnage: "22" },
  { id: "FER44", tonnage: "22.98" },
  { id: "FER45", tonnage: "22.98" },
  { id: "FER46", tonnage: "23.19" },
  { id: "FER47", tonnage: "23.19" },

  // G
  { id: "GEN09", tonnage: "18" },
  { id: "GEN10", tonnage: "18" },
  { id: "GEN11", tonnage: "18" },

  // H
  { id: "HUN03", tonnage: "21" },
  { id: "HUN05", tonnage: "22" },
  { id: "HUN09", tonnage: "21" },

  // J
  { id: "JJO07", tonnage: "24" },

  // K
  { id: "KAN01", tonnage: "20.63" },
  { id: "KAN02", tonnage: "20.39" },
  { id: "KAN04", tonnage: "23.25" },
  { id: "KAN05", tonnage: "20.16" },
  { id: "KIR11", tonnage: "22" },
  { id: "KIR20", tonnage: "22" },
  { id: "KIR22", tonnage: "23.52" },
  { id: "KIR25", tonnage: "22" },

  // L
  { id: "LEE01", tonnage: "21-22" },
  { id: "LEE07", tonnage: "23.59" },
  { id: "LEE99", tonnage: "23" },
  { id: "LHL06", tonnage: "21" },
  { id: "LIN40", tonnage: "20" },
  { id: "LOL2104", tonnage: "22.04" },

  // M
  { id: "MAGSEA", tonnage: "20" },
  { id: "MAT56", tonnage: "20" },
  { id: "MAT60", tonnage: "21" },
  { id: "MAT66", tonnage: "20" },
  { id: "MIN01", tonnage: "23.56" },
  { id: "MIN06", tonnage: "25" },

  // N
  { id: "NCH28", tonnage: "24" },
  { id: "NCH28P", tonnage: "39.65" },
  { id: "NCH38", tonnage: "22.54" },
  { id: "NCH40", tonnage: "22.51" },
  { id: "NCH44", tonnage: "24" },
  { id: "NCH48", tonnage: "22" },
  { id: "NCH48P", tonnage: "40.75" },
  { id: "NCH52", tonnage: "36" },
  { id: "NCH54", tonnage: "23.43" },
  { id: "NKT05", tonnage: "21" },
  { id: "NKT07", tonnage: "30" },
  { id: "NORT31", tonnage: "20" },
  { id: "NORT32", tonnage: "20" },

  // P
  { id: "PIR08", tonnage: "21" },
  { id: "PIR09", tonnage: "22.07" },
  { id: "PIR10", tonnage: "22.09" },
  { id: "PIR12", tonnage: "24.09" },
  { id: "PIR13", tonnage: "24.13" },

  // R
  { id: "RAN01", tonnage: "19.22" },
  { id: "RDC38", tonnage: "23.42" },
  { id: "RES08", tonnage: "23" },
  { id: "RK14", tonnage: "24.18" },

  // S
  { id: "SCH53", tonnage: "21" },
  { id: "SH1002", tonnage: "23" },
  { id: "SIC01", tonnage: "21.25" },
  { id: "SIC02", tonnage: "22.53" },
  { id: "SIC03", tonnage: "22.33" },
  { id: "SIC06", tonnage: "21" },
  { id: "SIC37", tonnage: "22" },
  { id: "SIC145", tonnage: "23" },
  { id: "SRS01", tonnage: "20" },
  { id: "SSS03", tonnage: "21" },
  { id: "SSS08", tonnage: "21" },
  { id: "SWA15", tonnage: "23.65" },
  { id: "SWA17", tonnage: "21" },
  { id: "SWA21", tonnage: "21.82" },
  { id: "SWA22", tonnage: "22.17" },
  { id: "SWA102", tonnage: "23.25" },
  { id: "SWA103", tonnage: "23.75" },
  { id: "SWA104", tonnage: "23.77" },

  // T
  { id: "TRA26", tonnage: "20" },
  { id: "TRA28", tonnage: "20" },
  { id: "TRC01", tonnage: "18.72" },

  // W
  { id: "WAT36", tonnage: "23.49" },
  { id: "WAT36P", tonnage: "37.11" },
  { id: "WAT48", tonnage: "21" },
  { id: "WOL34", tonnage: "22" },

  // Y
  { id: "YOR02", tonnage: "18" },
  { id: "YOR03", tonnage: "18" },
  { id: "YOR22", tonnage: "18" },
]

// Get all contractor trucks - explicitly exported as a named export
export function getAllContractorTrucks(): ContractorTruck[] {
  return CONTRACTOR_TRUCKS
}

// Get contractor truck by ID
export function getContractorTruckById(id: string): ContractorTruck | undefined {
  return CONTRACTOR_TRUCKS.find((truck) => truck.id === id)
}

// Get sorted contractor trucks
export function getSortedContractorTrucks(): ContractorTruck[] {
  return [...CONTRACTOR_TRUCKS].sort((a, b) => a.id.localeCompare(b.id))
}

// Get all contractor companies
export function getContractorCompanies(): string[] {
  const companies = new Set<string>()
  CONTRACTOR_TRUCKS.forEach((truck) => {
    if (truck.company) {
      companies.add(truck.company)
    }
  })
  return Array.from(companies).sort()
}

// Get trucks by company
export function getTrucksByCompany(company: string): ContractorTruck[] {
  return CONTRACTOR_TRUCKS.filter((truck) => truck.company === company)
}
