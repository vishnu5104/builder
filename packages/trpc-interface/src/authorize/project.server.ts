import type { AppContext } from "../context/context.server";
import memoize from "memoize";

export type AuthPermit = "view" | "edit" | "build" | "admin" | "own";

type CheckInput = {
  namespace: "Project";
  id: string;

  permit: AuthPermit;

  subjectSet: {
    namespace: "User" | "Token";
    id: string;
  };
};

const check = async (
  postgrestClient: AppContext["postgrest"]["client"],
  input: CheckInput
) => {
  const { subjectSet } = input;

  if (subjectSet.namespace === "User") {
    // We check only if the user is the owner of the project
    const row = await postgrestClient
      .from("Project")
      .select("id")
      .eq("id", input.id)
      .eq("userId", subjectSet.id)
      .maybeSingle();
    if (row.error) {
      throw row.error;
    }

    return { allowed: row.data !== null };
  }

  const permitToRelationRewrite = {
    view: ["viewers", "editors", "builders", "administrators"],
    edit: ["editors", "builders", "administrators"],
    build: ["builders", "administrators"],
    admin: ["administrators"],
  } as const;

  if (subjectSet.namespace === "Token" && input.permit !== "own") {
    const row = await postgrestClient
      .from("AuthorizationToken")
      .select("token")
      .eq("token", subjectSet.id)
      .in("relation", [...permitToRelationRewrite[input.permit]])
      .maybeSingle();
    if (row.error) {
      throw row.error;
    }

    return { allowed: row.data !== null };
  }

  return { allowed: false };
};

// doesn't work in cloudflare workers
const memoizedCheck = memoize(check, {
  // 1 minute
  maxAge: 60 * 1000,
  cacheKey: ([_context, input]) => JSON.stringify(input),
});

type AuthInfo =
  | {
      type: "user";
      userId: string;
    }
  | {
      type: "token";
      authToken: string;
    }
  | {
      type: "service";
    };

export const checkProjectPermit = async (
  projectId: string,
  permit: AuthPermit,
  authInfo: AuthInfo,
  postgrestClient: AppContext["postgrest"]["client"]
) => {
  const checks = [];
  const namespace = "Project";

  if (authInfo.type === "service") {
    return permit === "view";
  }

  // @todo Delete and use tokens
  const templateIds = [
    // Production
    "5e086cf4-4293-471c-8eab-ddca8b5cd4db",
    "94e6e1b8-c6c4-485a-9d7a-8282e11920c0",
    "05954204-fcee-407e-b47f-77a38de74431",
    "afc162c2-6396-41b7-a855-8fc04604a7b1",
    // Staging IDs
    "c236999d-be6b-43fb-9edc-78a2ba59e56d",
    "a1371dce-752c-4ccf-8ea4-88bab577fe50",
  ];

  // @todo Delete and use tokens
  if (permit === "view" && templateIds.includes(projectId)) {
    return true;
  }

  if (authInfo.type === "token") {
    // Token doesn't have "own" permit, do not check it
    if (permit === "own") {
      return false;
    }

    checks.push(
      memoizedCheck(postgrestClient, {
        namespace,
        id: projectId,
        subjectSet: {
          id: authInfo.authToken,
          namespace: "Token",
        },
        permit: permit,
      })
    );
  }

  // Check if the user is allowed to access the project
  if (authInfo.type === "user") {
    checks.push(
      memoizedCheck(postgrestClient, {
        subjectSet: {
          namespace: "User",
          id: authInfo.userId,
        },
        namespace,
        id: projectId,
        permit: permit,
      })
    );
  }

  if (checks.length === 0) {
    return false;
  }

  const authResults = await Promise.allSettled(checks);

  for (const authResult of authResults) {
    if (authResult.status === "rejected") {
      throw new Error(`Authorization call failed ${authResult.reason}`);
    }
  }

  const allowed = authResults.some(
    (authResult) =>
      authResult.status === "fulfilled" && authResult.value.allowed
  );

  return allowed;
};

export const hasProjectPermit = async (
  props: {
    projectId: string;
    permit: AuthPermit;
  },
  context: AppContext
) => {
  const { authorization } = context;

  if (authorization.type === "anonymous") {
    return false;
  }

  const authInfo: AuthInfo = authorization;

  if (authInfo === undefined) {
    return false;
  }

  return checkProjectPermit(
    props.projectId,
    props.permit,
    authInfo,
    context.postgrest.client
  );
};

/**
 * Returns the first allowed permit from the list or undefined if none is allowed
 * @todo think about caching to authorizeTrpc.check.query
 * batching check queries would help too https://github.com/ory/keto/issues/812
 */
export const getProjectPermit = async <T extends AuthPermit>(
  props: {
    projectId: string;
    permits: readonly T[];
  },
  context: AppContext
): Promise<T | undefined> => {
  const permitToCheck = props.permits;

  const permits = await Promise.allSettled(
    permitToCheck.map((permit) =>
      hasProjectPermit({ projectId: props.projectId, permit }, context)
    )
  );

  for (const permit of permits) {
    if (permit.status === "rejected") {
      throw new Error(`Authorization call failed ${permit.reason}`);
    }

    if (permit.value === true) {
      return permitToCheck[permits.indexOf(permit)];
    }
  }
};
