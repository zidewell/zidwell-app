// app/api/cable-tv-products/route.ts
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { getNombaToken } from "@/lib/nomba";
import { isAuthenticatedWithRefresh, createAuthResponse } from "@/lib/auth-check-api";

const cableProductsCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000;
const RETRY_COUNT = 2;

async function getCachedCableProducts(service: string, retry = 0): Promise<any> {
  const cacheKey = `cable_products_${service.toLowerCase()}`;
  const cached = cableProductsCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    console.log(`✅ Using cached cable products for ${service}`);
    return cached.data;
  }
  
  console.log(`🔄 Fetching fresh cable products for ${service}`);
  
  try {
    const token = await getNombaToken();
    if (!token) throw new Error("Unauthorized");

    const response = await axios.get(
      `${process.env.NOMBA_URL}/v1/bill/cableTvProduct?cableTvType=${service}`,
      {
        maxBodyLength: Infinity,
        timeout: 10000,
        headers: {
          Authorization: `Bearer ${token}`,
          accountId: process.env.NOMBA_ACCOUNT_ID!,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data) {
      cableProductsCache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now()
      });
    }
    return response.data;
  } catch (error: any) {
    console.error(`❌ Failed to fetch cable products for ${service}:`, error.message);
    
    if (cached && retry >= RETRY_COUNT) {
      console.log(`🔄 Using stale cache as fallback for ${service}`);
      return cached.data;
    }
    
    if (retry < RETRY_COUNT) {
      console.log(`🔄 Retrying cable products fetch for ${service} (${retry + 1}/${RETRY_COUNT})`);
      return getCachedCableProducts(service, retry + 1);
    }
    throw error;
  }
}

function clearCableProductsCache(service?: string) {
  if (service) {
    cableProductsCache.delete(`cable_products_${service.toLowerCase()}`);
    console.log(`🧹 Cleared cable products cache for ${service}`);
  } else {
    cableProductsCache.clear();
    console.log(`🧹 Cleared all cable products cache`);
  }
}

export async function GET(req: NextRequest) {
  const { user, newTokens } = await isAuthenticatedWithRefresh(req);
  
  if (!user) {
    const response = NextResponse.json(
      { error: "Please login to access transactions", logout: true },
      { status: 401 }
    );
    if (newTokens) return createAuthResponse(await response.json(), newTokens);
    return response;
  }

  const service = req.nextUrl.searchParams.get("service");
  const nocache = req.nextUrl.searchParams.get("nocache") === "true";

  if (!service) {
    return NextResponse.json(
      { error: "Missing service parameter in query string" },
      { status: 400 }
    );
  }

  try {
    if (nocache) clearCableProductsCache(service);
    const data = await getCachedCableProducts(service);
    if (newTokens) return createAuthResponse(data, newTokens);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error fetching cable TV products:", error.message);
    
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized", logout: true }, { status: 401 });
    }
    
    return NextResponse.json(
      { error: "Failed to fetch cable TV products" },
      { status: 500 }
    );
  }
}