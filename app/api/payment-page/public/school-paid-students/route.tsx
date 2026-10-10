// app/api/payment-page/public/school-paid-students/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/payment-page/public/school-paid-students
 *
 * Body: { pageSlug: string, email?: string, phone?: string }
 *
 * Returns every student the buyer has paid for on this page, with
 * the total amount paid toward each student.
 *
 * Source: `payment_page_payments` — no cookie, no account table.
 * The email/phone is only used to identify which payments belong
 * to this buyer.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pageSlug, email, phone } = body;

    if (!pageSlug || typeof pageSlug !== "string") {
      return NextResponse.json(
        { error: "pageSlug is required" },
        { status: 400 }
      );
    }

    const cleanEmail =
      typeof email === "string" ? email.trim().toLowerCase() : null;
    const cleanPhone = typeof phone === "string" ? phone.trim() : null;

    if (!cleanEmail && !cleanPhone) {
      return NextResponse.json({
        success: true,
        found: false,
        students: {},
        totalPaid: 0,
        buyerName: null,
        buyerEmail: null,
        buyerPhone: null,
      });
    }

    // Fetch the page
    const { data: page, error: pageError } = await supabase
      .from("payment_pages")
      .select("id, page_type, is_published")
      .eq("slug", pageSlug)
      .eq("is_published", true)
      .maybeSingle();

    if (pageError) {
      console.error("Page fetch error:", pageError);
      return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
    }

    if (!page) {
      return NextResponse.json(
        { error: "Payment page not found" },
        { status: 404 }
      );
    }

    if (page.page_type !== "school") {
      return NextResponse.json(
        { error: "This endpoint is only for school pages" },
        { status: 400 }
      );
    }

    // ─── Fetch all completed payments by this buyer on this page ───
    // Two separate queries instead of a single `.or(...)` filter so we
    // avoid PostgREST filter-string issues and use case-insensitive
    // email matching (`ilike`).
    const selectColumns =
      "id, amount, student_name, selected_students, customer_name, customer_email, customer_phone, payment_method, paid_at, created_at, status";

    const paymentsById = new Map<string, any>();

    if (cleanEmail) {
      const { data, error } = await supabase
        .from("payment_page_payments")
        .select(selectColumns)
        .eq("payment_page_id", page.id)
        .eq("status", "completed")
        .ilike("customer_email", cleanEmail);

      if (error) {
        console.error("Payments fetch error (email):", error);
        return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
      }

      for (const row of data || []) {
        paymentsById.set(row.id, row);
      }
    }

    if (cleanPhone) {
      const { data, error } = await supabase
        .from("payment_page_payments")
        .select(selectColumns)
        .eq("payment_page_id", page.id)
        .eq("status", "completed")
        .eq("customer_phone", cleanPhone);

      if (error) {
        console.error("Payments fetch error (phone):", error);
        return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
      }

      for (const row of data || []) {
        paymentsById.set(row.id, row);
      }
    }

    const rows = Array.from(paymentsById.values()).sort((a, b) => {
      const aTime = new Date(a.paid_at || a.created_at || 0).getTime();
      const bTime = new Date(b.paid_at || b.created_at || 0).getTime();
      return aTime - bTime;
    });

    const studentsMap: Record<
      string,
      {
        paidAmount: number;
        payments: Array<{
          id: string;
          amount: number;
          paidAt: string;
          method: string | null;
        }>;
        lastPaidAt: string | null;
      }
    > = {};

    let totalPaid = 0;
    let buyerName: string | null = null;
    let buyerEmail: string | null = null;
    let buyerPhone: string | null = null;

    for (const p of rows) {
      const amount = Number(p.amount) || 0;
      totalPaid += amount;

      if (!buyerName && p.customer_name) buyerName = p.customer_name;
      if (!buyerEmail && p.customer_email) buyerEmail = p.customer_email;
      if (!buyerPhone && p.customer_phone) buyerPhone = p.customer_phone;

      const names: string[] = [];

      // `selected_students` may be:
      //   - a real array (jsonb array)
      //   - a JSON-encoded string (rare, but possible)
      //   - null
      const rawSelected = p.selected_students;
      if (Array.isArray(rawSelected) && rawSelected.length > 0) {
        for (const n of rawSelected) {
          if (typeof n === "string" && n.trim().length > 0) {
            names.push(n.trim());
          }
        }
      } else if (typeof rawSelected === "string" && rawSelected.length > 0) {
        // Try to parse a JSON-encoded array like '["Ham Egginson"]'
        try {
          const parsed = JSON.parse(rawSelected);
          if (Array.isArray(parsed)) {
            for (const n of parsed) {
              if (typeof n === "string" && n.trim().length > 0) {
                names.push(n.trim());
              }
            }
          }
        } catch {
          // Not JSON — treat it as a single plain string
          if (rawSelected.trim().length > 0) {
            names.push(rawSelected.trim());
          }
        }
      }

      if (
        names.length === 0 &&
        typeof p.student_name === "string" &&
        p.student_name.trim().length > 0
      ) {
        names.push(p.student_name.trim());
      }

      if (names.length === 0) continue;

      const perStudent = amount / names.length;
      const paidAt =
        p.paid_at || p.created_at || new Date().toISOString();

      for (const name of names) {
        if (!studentsMap[name]) {
          studentsMap[name] = {
            paidAmount: 0,
            payments: [],
            lastPaidAt: null,
          };
        }
        studentsMap[name].paidAmount += perStudent;
        studentsMap[name].payments.push({
          id: p.id,
          amount: perStudent,
          paidAt,
          method: p.payment_method || null,
        });
        if (
          !studentsMap[name].lastPaidAt ||
          paidAt > studentsMap[name].lastPaidAt
        ) {
          studentsMap[name].lastPaidAt = paidAt;
        }
      }
    }

    // Round
    for (const key of Object.keys(studentsMap)) {
      studentsMap[key].paidAmount =
        Math.round(studentsMap[key].paidAmount * 100) / 100;
    }

    return NextResponse.json({
      success: true,
      found: Object.keys(studentsMap).length > 0,
      students: studentsMap,
      totalPaid: Math.round(totalPaid * 100) / 100,
      buyerName,
      buyerEmail,
      buyerPhone,
    });
  } catch (err: any) {
    console.error("school-paid-students error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}