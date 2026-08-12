import {
  BRIDGE_BASE_URL,
  isCallBridgeHealthy,
  startCallOnBridge,
} from '~/pages/call-station/start-call-on-bridge';

const startCallInput = {
  phone: '+15555550100',
  name: 'Jane Doe',
  brokerage: 'Call Station QA',
};

describe('startCallOnBridge', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('should return true when the bridge accepts the start request', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true });

    const didStart = await startCallOnBridge(startCallInput);

    expect(didStart).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(`${BRIDGE_BASE_URL}/call/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(startCallInput),
    });
  });

  it('should return false when the bridge is unreachable', async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValue(new TypeError('Failed to fetch'));

    const didStart = await startCallOnBridge(startCallInput);

    expect(didStart).toBe(false);
  });

  it('should return false when the bridge responds with a non-OK status', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 503 });

    const didStart = await startCallOnBridge(startCallInput);

    expect(didStart).toBe(false);
  });
});

describe('isCallBridgeHealthy', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('should return true when /health is OK', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true });

    await expect(isCallBridgeHealthy()).resolves.toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(`${BRIDGE_BASE_URL}/health`);
  });

  it('should return false when /health is unreachable', async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(isCallBridgeHealthy()).resolves.toBe(false);
  });
});
