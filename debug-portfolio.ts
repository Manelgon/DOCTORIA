import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://kiyuvgrsszyvsybmblwk.supabase.co"
const serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpeXV2Z3Jzc3p5dnN5Ym1ibHdrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTE0OTM5MCwiZXhwIjoyMDg0NzI1MzkwfQ.zirISsQMGbO3Nz_884wNPYPaAMPxRupgbKrH5fkakRs"

const supabase = createClient(supabaseUrl, serviceKey)

async function runDebug() {
    const portfolioId = "d106cde8-e0f7-4280-a9cd-6d493a7ff971"
    console.log(`\n=== COMPREHENSIVE DEBUG [${new Date().toISOString()}] ===`)

    // 1. Check existing tables in public schema
    console.log("\n--- Listing Tables ---")
    const { data: tables, error: tablesError } = await supabase.rpc('get_tables_info')

    // If RPC doesn't exist (likely), try a direct query via a common table to see if we can at least reach the DB
    if (tablesError) {
        console.log("RPC get_tables_info failed (expected). Trying direct table checks...")
    }

    // 2. Direct existence checks with error inspection
    const tablesToCheck = ["carteras", "pacientes", "profiles", "carteras_acceso", "carteras_compartidas", "carteras_invitaciones", "notificaciones"]
    for (const table of tablesToCheck) {
        const { error } = await supabase.from(table).select("count").limit(1)
        if (error) {
            console.log(`[ABSENT/ERROR] ${table}: ${error.code} - ${error.message}`)
        } else {
            console.log(`[PRESENT] ${table}`)
        }
    }

    // 3. Inspect specific portfolio record
    console.log("\n--- Portfolio Data (Service Role) ---")
    const { data: cartera } = await supabase.from("carteras").select("*").eq("id", portfolioId).single()
    console.log("Cartera:", JSON.stringify(cartera, null, 2))

    // 4. Try to find the user session context (from logs if possible, but here we just check if it's accessible)
    // Actually, let's check the RLS policies if we can
    console.log("\n--- RLS Policies ---")
    const { data: policies, error: polError } = await supabase.rpc('inspect_policies')
    if (polError) {
        // Try to query pg_policies via a generic query if possible (requires a custom function usually)
        console.log("No custom policy inspector found.")
    }
}

runDebug()
