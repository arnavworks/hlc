export interface RepairTrackingRequest {
  trackingNumber: string;
  sessionId?: string;
}

export interface RepairTrackingResponse {
  repair: {
    trackingNumber: string;
    status: string;
    statusLabel: string;
    deviceName: string | null;
    service: string | null;
    location: string | null;
    statusMessage: string | null;
    receivedAt: string;
    estimatedCompletion: string | null;
    updatedAt: string;
    updates: Array<{
      status: string;
      title: string;
      message: string | null;
      createdAt: string;
    }>;
  };
}
