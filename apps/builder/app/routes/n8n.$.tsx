import { type LoaderFunctionArgs, json } from "@remix-run/server-runtime";
import { isRouteErrorResponse, useRouteError } from "@remix-run/react";
import { z } from "zod";
import { findAuthenticatedUser } from "~/services/auth.server";
import { isDashboard, loginPath } from "~/shared/router-utils";
import env from "~/env/env.server";
import cookie from "cookie";
import { preventCrossOriginCookie } from "~/services/no-cross-origin-cookie";
import { redirect } from "~/services/no-store-redirect";
import { allowedDestinations } from "~/services/destinations.server";

const zN8NResponse = z.union([
  z.object({
    type: z.literal("error"),
    error: z.string(),
  }),

  z.object({
    type: z.literal("redirect"),
    to: z.string(),
  }),
]);
const zWebhookEnv = z.object({
  N8N_WEBHOOK_URL: z.string(),
  N8N_WEBHOOK_TOKEN: z.string(),
});

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  if (isDashboard(request) === false) {
    throw new Response("Not Found", {
      status: 404,
    });
  }

  preventCrossOriginCookie(request);
  allowedDestinations(request, ["document", "empty"]);
  // CSRF token checks are not necessary for dashboard-only pages.
  // All requests from the builder or canvas app are safeguarded either by preventCrossOriginCookie for fetch requests
  // or by allowedDestinations for iframe requests.

  const user = await findAuthenticatedUser(request);

  if (user === null) {
    const url = new URL(request.url);
    throw redirect(
      loginPath({
        returnTo: `${url.pathname}?${url.searchParams.toString()}`,
      })
    );
  }

  const webhookEnvParsed = zWebhookEnv.safeParse(env);
  if (webhookEnvParsed.success === false) {
    throw new Response(webhookEnvParsed.error.message, {
      status: 400,
    });
  }

  const webhookEnv = webhookEnvParsed.data;

  const n8nWebhookUrl = new URL(webhookEnv.N8N_WEBHOOK_URL);
  n8nWebhookUrl.pathname = `${n8nWebhookUrl.pathname}/${
    env.DEPLOYMENT_ENVIRONMENT ?? "local"
  }/${params["*"]}`
    .split("/")
    .filter(Boolean)
    .join("/");
  n8nWebhookUrl.search = new URL(request.url).search;

  const requestUrl = new URL(request.url);

  const response = await fetch(n8nWebhookUrl.href, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${webhookEnv.N8N_WEBHOOK_TOKEN}`,
    },
    body: JSON.stringify({
      userId: user.id,
      // For anonymous tracking like posthog
      cookies: cookie.parse(request.headers.get("cookie") ?? ""),
      requestUrl: requestUrl.href,
    }),
  });

  if (response.ok === false) {
    const text = await response.text();

    throw new Response(
      `Fetch error status="${response.status}"\nMessage:\n${text.slice(
        0,
        1000
      )}"`,
      {
        status: response.status,
      }
    );
  }
  const responseJson = await response.json();
  const n8nResponseParsed = zN8NResponse.safeParse(responseJson);

  if (n8nResponseParsed.success === false) {
    throw new Response(n8nResponseParsed.error.message, {
      status: 400,
    });
  }

  const n8nResponse = n8nResponseParsed.data;

  if (n8nResponse.type === "error") {
    throw new Response(n8nResponse.error, {
      status: 400,
    });
  }

  if (n8nResponse.type === "redirect") {
    throw redirect(n8nResponse.to);
  }

  n8nResponse satisfies never;

  return json({});
};

export const ErrorBoundary = () => {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return <div style={{ whiteSpace: "pre-wrap" }}>{error.data}</div>;
  }

  if (error instanceof Error) {
    return <div style={{ whiteSpace: "pre-wrap" }}>{error.message}</div>;
  }

  return <div style={{ whiteSpace: "pre-wrap" }}>{String(error)}</div>;
};
