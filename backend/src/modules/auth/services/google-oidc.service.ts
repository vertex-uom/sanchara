import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { AppConfig } from '../../../common/config/app-config.service.js';
import { AppException } from '../../../common/errors/app-exception.js';
import { RedisService } from '../../../common/redis/redis.service.js';
import type { Audience } from '../../../common/security/session.service.js';
import { OAUTH_STATE_TTL } from '../auth.policy.js';
import { checkGoogleClaims, decodeJwtPayload, type GoogleProfile } from '../helpers/google-claims.js';
import { isWellFormedToken, pkceChallenge, randomToken, sha256 } from '../../../common/security/tokens.js';

const AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

type PendingState = { audience: Audience; verifier: string; nonce: string; returnTo: string | null };

const stateKey = (state: string) => `oauth:google:${sha256(state)}`;

function oauthFailed(code: string, message: string) {
  return new AppException(HttpStatus.BAD_REQUEST, code, message);
}

// Server-side authorization code flow with PKCE, state and nonce. The callback
// lands on the web app (BFF), which posts code + state here. Each audience has
// its own callback URL, and a state only completes the audience that started it.
@Injectable()
export class GoogleOidcService {
  private readonly logger = new Logger(GoogleOidcService.name);

  constructor(
    private readonly config: AppConfig,
    private readonly redis: RedisService,
  ) {}

  async start(audience: Audience, returnTo: string | null): Promise<{ authorizationUrl: string; state: string }> {
    const state = randomToken();
    const pending: PendingState = { audience, verifier: randomToken(), nonce: randomToken(), returnTo };
    await this.redis.set(stateKey(state), JSON.stringify(pending), 'EX', OAUTH_STATE_TTL);

    const url = new URL(AUTHORIZE_URL);
    url.search = new URLSearchParams({
      client_id: this.config.google.clientId,
      redirect_uri: this.callbackUrl(audience),
      response_type: 'code',
      scope: 'openid email profile',
      state,
      nonce: pending.nonce,
      code_challenge: pkceChallenge(pending.verifier),
      code_challenge_method: 'S256',
      prompt: 'select_account',
    }).toString();
    return { authorizationUrl: url.toString(), state };
  }

  // Single-use state; exchanges the code and returns a verified Google profile.
  async complete(
    audience: Audience,
    code: string,
    state: string,
  ): Promise<{ profile: GoogleProfile; returnTo: string | null }> {
    const raw = isWellFormedToken(state) ? await this.redis.getdel(stateKey(state)) : null;
    const pending = raw ? (JSON.parse(raw) as PendingState) : null;
    if (!pending || pending.audience !== audience) {
      throw oauthFailed('OAUTH_STATE_INVALID', 'This sign-in link has expired. Please try again.');
    }

    const idToken = await this.exchange(code, pending.verifier, this.callbackUrl(audience));
    const claims = idToken ? decodeJwtPayload(idToken) : null;
    const profile = claims
      ? checkGoogleClaims(claims, {
          clientId: this.config.google.clientId,
          nonce: pending.nonce,
          nowSeconds: Math.floor(Date.now() / 1000),
        })
      : null;
    if (!profile) throw oauthFailed('GOOGLE_SIGN_IN_FAILED', 'Google sign-in failed. Please try again.');
    return { profile, returnTo: pending.returnTo };
  }

  private callbackUrl(audience: Audience): string {
    const { callbackUrl, staffCallbackUrl, adminCallbackUrl } = this.config.google;
    if (audience === 'staff') return staffCallbackUrl;
    return audience === 'admin' ? adminCallbackUrl : callbackUrl;
  }

  private async exchange(code: string, verifier: string, callbackUrl: string): Promise<string | null> {
    const { clientId, clientSecret } = this.config.google;
    try {
      const response = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: callbackUrl,
          grant_type: 'authorization_code',
          code_verifier: verifier,
        }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) {
        // Status only: the body can echo the code.
        this.logger.warn(`Google token exchange failed with ${response.status}`);
        return null;
      }
      const body = (await response.json()) as { id_token?: unknown };
      return typeof body.id_token === 'string' ? body.id_token : null;
    } catch (error) {
      this.logger.warn(`Google token exchange error: ${error instanceof Error ? error.name : 'unknown'}`);
      return null;
    }
  }
}
