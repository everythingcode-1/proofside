import { getForecastStore } from "@/lib/forecast-store"
type Context = { params: Promise<{ id: string }> }
export async function GET(_request: Request, context: Context) {
  const receipt = getForecastStore().getById((await context.params).id)
  return receipt ? Response.json({ receipt }) : Response.json({ code: "NOT_FOUND", message: "Receipt not found." }, { status: 404 })
}
