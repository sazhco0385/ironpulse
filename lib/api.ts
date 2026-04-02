function getApiBase(): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (!domain) return "http://localhost:3001";
  return `https://${domain}`;
}

export async function loginUser(
  email: string,
): Promise<{ success: boolean; userId?: number; name?: string; profileData?: string | null; workoutData?: string | null; error?: string }> {
  try {
    const base = getApiBase();
    const res = await fetch(`${base}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error ?? "Login fehlgeschlagen" };
    return { success: true, userId: data.userId, name: data.name, profileData: data.profileData, workoutData: data.workoutData };
  } catch {
    return { success: false, error: "Netzwerkfehler" };
  }
}

export async function fetchProfile(
  userId: number,
): Promise<{ success: boolean; profileData?: string | null; workoutData?: string | null; error?: string }> {
  try {
    const base = getApiBase();
    const res = await fetch(`${base}/api/auth/profile/${userId}`);
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error };
    return { success: true, profileData: data.profileData, workoutData: data.workoutData };
  } catch {
    return { success: false, error: "Netzwerkfehler" };
  }
}

export async function syncProfile(
  userId: number,
  profileData?: string,
  workoutData?: string,
): Promise<{ success: boolean }> {
  try {
    const base = getApiBase();
    const body: Record<string, string> = {};
    if (profileData !== undefined) body.profileData = profileData;
    if (workoutData !== undefined) body.workoutData = workoutData;
    const res = await fetch(`${base}/api/auth/profile/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return { success: res.ok };
  } catch {
    return { success: false };
  }
}

export async function registerUser(name: string, email: string, profileData?: string): Promise<{ success: boolean; userId?: number; error?: string }> {
  try {
    const base = getApiBase();
    const res = await fetch(`${base}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email }),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error ?? "Fehler beim Senden" };
    return { success: true, userId: data.userId };
  } catch {
    return { success: false, error: "Netzwerkfehler" };
  }
}

export type MembershipPlan = "monthly" | "quarterly" | "semi_annual" | "annual";

export interface PayPalOrderResult {
  orderId: string;
  approveUrl: string;
}

export async function createPayPalOrder(
  userId: number,
  plan: MembershipPlan,
  returnUrl: string,
  cancelUrl: string,
): Promise<{ success: boolean; data?: PayPalOrderResult; error?: string }> {
  try {
    const base = getApiBase();
    const res = await fetch(`${base}/api/paypal/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, plan, returnUrl, cancelUrl }),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error ?? "Bestellung fehlgeschlagen" };
    return { success: true, data };
  } catch {
    return { success: false, error: "Netzwerkfehler" };
  }
}

export async function capturePayPalOrder(
  orderId: string,
  userId: number,
  plan: MembershipPlan,
): Promise<{ success: boolean; membership?: { plan: string; expiresAt: string }; error?: string }> {
  try {
    const base = getApiBase();
    const res = await fetch(`${base}/api/paypal/capture-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, userId, plan }),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error ?? "Zahlung fehlgeschlagen" };
    return { success: true, membership: data.membership };
  } catch {
    return { success: false, error: "Netzwerkfehler" };
  }
}

export async function verifyMembership(
  userId: number,
): Promise<{ isPremium: boolean; plan?: string; expiresAt?: string }> {
  try {
    const base = getApiBase();
    const res = await fetch(`${base}/api/paypal/verify/${userId}`);
    if (!res.ok) return { isPremium: false };
    const data = await res.json();
    return {
      isPremium: data.isPremium,
      plan: data.membership?.plan,
      expiresAt: data.membership?.expiresAt,
    };
  } catch {
    return { isPremium: false };
  }
}
