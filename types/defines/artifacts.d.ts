/**
 * Artifacts — Git-compatible file storage on Cloudflare Workers.
 *
 * Provides programmatic access to create, manage, and fork repositories,
 * and to issue and revoke scoped access tokens.
 */

/** Information about a repository. */
interface ArtifactsRepoInfo {
  /** Unique repository ID. */
  id: string;
  /** Repository name. */
  name: string;
  /** ISO 8601 creation timestamp. */
  createdAt: string;
  /** Fork source (e.g. "github:owner/repo", "artifacts:namespace/repo"), or null if not a fork. */
  source: string | null;
  /** Whether the repository is read-only. */
  readOnly: boolean;
  /** HTTPS git remote URL. */
  remote: string;
}

/** Result of creating a repository — includes the initial access token. */
interface ArtifactsCreateRepoResult {
  /** Unique repository ID. */
  id: string;
  /** Repository name. */
  name: string;
  /** HTTPS git remote URL. */
  remote: string;
  /** Plaintext access token (only returned at creation time). */
  token: string;
  /** ISO 8601 token expiry timestamp. */
  expiresAt: string;
}

/** Paginated list of repositories. */
interface ArtifactsRepoListResult {
  /** Repositories in this page. */
  repos: ArtifactsRepoInfo[];
  /** Total number of repositories in the namespace. */
  total: number;
  /** Cursor for the next page, if there are more results. */
  cursor?: string;
}

/** Result of creating an access token. */
interface ArtifactsCreateTokenResult {
  /** Unique token ID. */
  id: string;
  /** Plaintext token (only returned at creation time). */
  plaintext: string;
  /** Token scope: "rw" (read-write) or "r" (read-only). */
  scope: string;
  /** ISO 8601 token expiry timestamp. */
  expiresAt: string;
}

/** Token validation result. */
interface ArtifactsTokenValidation {
  /** Whether the token is valid for the given repository. */
  valid: boolean;
  /** Token scope, if valid. */
  scope?: string;
}

/** Token metadata (no plaintext). */
interface ArtifactsTokenInfo {
  /** Unique token ID. */
  id: string;
  /** Token scope: "rw" or "r". */
  scope: string;
  /** ISO 8601 creation timestamp. */
  createdAt: string;
  /** ISO 8601 expiry timestamp. */
  expiresAt: string;
}

/** Paginated list of tokens for a repository. */
interface ArtifactsTokenListResult {
  /** Tokens in this page. */
  tokens: ArtifactsTokenInfo[];
  /** Total number of tokens for the repository. */
  total: number;
}

/** Handle for a single repository. Returned by Artifacts.create() and Artifacts.get(). */
interface ArtifactsRepo {
  /** Get repo info including remote URL. Returns null if repo no longer exists. */
  info(): Promise<ArtifactsRepoInfo | null>;

  // ── Tokens ──

  /**
   * Create an access token for this repo.
   * @param scope Token scope: "rw" (default) or "r".
   * @param ttl Time-to-live in seconds (default 86400, min 60, max 31536000).
   */
  createToken(
    scope?: 'rw' | 'r',
    ttl?: number
  ): Promise<ArtifactsCreateTokenResult>;

  /**
   * Validate a token against this repo.
   * @param token The plaintext token.
   */
  validateToken(token: string): Promise<ArtifactsTokenValidation>;

  /** List tokens for this repo (metadata only, no plaintext). */
  listTokens(): Promise<ArtifactsTokenListResult>;

  /**
   * Revoke a token by plaintext or ID.
   * @param tokenOrId Plaintext token or token ID.
   * @returns true if revoked, false if not found.
   */
  revokeToken(tokenOrId: string): Promise<boolean>;

  // ── Fork ──

  /**
   * Fork this repo to a new repo.
   * @param target Target: name, optional namespace (defaults to this binding's namespace), optional readOnly flag.
   */
  fork(target: {
    name: string;
    namespace?: string;
    readOnly?: boolean;
  }): Promise<ArtifactsCreateRepoResult & { objects: number }>;
}

/** Artifacts binding — namespace-level operations. */
interface Artifacts {
  /**
   * Create a new repository with an initial access token.
   * @param name Repository name (alphanumeric, dots, hyphens, underscores).
   * @param opts Optional: readOnly flag.
   * @returns Repo metadata with initial token, plus a repo handle.
   */
  create(
    name: string,
    opts?: { readOnly?: boolean }
  ): Promise<ArtifactsCreateRepoResult & { repo: ArtifactsRepo }>;

  /**
   * Get a handle to an existing repository.
   * @param name Repository name.
   * @returns Repo handle, or null if not found.
   */
  get(name: string): Promise<ArtifactsRepo | null>;

  /**
   * List repositories with cursor-based pagination.
   * @param opts Optional: limit (1–200, default 50), cursor for next page.
   */
  list(opts?: {
    limit?: number;
    cursor?: string;
  }): Promise<ArtifactsRepoListResult>;

  /**
   * Delete a repository and all associated tokens.
   * @param name Repository name.
   * @returns true if deleted, false if not found.
   */
  delete(name: string): Promise<boolean>;

  /**
   * Import a repository from an external source.
   * @param name Target repository name in artifacts.
   * @param source Import configuration: url, optional branch, headers, and readOnly flag.
   * @returns Repo metadata with initial token, plus a repo handle.
   */
  import(
    name: string,
    source: {
      url: string;
      branch?: string;
      headers?: Record<string, string>;
      readOnly?: boolean;
    }
  ): Promise<ArtifactsCreateRepoResult & { repo: ArtifactsRepo }>;
}
