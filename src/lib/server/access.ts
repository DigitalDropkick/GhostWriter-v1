import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";

export type AccessConfig = { ACCESS_TEAM_DOMAIN?: string; ACCESS_AUD?: string };
export type AccessIdentity = Readonly<{ email: string; sub: string }>;

export class AccessError extends Error {
  constructor(
    public readonly status: 401 | 503,
    public readonly code: string,
  ) {
    super(code);
    this.name = "AccessError";
  }
}

const keySets = new Map<string, JWTVerifyGetKey>();

export async function validateAccess(
  request: Request,
  config: AccessConfig,
  // Dependency injection for cryptographic unit tests; never read from a request/binding.
  testKey?: JWTVerifyGetKey,
): Promise<AccessIdentity> {
  const domain = config.ACCESS_TEAM_DOMAIN?.replace(/\/$/, "");
  const audience = config.ACCESS_AUD?.trim();
  if (
    !domain ||
    !/^https:\/\/[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.cloudflareaccess\.com$/.test(domain) ||
    !audience
  ) {
    throw new AccessError(503, "access_configuration_missing");
  }
  const token = request.headers.get("cf-access-jwt-assertion");
  if (!token || token.length > 16384) throw new AccessError(401, "access_identity_required");
  let keys = testKey ?? keySets.get(domain);
  if (!keys) {
    keys = createRemoteJWKSet(new URL(`${domain}/cdn-cgi/access/certs`), {
      timeoutDuration: 5000,
      cooldownDuration: 30000,
      cacheMaxAge: 600000,
    });
    keySets.set(domain, keys);
  }
  try {
    const { payload } = await jwtVerify(token, keys, {
      issuer: domain,
      audience,
      algorithms: ["RS256"],
      requiredClaims: ["exp", "iat", "sub", "email"],
      clockTolerance: 0,
    });
    if (
      typeof payload.sub !== "string" ||
      !payload.sub ||
      typeof payload.email !== "string" ||
      !payload.email
    )
      throw new Error();
    return { email: payload.email, sub: payload.sub };
  } catch {
    // Never include JOSE error details, tokens, cookies or identity in logs/responses.
    throw new AccessError(401, "access_identity_invalid");
  }
}
