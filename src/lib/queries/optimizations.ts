export async function getOptimizations(
  supabase: ReturnType<typeof import("@/lib/supabase/client").createClient>,
  accountId: number,
  options?: {
    statuses?: string[];
    categories?: string[];
    dateStart?: string;
    dateEnd?: string;
    limit?: number;
  },
) {
  let query = supabase
    .schema("ads")
    .from("optimization_log")
    .select("id, category, action_summary, client_title, client_impact, scope_detail, status, executed_at, details")
    .eq("external_customer_id", accountId)
    .order("executed_at", { ascending: false });

  if (options?.statuses && options.statuses.length > 0) {
    query = query.in("status", options.statuses);
  }
  if (options?.categories && options.categories.length > 0) {
    query = query.in("category", options.categories);
  }
  if (options?.dateStart) {
    query = query.gte("executed_at", options.dateStart);
  }
  if (options?.dateEnd) {
    query = query.lte("executed_at", options.dateEnd + "T23:59:59");
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) console.error("getOptimizations:", error);
  return data ?? [];
}
