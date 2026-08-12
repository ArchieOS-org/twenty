export const BRIDGE_BASE_URL = 'http://127.0.0.1:8787';

export const CALL_BRIDGE_OFFLINE_COPY = 'Call bridge offline';

type StartCallOnBridgeInput = {
  phone: string;
  name: string;
  brokerage: string;
};

export const isCallBridgeHealthy = async (
  abortSignal?: AbortSignal,
): Promise<boolean> => {
  try {
    const response = await fetch(
      `${BRIDGE_BASE_URL}/health`,
      abortSignal ? { signal: abortSignal } : undefined,
    );

    return response.ok;
  } catch {
    return false;
  }
};

export const startCallOnBridge = async ({
  phone,
  name,
  brokerage,
}: StartCallOnBridgeInput): Promise<boolean> => {
  try {
    const response = await fetch(`${BRIDGE_BASE_URL}/call/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone,
        name,
        brokerage,
      }),
    });

    return response.ok;
  } catch {
    return false;
  }
};
