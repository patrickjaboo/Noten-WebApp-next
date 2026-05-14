export type OmrJobRequest = {
  path: string;
  semitones: number;
};

export type OmrJobResponse = {
  jobId: string;
};

// OMR-Service-Integration (Phase 3)
// Wird aktiviert wenn NEXT_PUBLIC_OMR_ENABLED=true und OMR_SERVICE_URL gesetzt ist.
export async function submitOmrJob(_req: OmrJobRequest): Promise<OmrJobResponse> {
  throw new Error("OMR-Service ist noch nicht konfiguriert. Siehe Phase 3 im Migrationsplan.");
}
